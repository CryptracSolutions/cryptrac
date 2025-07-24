-- Phase 5: NOWPayments Integration Database Updates
-- Add missing fields for real payment processing

-- Update merchant_payments table for NOWPayments integration
ALTER TABLE merchant_payments 
ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id),
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS amount_received NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency_received VARCHAR(10),
ADD COLUMN IF NOT EXISTS pay_address TEXT,
ADD COLUMN IF NOT EXISTS pay_amount NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS cryptrac_fee NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gateway_fee NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS merchant_receives NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update payment_links table for better tracking
ALTER TABLE payment_links 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;

-- Update webhook_logs table for better NOWPayments integration
ALTER TABLE webhook_logs 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'nowpayments',
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50),
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Rename conflicting columns if they exist
DO $$ 
BEGIN
    -- Check if old columns exist and rename them
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'headers') THEN
        ALTER TABLE webhook_logs RENAME COLUMN headers TO request_headers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'payload') THEN
        ALTER TABLE webhook_logs RENAME COLUMN payload TO request_payload;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'signature') THEN
        ALTER TABLE webhook_logs RENAME COLUMN signature TO request_signature;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignore errors if columns don't exist
        NULL;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_payments_payment_link_id ON merchant_payments(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_order_id ON merchant_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Merchants can view their payment data" ON merchant_payments;
    DROP POLICY IF EXISTS "System can insert payment data" ON merchant_payments;
    DROP POLICY IF EXISTS "System can update payment data" ON merchant_payments;
    DROP POLICY IF EXISTS "Allow webhook logging" ON webhook_logs;
EXCEPTION
    WHEN others THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Enable RLS on tables if not already enabled
ALTER TABLE merchant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merchant_payments
CREATE POLICY "Merchants can view their payment data" ON merchant_payments
FOR SELECT USING (
    merchant_id IN (
        SELECT id FROM merchants WHERE user_id = auth.uid()
    ) OR auth.email() = 'admin@cryptrac.com'
);

CREATE POLICY "System can insert payment data" ON merchant_payments
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payment data" ON merchant_payments
FOR UPDATE USING (true);

-- Create RLS policy for webhook_logs
CREATE POLICY "Allow webhook logging" ON webhook_logs
FOR INSERT WITH CHECK (true);

-- Function to update payment link usage count
CREATE OR REPLACE FUNCTION update_payment_link_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage count when a payment is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE payment_links 
        SET 
            usage_count = COALESCE(usage_count, 0) + 1,
            last_payment_at = NOW()
        WHERE id = NEW.payment_link_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_payment_link_usage ON merchant_payments;

-- Create trigger for payment link usage tracking
CREATE TRIGGER trigger_update_payment_link_usage
    AFTER INSERT OR UPDATE ON merchant_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_link_usage();

-- Add some default supported currencies if table is empty
INSERT INTO supported_currencies (code, name, symbol, enabled, nowpayments_code, created_at, updated_at)
VALUES 
    ('BTC', 'Bitcoin', 'BTC', true, 'btc', NOW(), NOW()),
    ('ETH', 'Ethereum', 'ETH', true, 'eth', NOW(), NOW()),
    ('LTC', 'Litecoin', 'LTC', true, 'ltc', NOW(), NOW()),
    ('USDT', 'Tether', 'USDT', true, 'usdterc20', NOW(), NOW()),
    ('USDC', 'USD Coin', 'USDC', true, 'usdc', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nowpayments_code = EXCLUDED.nowpayments_code,
    updated_at = NOW();

-- Add comment for tracking
COMMENT ON TABLE merchant_payments IS 'Updated for Phase 5 NOWPayments integration';
COMMENT ON TABLE webhook_logs IS 'Updated for Phase 5 NOWPayments webhook handling';
COMMENT ON TABLE supported_currencies IS 'Updated for Phase 5 dynamic currency support';

