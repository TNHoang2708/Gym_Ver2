import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Kiểm tra Rate Limit sử dụng Supabase RPC.
 * Trả về true nếu được phép đi tiếp, false nếu vượt quá giới hạn.
 */
export async function checkRateLimit(
  endpoint: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<boolean> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component can't set cookies
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false // Unauthenticated users shouldn't reach here anyway
  }

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: user.id,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds
  })

  if (error) {
    console.error('Rate Limit RPC Error:', error)
    // Nếu RPC chưa được push (migration chưa chạy), ta tạm thời cho phép
    // để không làm sập App trong lúc chờ Admin chạy db push.
    if (error.code === '42883') return true 
    return false
  }

  return data as boolean
}
