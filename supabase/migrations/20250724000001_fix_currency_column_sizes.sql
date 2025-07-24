-- Fix column sizes for longer currency codes
-- Some NOWPayments currencies have codes longer than 10 characters
-- Date: 2025-07-24
-- Phase: 5 - NOWPayments Integration Column Size Fix

-- Update supported_currencies table (this is the main issue)
ALTER TABLE supported_currencies 
ALTER COLUMN code TYPE VARCHAR(20),
ALTER COLUMN symbol TYPE VARCHAR(20),
ALTER COLUMN nowpayments_code TYPE VARCHAR(20);

-- Update merchant_payments table (correct column names)
ALTER TABLE merchant_payments
ALTER COLUMN currency TYPE VARCHAR(20),
ALTER COLUMN pay_currency TYPE VARCHAR(20);

-- Update payment_links table
ALTER TABLE payment_links
ALTER COLUMN currency TYPE VARCHAR(20);

-- Add comment for tracking
COMMENT ON TABLE supported_currencies IS 'Column sizes updated for Phase 5 NOWPayments integration - supports longer currency codes';