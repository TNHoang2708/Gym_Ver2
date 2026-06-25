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

    if (!user.email?.includes('admin') && user.email !== 'admin@gymplanner.ai') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: settings, error } = await supabase
      .from('global_settings')
      .select('*')
      .in('key', ['custom_ai_prompt', 'global_announcement'])

    if (error) {
      console.error('Settings API GET Error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    const customPrompt = settings.find(s => s.key === 'custom_ai_prompt')?.value || ''
    const announcement = settings.find(s => s.key === 'global_announcement')?.value || ''

    return NextResponse.json({ customPrompt, announcement })
  } catch (error: any) {
    console.error('Settings API GET Error:', error)
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

    if (!user.email?.includes('admin') && user.email !== 'admin@gymplanner.ai') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { customPrompt, announcement, triggerBroadcast } = body

    const adminClient = createAdminClient()

    if (customPrompt !== undefined) {
      // Upsert custom_ai_prompt
      const { error } = await adminClient
        .from('global_settings')
        .upsert({ key: 'custom_ai_prompt', value: customPrompt, updated_at: new Date().toISOString() })
      if (error) throw error
    }

    if (announcement !== undefined) {
      // Upsert global_announcement
      const { error } = await adminClient
        .from('global_settings')
        .upsert({ key: 'global_announcement', value: announcement, updated_at: new Date().toISOString() })
      if (error) throw error
      
      // If we are broadcasting, we also want to set a trigger flag if needed, 
      // but actually frontend clients poll or check on layout load. 
      // To trigger a toast, saving the announcement text is usually enough.
      // Alternatively, we could increment a 'broadcast_version' to force clients to show it.
      if (triggerBroadcast) {
        await adminClient
          .from('global_settings')
          .upsert({ key: 'broadcast_version', value: Date.now().toString(), updated_at: new Date().toISOString() })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Settings API PUT Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
