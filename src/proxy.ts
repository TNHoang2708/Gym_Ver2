import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { validateEnv } from './lib/env'

// Kích hoạt Giao thức Tận Thế: Kiểm tra biến môi trường lúc khởi động Middleware
validateEnv()

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-DNS-Prefetch-Control', 'on')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Cấu hình CSP để khóa mồm mọi loại XSS nhưng vẫn cho phép Next.js và Supabase WebSockets (wss:) hoạt động
  res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';")
  return res
}

async function triggerAutoBan(ip: string, reason: string, durationHours: number | null) {
  if (ip === 'unknown') return;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return; // Cannot ban without service role

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { 
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' })
      },
      cookies: { getAll() { return [] }, setAll() {} } 
    }
  )

  // 0. Giao Thức Chống Tự Sát (DDoS Protection for Telegram API & DB)
  // Check if IP is already banned and ban is still active. If so, DO NOTHING to prevent spamming Telegram and DB.
  const { data: existingBan } = await supabaseAdmin.from('banned_ips').select('expires_at').eq('ip_address', ip).maybeSingle()
  if (existingBan) {
    if (!existingBan.expires_at || new Date(existingBan.expires_at) > new Date()) {
      return; // Already banned and active. Silently drop to prevent DDoS.
    }
  }

  let expiresAt: string | null = null
  if (durationHours !== null) {
    const date = new Date()
    date.setHours(date.getHours() + durationHours)
    expiresAt = date.toISOString()
  }

  // 1. Insert/Update banned_ips (Upsert on IP)
  await supabaseAdmin.from('banned_ips').upsert(
    { ip_address: ip, reason, expires_at: expiresAt }, 
    { onConflict: 'ip_address' }
  ).select().maybeSingle()
  
  // 2. Insert into security_alerts
  await supabaseAdmin.from('security_alerts').insert({ alert_type: 'AUTO_BAN', ip_address: ip, details: reason })
  
  // 3. Send Telegram Notification
  const { data: settings } = await supabaseAdmin.from('global_settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_chat_id'])
  
  const tgToken = settings?.find(s => s.key === 'telegram_bot_token')?.value
  const tgChatId = settings?.find(s => s.key === 'telegram_chat_id')?.value

  if (tgToken && tgChatId) {
    const durationText = durationHours === null ? 'Vĩnh Viễn ☠️' : `${durationHours} Tiếng ⏱️`
    
    // Khử trùng (Sanitize) dữ liệu để chống HTML Injection làm hỏng cú pháp Telegram
    const safeIp = ip.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeReason = reason.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    try {
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: `🚨 <b>BÁO ĐỘNG ĐỎ - AUTO BAN</b> 🚨\n\n👤 <b>IP:</b> <code>${safeIp}</code>\n⚠️ <b>Lỗi:</b> ${safeReason}\n⏱️ <b>Hình phạt:</b> ${durationText}`,
          parse_mode: 'HTML'
        })
      })
    } catch (e) {
      console.error('Failed to send telegram alert', e)
    }
  }
}

export async function proxy(request: NextRequest) {
  // Get IP early for bans
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : (request.headers.get('x-real-ip') || 'unknown')

  // 1. Anti-Bot Shield: Require User-Agent
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    await triggerAutoBan(ip, 'Anti-Bot Shield: Missing or invalid User-Agent', 1)
    return new NextResponse('Forbidden: Missing or invalid User-Agent (Anti-Bot Shield)', { status: 403 })
  }

  // 1.5. Honeypot Check: Block Banned IPs
  // 1.5. Honeypot Trap
  if (request.nextUrl.pathname === '/api/admin/hidden-login') {
    await triggerAutoBan(ip, 'Honeypot Trap Triggered: Attempted to access fake admin login.', null)
    return new NextResponse('Forbidden: Your IP has been permanently banned for suspicious activity.', { status: 403 })
  }

  // 1.6. Malicious Path Scanner
  const maliciousPatterns = [/\.env$/, /\.git/, /wp-admin/, /wp-login/, /\.php$/, /\.sql$/, /config\.json$/]
  if (maliciousPatterns.some(p => p.test(request.nextUrl.pathname))) {
    await triggerAutoBan(ip, `Malicious Path Scanner Triggered: Attempted to access ${request.nextUrl.pathname}`, null)
    return new NextResponse('Forbidden: Your IP has been permanently banned for malicious scanning.', { status: 403 })
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
      await triggerAutoBan(ip, `CSRF Guard: Invalid Origin (${origin}) or Referer (${referer})`, 3)
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
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' })
      },
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

  // 1.5. Complete Honeypot Check
  // if (ip !== 'unknown') {
  //   const { data: bannedIp } = await supabase.from('banned_ips').select('ip_address, expires_at').eq('ip_address', ip).maybeSingle()
  //   if (bannedIp) {
  //     if (!bannedIp.expires_at || new Date(bannedIp.expires_at) > new Date()) {
  //       return new NextResponse('Forbidden: Your IP has been banned for suspicious activity.', { status: 403 })
  //     }
  //   }
  // }

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
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') // static files

  if (!user && !isPublicRoute) {
    // No user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  // If user is logged in and trying to access /login, redirect to /dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  return applySecurityHeaders(supabaseResponse)
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
