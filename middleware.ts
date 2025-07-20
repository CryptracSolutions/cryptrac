import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Routes that are completely public (no auth needed)
  const publicRoutes = ['/', '/terms', '/privacy'];
  
  // Auth routes (login/signup) - handle differently
  const authRoutes = ['/login', '/signup'];
  
  // Skip middleware for public routes
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Handle auth routes (login/signup)
    if (authRoutes.includes(pathname)) {
      // If user is already logged in, redirect to appropriate dashboard
      if (session && !error) {
        const role = session.user.user_metadata?.role || 'merchant';
        const email = session.user.email;
        
        let redirectPath = '/merchant/dashboard';
        
        if (email === 'admin@cryptrac.com' || role === 'admin') {
          redirectPath = '/admin';
        } else if (role === 'rep') {
          redirectPath = '/rep/dashboard';
        } else if (role === 'partner') {
          redirectPath = '/partner/dashboard';
        }
        
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl);
      }
      // If no session, allow access to login/signup
      return response;
    }

    // For protected routes, check authentication
    if (!session || error) {
      // Only redirect to login if we're sure there's no session
      // This prevents redirect loops during login process
      const hasAuthCookies = request.cookies.has('sb-jngvlbimfmvhpupbpuuj-auth-token');
      
      if (!hasAuthCookies) {
        const redirectUrl = new URL('/login', request.url);
        return NextResponse.redirect(redirectUrl);
      }
      
      // If auth cookies exist but session failed, let the page handle it
      return response;
    }

    // Role-based access control for authenticated users
    const role = session.user.user_metadata?.role || 'merchant';
    const email = session.user.email;

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (email !== 'admin@cryptrac.com' && role !== 'admin') {
        const redirectUrl = new URL('/merchant/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Rep routes
    if (pathname.startsWith('/rep')) {
      if (role !== 'rep' && role !== 'admin') {
        const redirectUrl = new URL('/merchant/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Partner routes
    if (pathname.startsWith('/partner')) {
      if (role !== 'partner' && role !== 'admin') {
        const redirectUrl = new URL('/merchant/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Merchant routes
    if (pathname.startsWith('/merchant')) {
      if (role !== 'merchant' && role !== 'admin') {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

  } catch (error) {
    // If middleware fails, let the page handle authentication
    console.warn('Middleware error:', error);
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
