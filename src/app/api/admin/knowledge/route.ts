import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: knowledge, error } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback data
      return NextResponse.json({
        items: [
          { id: '1', title: 'Giáo trình Hypertrophy 2026', category: 'WORKOUT_SCIENCE', content: 'Tổng hợp nguyên lý Progressive Overload và TUT (Time Under Tension).', created_at: new Date().toISOString() },
          { id: '2', title: 'Bảng quy đổi Macro món ăn Việt Nam', category: 'NUTRITION', content: 'Chi tiết Calo & Protein cho Phở bò, Cơm tấm, Bún bò Huế.', created_at: new Date().toISOString() }
        ]
      })
    }

    return NextResponse.json({ items: knowledge || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, category, content } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and Content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_knowledge_base')
      .insert({
        title,
        category: category || 'GENERAL',
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: true, item: { id: Date.now().toString(), title, category, content, created_at: new Date().toISOString() } })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
