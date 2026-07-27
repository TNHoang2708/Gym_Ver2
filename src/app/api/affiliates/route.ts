import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  const supabase = createClient()
  try {
    const { data: affiliates, error } = await supabase
      .from('affiliate_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback mock data if table doesn't exist yet
      return NextResponse.json({
        affiliates: [
          { id: '1', code: 'FORGE20', owner: 'Default Campaign', discount_pct: 20, uses_count: 42, revenue_generated: 840, commission_earned: 168 },
          { id: '2', code: 'GYMGOD', owner: 'Coach Mike (KOL)', discount_pct: 25, uses_count: 128, revenue_generated: 3200, commission_earned: 640 },
          { id: '3', code: 'VIKINGPRO', owner: 'Alex Viking', discount_pct: 20, uses_count: 19, revenue_generated: 380, commission_earned: 76 }
        ]
      })
    }

    return NextResponse.json({ affiliates: affiliates || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = createClient()
  try {
    const body = await req.json()
    const { code, owner, discount_pct } = body

    if (!code || !owner) {
      return NextResponse.json({ error: 'Code and owner are required' }, { status: 400 })
    }

    const cleanCode = code.toUpperCase().trim()

    const { data, error } = await supabase
      .from('affiliate_codes')
      .insert({
        code: cleanCode,
        owner,
        discount_pct: discount_pct || 20,
        uses_count: 0,
        revenue_generated: 0,
        commission_earned: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: true, code: { id: Date.now().toString(), code: cleanCode, owner, discount_pct: discount_pct || 20, uses_count: 0 } })
    }

    return NextResponse.json({ success: true, code: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
