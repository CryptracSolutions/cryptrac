import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key) => req.cookies.get(key)?.value || null,
          setItem: (key, value) => res.cookies.set(key, value),
          removeItem: (key) => res.cookies.delete(key),
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('Middleware: No session detected');
    return NextResponse.redirect(new URL('/login', req.url));
  } else {
    console.log('Middleware: Session detected', session.user.email);
  }
  return res;
}

export const config = {
  matcher: ['/admin/:path*'], // Apply to /admin routes
};