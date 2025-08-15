import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const EXCLUDED_PREFIXES = [
  '/_next', '/static', '/assets', '/api',
  '/favicon.ico', '/robots.txt', '/sitemap.xml', '/manifest.json'
]

// Public routes we never gate/redirect in middleware (route code can handle any auth it needs)
const PUBLIC_PREFIXES = ['/r/', '/pay/', '/login', '/signup']

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const host = url.host.toLowerCase()
  const path = url.pathname

  // 0) Skip excluded paths immediately (prevents asset/API loops)
  if (EXCLUDED_PREFIXES.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // 1) Canonical host redirect (only if needed)
  //    If user hits apex cryptrac.com, send a single 308 to www.cryptrac.com and stop.
  if (host === 'cryptrac.com') {
    url.host = 'www.cryptrac.com'
    return NextResponse.redirect(url, 308)
  }

  // 2) Leave public pages alone (no auth gating in middleware)
  if (PUBLIC_PREFIXES.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // 3) Refresh Supabase session & sync cookies (no redirects here)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the request cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Recreate the response to include updated cookies
          supabaseResponse = NextResponse.next({ request })
          // Mirror cookies onto the response with original options
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Just refresh the session; do not redirect here
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  // Match all routes EXCEPT Next.js internals, static assets, images, API, and common public files
  matcher: [
    '/((?!_next|static|assets|api|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
