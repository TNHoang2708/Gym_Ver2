import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Ensure caller is Admin
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthorized')

  const { data: memory } = await supabase
    .from('user_memory')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!memory || !memory.is_admin) throw new Error('Forbidden')
  
  return supabase
}

export async function GET() {
  try {
    const supabase = await requireAdmin()
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name')

    if (error) throw error
    return NextResponse.json({ exercises })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await requireAdmin()
    const body = await req.json()
    const { error } = await supabase.from('exercises').insert([body])
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await requireAdmin()
    const body = await req.json()
    const { id, ...updateData } = body
    const { error } = await supabase.from('exercises').update(updateData).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await requireAdmin()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
