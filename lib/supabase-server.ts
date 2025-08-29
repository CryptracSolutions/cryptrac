// lib/supabase-server.ts
import 'server-only'; // Mark as server-only - errors if imported to client
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server client using @supabase/ssr for proper Next.js compatibility
export async function createServerClient() {
  const cookieStore = await cookies();
  
  console.log('All server cookies:', cookieStore.getAll().map(c => `${c.name.substring(0, 30)}...=${c.value.substring(0, 20)}...`));

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.log('Cannot set cookies in read-only context - this is expected behavior');
          }
        },
      },
    }
  );
}
