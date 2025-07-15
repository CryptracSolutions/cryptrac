-- Add Foreign Keys (with checks to skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_user_id_fkey') THEN
    ALTER TABLE merchants ADD CONSTRAINT merchants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reps_user_id_fkey') THEN
    ALTER TABLE reps ADD CONSTRAINT reps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_user_id_fkey') THEN
    ALTER TABLE partners ADD CONSTRAINT partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rep_sales_rep_id_fkey') THEN
    ALTER TABLE rep_sales ADD CONSTRAINT rep_sales_rep_id_fkey FOREIGN KEY (rep_id) REFERENCES reps(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rep_sales_merchant_id_fkey') THEN
    ALTER TABLE rep_sales ADD CONSTRAINT rep_sales_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_bonus_log_rep_id_fkey') THEN
    ALTER TABLE monthly_bonus_log ADD CONSTRAINT monthly_bonus_log_rep_id_fkey FOREIGN KEY (rep_id) REFERENCES reps(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fiat_payouts_user_id_fkey') THEN
    ALTER TABLE fiat_payouts ADD CONSTRAINT fiat_payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_messages_user_id_fkey') THEN
    ALTER TABLE support_messages ADD CONSTRAINT support_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_payments_merchant_id_fkey') THEN
    ALTER TABLE merchant_payments ADD CONSTRAINT merchant_payments_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'upgrade_history_merchant_id_fkey') THEN
    ALTER TABLE upgrade_history ADD CONSTRAINT upgrade_history_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey') THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add Indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_reps_user_id ON reps(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_rep_sales_rep_id ON rep_sales(rep_id);
CREATE INDEX IF NOT EXISTS idx_rep_sales_merchant_id ON rep_sales(merchant_id);
CREATE INDEX IF NOT EXISTS idx_monthly_bonus_log_rep_id ON monthly_bonus_log(rep_id);
CREATE INDEX IF NOT EXISTS idx_fiat_payouts_user_id ON fiat_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_merchant_id ON merchant_payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_history_merchant_id ON upgrade_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Add Columns (with checks if not exists, using ALTER IF NOT EXISTS in PostgreSQL 9.6+)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'preferred_currency') THEN
    ALTER TABLE merchants ADD COLUMN preferred_currency text DEFAULT 'USD';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reps' AND column_name = 'preferred_currency') THEN
    ALTER TABLE reps ADD COLUMN preferred_currency text DEFAULT 'USD';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'preferred_currency') THEN
    ALTER TABLE partners ADD COLUMN preferred_currency text DEFAULT 'USD';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reps' AND column_name = 'referral_code') THEN
    ALTER TABLE reps ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'referral_code') THEN
    ALTER TABLE partners ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Add Checks (with checks to skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_trial_end') THEN
    ALTER TABLE merchants ADD CONSTRAINT check_trial_end CHECK (trial_end > created_at);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_tier') THEN
    ALTER TABLE reps ADD CONSTRAINT check_tier CHECK (tier BETWEEN 1 AND 3);
  END IF;
END $$;

-- Update Function (CREATE OR REPLACE is safe, runs every time)
CREATE OR REPLACE FUNCTION public.handle_monthly_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Per Bible: On validation, increment sales, check for $100 every 3, add tiered commission on setup fee
  -- (Full leaderboard ties in monthly cron per Section 11)
  -- Assume setup_fee = 99, tier from reps table
  DECLARE
    current_sales INT;
    tier_percentage INT;
    commission NUMERIC;
  BEGIN
    current_sales := (SELECT total_sales + 1 FROM reps WHERE id = NEW.rep_id FOR UPDATE);
    UPDATE reps SET total_sales = current_sales WHERE id = NEW.rep_id;
    
    -- $100 every 3 validated sales
    IF current_sales % 3 = 0 THEN
      UPDATE reps SET total_commission = total_commission + 100 WHERE id = NEW.rep_id;
      INSERT INTO monthly_bonus_log (rep_id, month, sales_count, bonus_amount, paid) 
      VALUES (NEW.rep_id, date_trunc('month', NOW()), current_sales, 100, false);
    END IF;
    
    -- Tiered commission on $99 setup (per Bible Section 7.3.1)
    SELECT CASE tier WHEN 1 THEN 50 WHEN 2 THEN 75 WHEN 3 THEN 100 END INTO tier_percentage FROM reps WHERE id = NEW.rep_id;
    commission := 99 * (tier_percentage / 100.0);
    UPDATE reps SET total_commission = total_commission + commission WHERE id = NEW.rep_id;
    
    RETURN NEW;
  END;
END;
$function$;

-- Fix Trigger (DROP IF EXISTS, then CREATE)
DROP TRIGGER IF EXISTS after_rep_sales_update ON rep_sales;
CREATE TRIGGER after_rep_sales_update
AFTER UPDATE ON public.rep_sales
FOR EACH ROW
WHEN (OLD.validated IS DISTINCT FROM NEW.validated AND NEW.validated = true)
EXECUTE FUNCTION handle_monthly_bonus();

-- Add Admin Override to RLS Policies (DROP IF EXISTS, then CREATE to refresh)
-- Merchants (example; repeat pattern)
DROP POLICY IF EXISTS "Merchants view own" ON merchants;
CREATE POLICY "Merchants view own" ON merchants FOR SELECT USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');
DROP POLICY IF EXISTS "Merchants update own" ON merchants;
CREATE POLICY "Merchants update own" ON merchants FOR UPDATE USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');

-- Reps
DROP POLICY IF EXISTS "Reps view own" ON reps;
CREATE POLICY "Reps view own" ON reps FOR SELECT USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');
DROP POLICY IF EXISTS "Reps update own" ON reps;
CREATE POLICY "Reps update own" ON reps FOR UPDATE USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');

-- Partners
DROP POLICY IF EXISTS "Partners view own" ON partners;
CREATE POLICY "Partners view own" ON partners FOR SELECT USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');
DROP POLICY IF EXISTS "Partners update own" ON partners;
CREATE POLICY "Partners update own" ON partners FOR UPDATE USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');

-- Rep Sales
DROP POLICY IF EXISTS "Rep sales view own" ON rep_sales;
CREATE POLICY "Rep sales view own" ON rep_sales FOR SELECT USING (rep_id = (SELECT id FROM reps WHERE user_id = auth.uid()) OR auth.email() = 'admin@cryptrac.com');

-- Monthly Bonus Log
DROP POLICY IF EXISTS "Monthly bonus log view" ON monthly_bonus_log;
CREATE POLICY "Monthly bonus log view" ON monthly_bonus_log FOR SELECT USING (rep_id = (SELECT id FROM reps WHERE user_id = auth.uid()) OR auth.email() = 'admin@cryptrac.com');

-- Merchant Payments
DROP POLICY IF EXISTS "Merchant payments view own" ON merchant_payments;
CREATE POLICY "Merchant payments view own" ON merchant_payments FOR SELECT USING (merchant_id = (SELECT id FROM merchants WHERE user_id = auth.uid()) OR auth.email() = 'admin@cryptrac.com');

-- Fiat Payouts
DROP POLICY IF EXISTS "Fiat payouts view" ON fiat_payouts;
CREATE POLICY "Fiat payouts view" ON fiat_payouts FOR SELECT USING (user_id = auth.uid() OR auth.email() = 'admin@cryptrac.com');

-- Support Messages
DROP POLICY IF EXISTS "Support messages view" ON support_messages;
CREATE POLICY "Support messages view" ON support_messages FOR SELECT USING (user_id = auth.uid() OR auth.email() = 'admin@cryptrac.com');

-- Audit Logs (admin only for view)
DROP POLICY IF EXISTS "Audit logs view admin" ON audit_logs;
CREATE POLICY "Audit logs view admin" ON audit_logs FOR SELECT USING (auth.email() = 'admin@cryptrac.com');

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bonus_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiat_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_history ENABLE ROW LEVEL SECURITY;