-- CRYPTRAC PHASE 4C: DATABASE FIXES (CORRECTED)
-- Migration: phase4c_database_fixes_corrected
-- Date: 2025-01-22
-- Description: Fix RLS policies and database issues for Phase 4C payment functionality

-- =====================================================
-- 1. FIX RLS POLICIES FOR MERCHANTS TABLE
-- =====================================================

-- Drop existing RLS policies for merchants if they exist
DROP POLICY IF EXISTS "Users can manage their own merchant profile" ON merchants;
DROP POLICY IF EXISTS "Merchants can manage their own profile" ON merchants;

-- Create new RLS policy that allows authenticated users to create and manage their own merchant records
CREATE POLICY "Users can manage their own merchant records" ON merchants
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 2. FIX RLS POLICIES FOR PAYMENT_LINKS TABLE
-- =====================================================

-- Drop existing RLS policies for payment_links if they exist
DROP POLICY IF EXISTS "Merchants can manage their own payment links" ON payment_links;

-- Create new RLS policy that works with the merchant relationship
CREATE POLICY "Merchants can manage their own payment links" ON payment_links
    FOR ALL USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. FIX RLS POLICIES FOR MERCHANT_PAYMENTS TABLE
-- =====================================================

-- Drop existing RLS policies for merchant_payments if they exist
DROP POLICY IF EXISTS "Merchants can view their own payments" ON merchant_payments;

-- Create new RLS policy for merchant_payments
CREATE POLICY "Merchants can manage their own payments" ON merchant_payments
    FOR ALL USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 4. ADD UNIQUE CONSTRAINT AND CREATE MERCHANT RECORD
-- =====================================================

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'merchants_user_id_unique'
    ) THEN
        ALTER TABLE merchants ADD CONSTRAINT merchants_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Insert merchant record for the current test user (now with proper unique constraint)
INSERT INTO merchants (
    user_id,
    business_name,
    country,
    onboarded,
    plan,
    usage_count,
    created_at
) VALUES (
    'e9d3e06c-2d3c-4920-9247-a56f57db9652',
    'Cryptrac',
    'US',
    false,
    'cryptrac',
    0,
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 5. ENSURE PROPER PERMISSIONS
-- =====================================================

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON merchants TO authenticated;
GRANT ALL ON payment_links TO authenticated;
GRANT ALL ON merchant_payments TO authenticated;
GRANT ALL ON webhook_logs TO authenticated;
GRANT ALL ON supported_currencies TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 6. CREATE HELPER FUNCTION FOR MERCHANT LOOKUP
-- =====================================================

-- Function to get merchant ID for current user
CREATE OR REPLACE FUNCTION get_current_merchant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    merchant_uuid UUID;
BEGIN
    SELECT id INTO merchant_uuid
    FROM merchants
    WHERE user_id = auth.uid();
    
    RETURN merchant_uuid;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_current_merchant_id() TO authenticated;

-- =====================================================
-- 7. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index for user_id lookup in merchants table
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);

-- Add index for merchant_id lookup in payment_links table
CREATE INDEX IF NOT EXISTS idx_payment_links_merchant_id ON payment_links(merchant_id);

-- Add index for merchant_id lookup in merchant_payments table
CREATE INDEX IF NOT EXISTS idx_merchant_payments_merchant_id ON merchant_payments(merchant_id);

-- =====================================================
-- 8. VERIFY TABLES EXIST AND HAVE CORRECT STRUCTURE
-- =====================================================

-- Ensure payment_links table has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_links' AND column_name = 'current_uses') THEN
        ALTER TABLE payment_links ADD COLUMN current_uses INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_links' AND column_name = 'qr_code_data') THEN
        ALTER TABLE payment_links ADD COLUMN qr_code_data TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_links' AND column_name = 'updated_at') THEN
        ALTER TABLE payment_links ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 9. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for payment_links
DROP TRIGGER IF EXISTS update_payment_links_updated_at ON payment_links;
CREATE TRIGGER update_payment_links_updated_at 
    BEFORE UPDATE ON payment_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for merchants (add updated_at column first if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'updated_at') THEN
        ALTER TABLE merchants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at 
    BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary of changes:
-- ✅ Fixed RLS policies for merchants, payment_links, and merchant_payments tables
-- ✅ Added unique constraint on merchants.user_id
-- ✅ Created merchant record for existing test user
-- ✅ Granted proper permissions to authenticated users
-- ✅ Added helper function for merchant lookup
-- ✅ Added performance indexes
-- ✅ Ensured all required columns exist
-- ✅ Added updated_at triggers

-- The database is now ready for Phase 4C payment functionality!

