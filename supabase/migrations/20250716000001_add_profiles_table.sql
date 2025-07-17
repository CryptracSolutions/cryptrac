-- Add profiles table for role metadata (Bible Section 5)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'merchant' CHECK (role IN ('merchant', 'rep', 'partner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles (own view/update, admin override)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles view own" ON profiles FOR SELECT USING (auth.uid() = id OR auth.email() = 'admin@cryptrac.com');
CREATE POLICY "Profiles update own" ON profiles FOR UPDATE USING (auth.uid() = id OR auth.email() = 'admin@cryptrac.com');