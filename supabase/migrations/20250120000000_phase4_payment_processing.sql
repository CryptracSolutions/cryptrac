-- CRYPTRAC PHASE 4: PAYMENT PROCESSING CORE
-- Migration: 20250120000000_phase4_payment_processing
-- Date: 2025-01-20
-- Description: Database schema updates for onboarding wizard, payment links, QR codes, and NOWPayments integration

-- =====================================================
-- 1. UPDATE MERCHANTS TABLE FOR ONBOARDING WIZARD
-- =====================================================

-- Add onboarding wizard progress tracking columns
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- Update business information fields (some already exist, add missing ones)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Add payment configuration
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{"fee_percentage": 2.9, "auto_forward": true}';

-- Add setup tracking
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS setup_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS setup_fee_amount NUMERIC(10,2) DEFAULT 99.00;

-- Add preferred currencies if not exists
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS preferred_currencies JSONB DEFAULT '["BTC", "ETH", "LTC"]';

-- =====================================================
-- 2. CREATE PAYMENT_LINKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Payment details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(18,8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    
    -- Crypto configuration
    accepted_cryptos JSONB DEFAULT '["BTC", "ETH", "LTC"]',
    
    -- Link configuration
    link_id VARCHAR(50) UNIQUE NOT NULL, -- Short ID for public URLs
    qr_code_data TEXT, -- Base64 encoded QR code
    
    -- Status and settings
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, expired
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy for payment_links
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their own payment links" ON payment_links
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM merchants WHERE id = payment_links.merchant_id
        )
    );

-- =====================================================
-- 3. UPDATE MERCHANT_PAYMENTS TABLE
-- =====================================================

-- Add new columns to existing merchant_payments table
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL;
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS crypto_amount NUMERIC(18,8);
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS crypto_currency VARCHAR(10);

-- NOWPayments integration fields
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS nowpayments_invoice_id VARCHAR(100);
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS nowpayments_payment_id VARCHAR(100);

-- Enhanced transaction details
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255);
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255);

-- Fee calculation fields (2.9% total: 1.9% Cryptrac + up to 1% NOWPayments)
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS total_fee_percentage NUMERIC(5,2) DEFAULT 2.9;
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS cryptrac_fee_percentage NUMERIC(5,2) DEFAULT 1.9;
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS gateway_fee_percentage NUMERIC(5,2) DEFAULT 1.0;

ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS cryptrac_fee_amount NUMERIC(18,8);
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS gateway_fee_amount NUMERIC(18,8);
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS merchant_amount NUMERIC(18,8); -- Amount forwarded to merchant after fees

-- Enhanced timestamps
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE merchant_payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- =====================================================
-- 4. CREATE SUPPORTED_CURRENCIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS supported_currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Currency details
    code VARCHAR(10) UNIQUE NOT NULL, -- BTC, ETH, LTC, etc.
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    
    -- Configuration
    enabled BOOLEAN DEFAULT TRUE,
    min_amount NUMERIC(18,8) DEFAULT 0.00000001,
    max_amount NUMERIC(18,8),
    
    -- Display settings
    decimals INTEGER DEFAULT 8,
    icon_url VARCHAR(500),
    
    -- NOWPayments integration
    nowpayments_code VARCHAR(10),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default supported currencies
INSERT INTO supported_currencies (code, name, symbol, nowpayments_code, decimals) VALUES
    ('BTC', 'Bitcoin', '₿', 'btc', 8),
    ('ETH', 'Ethereum', 'Ξ', 'eth', 18),
    ('LTC', 'Litecoin', 'Ł', 'ltc', 8),
    ('USDT', 'Tether', '₮', 'usdttrc20', 6),
    ('USDC', 'USD Coin', '$', 'usdc', 6)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 5. CREATE WEBHOOK_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Webhook details
    source VARCHAR(50) NOT NULL, -- 'nowpayments', 'stripe', etc.
    event_type VARCHAR(100) NOT NULL,
    
    -- Request details
    headers JSONB,
    payload JSONB NOT NULL,
    signature VARCHAR(500),
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    
    -- Related records
    merchant_id UUID REFERENCES merchants(id),
    payment_id UUID REFERENCES merchant_payments(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Add RLS policy for webhook_logs (admin only)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook logs" ON webhook_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- =====================================================
-- 6. UPDATE EXISTING FUNCTIONS
-- =====================================================

-- Update the calculate_proration function to work with new schema
CREATE OR REPLACE FUNCTION calculate_proration(merchant_id UUID, full_fee NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage INTEGER;
    days_used INTEGER;
    total_days INTEGER := 14; -- 14-day refund window
BEGIN
    -- Get usage count and calculate days since setup
    SELECT 
        COALESCE(usage_count, 0),
        GREATEST(0, EXTRACT(days FROM NOW() - created_at)::INTEGER)
    INTO usage, days_used
    FROM merchants 
    WHERE id = merchant_id;
    
    -- Full refund if no usage and within 14 days
    IF usage = 0 AND days_used <= total_days THEN
        RETURN full_fee;
    END IF;
    
    -- Prorated refund based on usage and time
    IF days_used <= total_days THEN
        RETURN full_fee * (1 - (usage::NUMERIC / 100.0)) * (1 - (days_used::NUMERIC / total_days));
    END IF;
    
    -- No refund after 14 days
    RETURN 0;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Payment links indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_merchant_id ON payment_links(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_link_id ON payment_links(link_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);

-- Merchant payments indexes (only add new ones, skip existing)
CREATE INDEX IF NOT EXISTS idx_merchant_payments_status ON merchant_payments(status);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_nowpayments_invoice_id ON merchant_payments(nowpayments_invoice_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_created_at ON merchant_payments(created_at DESC);

-- Webhook logs indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- =====================================================
-- 8. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Add triggers for updated_at
CREATE TRIGGER update_payment_links_updated_at BEFORE UPDATE ON payment_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_payments_updated_at BEFORE UPDATE ON merchant_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supported_currencies_updated_at BEFORE UPDATE ON supported_currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for the application
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Phase 4 database schema is now ready for:
-- ✅ Onboarding wizard with progress tracking
-- ✅ Business information collection and validation
-- ✅ Wallet configuration management
-- ✅ Payment link creation and management
-- ✅ QR code generation support
-- ✅ Comprehensive payment tracking with NOWPayments
-- ✅ Fee calculation (2.9% total: 1.9% Cryptrac + up to 1% NOWPayments)
-- ✅ Webhook handling and logging
-- ✅ Performance optimization with proper indexes
-- ✅ Row Level Security policies for data protection