-- Enable extensions (for UUIDs, encryption as per Bible Section 3)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables (from Bible data model)
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  wallets JSONB DEFAULT '{}', -- For coin addresses, enabled flags (Bible Section 6)
  trial_end TIMESTAMPTZ,
  onboarded BOOLEAN DEFAULT FALSE,
  country TEXT DEFAULT 'US',
  plan TEXT DEFAULT 'cryptrac',
  subscription_id TEXT,
  usage_count INTEGER DEFAULT 0, -- For proration (Section 6)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  total_sales INTEGER DEFAULT 0,
  tier INTEGER DEFAULT 1, -- For commissions (Section 7)
  total_commission NUMERIC(18,2) DEFAULT 0,
  w9_submitted BOOLEAN DEFAULT FALSE,
  pending BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_bonus NUMERIC(18,2) DEFAULT 0,
  w9_submitted BOOLEAN DEFAULT FALSE,
  pending BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rep_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_id UUID REFERENCES reps(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  validated BOOLEAN DEFAULT FALSE,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE monthly_bonus_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_id UUID REFERENCES reps(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  sales_count INTEGER,
  rank INTEGER,
  bonus_amount NUMERIC(18,2),
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE merchant_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  invoice_id TEXT,
  amount NUMERIC(18,2),
  currency TEXT,
  pay_currency TEXT,
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID DEFAULT uuid_generate_v4(),
  role TEXT,
  user_id UUID,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  user_id UUID,
  affected_id UUID,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE upgrade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  amount_paid NUMERIC(18,2),
  stripe_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fiat_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Functions (from Bible, e.g., proration with 2025 Stripe behaviors)
CREATE OR REPLACE FUNCTION calculate_proration(merchant_id UUID, full_fee NUMERIC) RETURNS NUMERIC AS $$
DECLARE
  usage INT;
BEGIN
  SELECT usage_count INTO usage FROM merchants WHERE id = merchant_id;
  -- Proration logic: full refund if usage=0, else reduce by usage % (adjust per Bible Appendix A)
  IF usage = 0 THEN
    RETURN full_fee;
  ELSE
    RETURN full_fee * (1 - (usage / 100.0));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_monthly_bonus() RETURNS TRIGGER AS $$
BEGIN
  -- Calc rank, ties, split (simplified; full logic per Section 7)
  INSERT INTO monthly_bonus_log (rep_id, month, sales_count, rank, bonus_amount)
  VALUES (NEW.rep_id, DATE_TRUNC('month', NOW()), (SELECT COUNT(*) FROM rep_sales WHERE rep_id = NEW.rep_id AND validated), 1, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER after_rep_sales_update
AFTER UPDATE ON rep_sales FOR EACH ROW
WHEN (NEW.validated = TRUE AND OLD.validated = FALSE)
EXECUTE PROCEDURE handle_monthly_bonus();

-- RLS Policies (for security, per Section 3)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants view own" ON merchants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Merchants update own" ON merchants FOR UPDATE USING (auth.uid() = user_id);

-- Add similar for other tables (abbreviated)
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reps view own" ON reps FOR SELECT USING (auth.uid() = user_id);

-- Storage Buckets (for W-9, promo; per Section 3/7)
-- Run these in dashboard or via CLI if not supported in SQL
-- Bucket: w9_uploads (private)
-- Policy: INSERT with CHECK (bucket_id = 'w9_uploads' AND auth.uid() = owner)

-- Bucket: promo_kits (public read)
-- Policy: SELECT with CHECK (bucket_id = 'promo_kits')