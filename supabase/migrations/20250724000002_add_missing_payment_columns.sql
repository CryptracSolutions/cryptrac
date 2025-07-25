-- Add missing columns to merchant_payments table for Phase 5
-- Date: 2025-07-24
-- Phase: 5 - NOWPayments Integration Missing Columns Fix

-- Add all the missing columns that the API is trying to use
ALTER TABLE merchant_payments 
ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id),
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS amount_received NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency_received VARCHAR(20),
ADD COLUMN IF NOT EXISTS pay_address TEXT,
ADD COLUMN IF NOT EXISTS pay_amount NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS cryptrac_fee NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gateway_fee NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS merchant_receives NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_payments_payment_link_id ON merchant_payments(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_order_id ON merchant_payments(order_id);

-- Add comment for tracking
COMMENT ON TABLE merchant_payments IS 'Updated for Phase 5 NOWPayments integration - all required columns added';

