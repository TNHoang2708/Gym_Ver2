import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAuthorization } from '@/lib/auth/admin-check'

export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!
    const supabase = await createClient()

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        user_id,
        role,
        content,
        created_at
      `)
      .neq('role', 'system') // Hide system prompts
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Fetch user emails
    const adminClient = createAdminClient()
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const emailMap = new Map((authUsers?.users || []).map(u => [u.id, u.email]))

    const enrichedMessages = (messages || []).map(m => ({
      ...m,
      email: emailMap.get(m.user_id) || 'Unknown User'
    }))

    return NextResponse.json({ messages: enrichedMessages })
  } catch (error: any) {
    console.error('Admin API AI Logs Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
