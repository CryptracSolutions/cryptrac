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
            // Handle chunked cookies (e.g., sb-xxx-auth-token.0, sb-xxx-auth-token.1)
            const allCookies = cookieStore.getAll();
            const matchingCookies = allCookies
              .filter(cookie => cookie.name === key || cookie.name.startsWith(`${key}.`))
              .sort((a, b) => {
                // Sort by chunk number if present
                const aChunk = a.name.includes('.') ? parseInt(a.name.split('.').pop() || '0') : 0;
                const bChunk = b.name.includes('.') ? parseInt(b.name.split('.').pop() || '0') : 0;
                return aChunk - bChunk;
              });
            
            if (matchingCookies.length === 0) {
              console.log(`Getting cookie ${key}: undefined`); // Debug
              return null;
            }
            
            // Concatenate chunked cookie values
            const value = matchingCookies.map(cookie => cookie.value).join('');
            console.log(`Getting cookie ${key}: ${value ? 'found' : 'undefined'} (${matchingCookies.length} chunks)`); // Debug
            return value || null;
          },
          setItem: (key: string, value: string, options: CookieOptions = {}) => {
            console.log(`Setting cookie ${key}: ${value ? 'has_value' : 'empty'}`); // Debug
            
            // Handle large values by chunking into multiple cookies
            const CHUNK_SIZE = 3800; // Conservative size to avoid cookie limits
            
            if (value.length > CHUNK_SIZE) {
              // Split large value into chunks
              const chunks = [];
              for (let i = 0; i < value.length; i += CHUNK_SIZE) {
                chunks.push(value.slice(i, i + CHUNK_SIZE));
              }
              
              // Set chunked cookies
              chunks.forEach((chunk, index) => {
                const chunkKey = index === 0 ? key : `${key}.${index}`;
                cookieStore.set({ name: chunkKey, value: chunk, ...options });
              });
            } else {
              cookieStore.set({ name: key, value, ...options });
            }
          },
          removeItem: (key: string, options: CookieOptions = {}) => {
            console.log(`Removing cookie ${key}`); // Debug
            
            // Remove the main cookie and any chunked versions
            const allCookies = cookieStore.getAll();
            const cookiesToRemove = allCookies.filter(cookie => 
              cookie.name === key || cookie.name.startsWith(`${key}.`)
            );
            
            cookiesToRemove.forEach(cookie => {
              cookieStore.delete({ name: cookie.name, ...options });
            });
          },
        },
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}
