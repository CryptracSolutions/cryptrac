// lib/supabase-server.ts
import 'server-only'; // Mark as server-only - errors if imported to client
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Type for cookie options
type CookieOptions = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
};

export async function createServerClient() {
  const cookieStore = await cookies(); // Await the cookies object
  console.log('All server cookies:', cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')); // Debug all cookies

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            const value = cookieStore.get(key)?.value;
            console.log(`Getting cookie ${key}: ${value || 'undefined'}`); // Debug
            return value;
          },
          setItem: (key: string, value: string, options: CookieOptions = {}) => {
            console.log(`Setting cookie ${key}=${value}`); // Debug
            cookieStore.set({ name: key, value, ...options });
          },
          removeItem: (key: string, options: CookieOptions = {}) => {
            console.log(`Removing cookie ${key}`); // Debug
            cookieStore.delete({ name: key, ...options });
          },
        },
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}