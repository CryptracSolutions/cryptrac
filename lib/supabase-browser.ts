// lib/supabase-browser.ts
import { createClient } from '@supabase/supabase-js';

export const createBrowserClient = () => 
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );