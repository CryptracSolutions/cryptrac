-- Add global charge_customer_fee toggle to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS charge_customer_fee BOOLEAN DEFAULT FALSE;

-- Add per-link charge_customer_fee override to payment_links table
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS charge_customer_fee BOOLEAN;

-- Add comments to document the new fields
COMMENT ON COLUMN merchants.charge_customer_fee IS 'Global setting: true = customer pays gateway fee, false = merchant absorbs gateway fee';
COMMENT ON COLUMN payment_links.charge_customer_fee IS 'Per-link override for charge_customer_fee (null = inherit from merchant global setting)';

-- Update any existing merchants to have the default value
UPDATE merchants SET charge_customer_fee = FALSE WHERE charge_customer_fee IS NULL;
