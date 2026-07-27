import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAuthorization } from '@/lib/auth/admin-check'

export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!
    const supabase = await createClient()

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

export async function PATCH(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!
    const supabase = await createClient()

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
