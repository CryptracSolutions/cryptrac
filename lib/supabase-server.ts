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

// Server client with cookie handling
export async function createServerClient( ) {
  const cookieStore = await cookies(); // Await the cookies object
  console.log('All server cookies:', cookieStore.getAll().map(c => `${c.name}=${c.value}`));

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            // Handle chunked cookies (split across multiple cookies like .0, .1, etc.)
            let value = cookieStore.get(key)?.value;
            
            if (!value) {
              // Check for chunked cookies
              const chunks: string[] = [];
              let chunkIndex = 0;
              
              while (true) {
                const chunkCookie = cookieStore.get(`${key}.${chunkIndex}`);
                if (!chunkCookie) break;
                
                let chunkValue = chunkCookie.value;
                // Handle base64 prefix in chunks
                if (chunkValue.startsWith('base64-')) {
                  chunkValue = chunkValue.substring(7);
                }
                chunks.push(chunkValue);
                chunkIndex++;
              }
              
              if (chunks.length > 0) {
                value = chunks.join('');
              }
            }
            
            console.log(`Getting cookie ${key}: ${value ? 'found' : 'undefined'}`); // Debug
            return value || null; // ✅ Return null instead of undefined
          },
          setItem: (key: string, _value: string, _options: CookieOptions = {}) => {
            console.log(`Cannot set cookie ${key} during SSR`); // Debug
            // Cannot set cookies during SSR in Next.js 15
            // This will be handled by the client-side or in route handlers
          },
          removeItem: (key: string, _options: CookieOptions = {}) => {
            console.log(`Cannot remove cookie ${key} during SSR`); // Debug
            // Cannot delete cookies during SSR in Next.js 15
            // This will be handled by the client-side or in route handlers
          },
        },
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}
