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

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/terms', '/privacy'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If no session and trying to access protected route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If session exists, check role-based access
  if (session) {
    const role = session.user.user_metadata.role || 'merchant';
    const email = session.user.email;

    // Admin routes - hardcoded email check
    if (pathname.startsWith('/admin')) {
      if (email !== 'admin@cryptrac.com' && role !== 'admin') {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Rep routes
    if (pathname.startsWith('/rep')) {
      if (role !== 'rep' && role !== 'admin') {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Partner routes
    if (pathname.startsWith('/partner')) {
      if (role !== 'partner' && role !== 'admin') {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Merchant routes (default for authenticated users)
    if (pathname.startsWith('/merchant')) {
      if (role !== 'merchant' && role !== 'admin') {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Redirect authenticated users away from login/signup
    if (pathname === '/login' || pathname === '/signup') {
      let redirectPath = '/';
      
      // Role-based default redirects
      switch (role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'rep':
          redirectPath = '/rep/dashboard';
          break;
        case 'partner':
          redirectPath = '/partner/dashboard';
          break;
        case 'merchant':
        default:
          redirectPath = '/merchant/dashboard';
          break;
      }
      
      const redirectUrl = new URL(redirectPath, request.url);
      return NextResponse.redirect(redirectUrl);
    }
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
