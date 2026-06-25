import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/register']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/api/')
  )

  // Admin Route Protection
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const isAdmin = user.email === 'admin@gymplanner.ai' || user.email?.includes('admin')
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    // Check if user has completed onboarding
    const { data: memory } = await supabase
      .from('user_memory')
      .select('hard_memory')
      .eq('user_id', user.id)
      .single()

    const hasOnboarded =
      memory?.hard_memory && Object.keys(memory.hard_memory).length > 0

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = hasOnboarded ? '/ai-coach' : '/onboarding'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users who haven't onboarded to /onboarding
  if (
    user &&
    !pathname.startsWith('/onboarding') &&
    pathname !== '/login' &&
    pathname !== '/register'
  ) {
    const { data: memory } = await supabase
      .from('user_memory')
      .select('hard_memory')
      .eq('user_id', user.id)
      .single()

    const hasOnboarded =
      memory?.hard_memory && Object.keys(memory.hard_memory).length > 0

    if (!hasOnboarded) {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = '/onboarding'
      return NextResponse.redirect(onboardingUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|webmanifest|js)$).*)',
  ],
}
