import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIWithFallback } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { command } = body

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    // AI System prompt for Admin Intent Parsing
    const adminSystemPrompt = `
You are the Forge AI God Mode Admin Assistant.
Your job is to parse Vietnamese/English admin commands and execute or format actions.

Current Server State:
- Server Time: ${new Date().toISOString()}

Respond in JSON format ONLY:
{
  "actionExecuted": "NAME_OF_ACTION",
  "replyText": "Professional, executive explanation of what was done",
  "data": { ...any action payload... }
}

Supported Actions:
- BAN_USER: If admin asks to ban or lock a user account.
- GRANT_VIP: If admin asks to grant Pro / VIP to a user.
- TOGGLE_KILL_SWITCH: If admin asks to enable/disable kill switch or maintenance.
- SERVER_STATS: If admin asks about active users, telemetry, or server health.
- UNKNOWN: If command is conversational or unrecognized.
`

    const aiRes = await callAIWithFallback({
      systemPrompt: adminSystemPrompt,
      userMessage: command,
      history: [],
      temperature: 0.2
    })

    let parsed
    try {
      const cleanJson = aiRes.text.replace(/```json/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      parsed = {
        actionExecuted: 'CONVERSATIONAL',
        replyText: aiRes.text,
        data: {}
      }
    }

    // Perform real DB execution if action matches
    if (parsed.actionExecuted === 'TOGGLE_KILL_SWITCH') {
      const isEnable = command.toLowerCase().includes('bật') || command.toLowerCase().includes('enable')
      await supabase.from('global_settings').upsert({ key: 'ai_kill_switch', value: isEnable })
      parsed.replyText = `Đã ${isEnable ? 'BẬT' : 'TẮT'} công tắc ngắt khẩn cấp (Kill Switch) thành công!`
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('Error in Admin Assistant API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
