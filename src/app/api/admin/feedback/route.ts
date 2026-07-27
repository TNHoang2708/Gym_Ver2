import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: memory } = await supabase
      .from('user_memory')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!memory || !memory.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: feedbacks, error } = await supabase
      .from('feedback')
      .select(`
        id,
        user_id,
        rating,
        message,
        status,
        type,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch user emails for the user_ids
    const adminClient = createAdminClient()
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const emailMap = new Map((authUsers?.users || []).map(u => [u.id, u.email]))

    const enrichedFeedbacks = (feedbacks || []).map(f => ({
      ...f,
      email: emailMap.get(f.user_id) || 'Unknown User'
    }))

    return NextResponse.json({ feedbacks: enrichedFeedbacks })
  } catch (error: any) {
    console.error('Admin API Feedback Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: memory } = await supabase
      .from('user_memory')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!memory || !memory.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin API Feedback Update Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
