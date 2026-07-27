import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  return handleHoneypot(request)
}

export async function POST(request: Request) {
  return handleHoneypot(request)
}

async function handleHoneypot(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  // Get IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : (request.headers.get('x-real-ip') || 'unknown')

  if (ip !== 'unknown') {
    // Ban the IP
    await supabase.from('banned_ips').insert({
      ip_address: ip,
      reason: 'Triggered Honeypot at /api/admin/hidden-login'
    })
  }

  // Return a generic fake response to keep the bot guessing
  return NextResponse.json({ error: 'Unauthorized', message: 'Invalid admin credentials.' }, { status: 401 })
}
