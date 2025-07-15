-- Add pending column to reps table (with check to skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reps' AND column_name = 'pending') THEN
    ALTER TABLE reps ADD COLUMN pending boolean DEFAULT true;
  END IF;
END $$;

-- Add pending column to partners table (with check to skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'pending') THEN
    ALTER TABLE partners ADD COLUMN pending boolean DEFAULT true;
  END IF;
END $$;

-- Update RLS policies for reps and partners (to allow views including pending, with admin override)
DROP POLICY IF EXISTS "Reps view own" ON reps;
CREATE POLICY "Reps view own" ON reps FOR SELECT USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');
DROP POLICY IF EXISTS "Reps update own" ON reps;
CREATE POLICY "Reps update own" ON reps FOR UPDATE USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');

DROP POLICY IF EXISTS "Partners view own" ON partners;
CREATE POLICY "Partners view own" ON partners FOR SELECT USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');
DROP POLICY IF EXISTS "Partners update own" ON partners;
CREATE POLICY "Partners update own" ON partners FOR UPDATE USING (auth.uid() = user_id OR auth.email() = 'admin@cryptrac.com');