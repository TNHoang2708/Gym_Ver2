import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const adminClient = createAdminClient()
    const { data: flags, error } = await adminClient
      .from('feature_flags')
      .select('*')

    if (error) {
      console.error('API Flags Error:', error)
      return NextResponse.json({ flags: {} })
    }

    let isPro = false
    if (user) {
      const { data: mem } = await adminClient.from('user_memory').select('subscription_tier').eq('user_id', user.id).single()
      if (mem?.subscription_tier === 'pro' || mem?.subscription_tier === 'god') {
        isPro = true
      }
    }

    const resolvedFlags: Record<string, boolean> = {}

    for (const flag of flags) {
      if (!flag.is_active) {
        resolvedFlags[flag.key] = false
        continue
      }
      
      switch (flag.rule_type) {
        case 'none':
          resolvedFlags[flag.key] = false
          break
        case 'all':
          resolvedFlags[flag.key] = true
          break
        case 'pro':
          resolvedFlags[flag.key] = isPro
          break
        case 'percent':
          // deterministic percentage based on user ID or IP (fallback to Math.random for simplicity if no user)
          if (user) {
            const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
            resolvedFlags[flag.key] = (hash % 100) < parseInt(flag.rule_value || '0')
          } else {
            resolvedFlags[flag.key] = false
          }
          break
        default:
          resolvedFlags[flag.key] = false
      }
    }

    return NextResponse.json({ flags: resolvedFlags })
  } catch (error: any) {
    console.error('API Flags Error:', error)
    return NextResponse.json({ flags: {} })
  }
}
