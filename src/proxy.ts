import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. Anti-Bot Shield: Require User-Agent
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    return new NextResponse('Forbidden: Missing or invalid User-Agent (Anti-Bot Shield)', { status: 403 })
  }

  // 2. CSRF Guard: Validate Origin on Mutations
  const method = request.method
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    // In production, ensure the request comes from our own domain.
    // We allow localhost for development.
    const isValidOrigin = origin ? (origin.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost')) : false
    const isValidReferer = referer ? (referer.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost')) : false

    if (!isValidOrigin && !isValidReferer) {
      return new NextResponse('Forbidden: CSRF protection triggered', { status: 403 })
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all /(app) routes
  // The app routes are at the root: /, /ai-coach, /nutrition, /profile, /social
  // Exclude /login, /signup, /auth/callback and public assets
  const isPublicRoute = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') // static files

  if (!user && !isPublicRoute) {
    // No user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access /login, redirect to /dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
