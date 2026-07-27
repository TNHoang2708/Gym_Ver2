import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, action, value } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    let updatePayload: any = {}
    if (action === 'set_vip') {
      updatePayload.subscription_tier = value
    } else if (action === 'update_xp') {
      updatePayload.xp_points = value
    } else if (action === 'update_streak') {
      updatePayload.streak_days = value
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { error: updateError } = await adminClient
      .from('user_memory')
      .update(updatePayload)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Admin API Update User Memory Error:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
