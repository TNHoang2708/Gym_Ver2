import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAuthorization } from '@/lib/auth/admin-check'

export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!

    const adminClient = createAdminClient()
    
    // Fetch users with pagination if needed, here we just fetch first 100 for simplicity
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100
    })

    if (usersError) {
      console.error('Admin API List Users Error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const { data: userMemoryData } = await adminClient
      .from('user_memory')
      .select('user_id, subscription_tier, xp_points, streak_days')

    const mergedUsers = usersData.users.map(u => {
      const memory = userMemoryData?.find(m => m.user_id === u.id)
      return {
        ...u,
        subscription_tier: memory?.subscription_tier || 'free',
        xp_points: memory?.xp_points || 0,
        streak_days: memory?.streak_days || 0
      }
    })

    return NextResponse.json({ users: mergedUsers })
  } catch (error: any) {
    console.error('Admin API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Admin API Delete User Error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!

    const body = await req.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    
    if (action === 'suspend') {
      // Supabase auth.users doesn't have a direct "suspend" flag that is easily exposed in the standard API.
      // We can use the ban logic: update the user's ban_duration.
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // Ban for 100 years
      })
      if (updateError) throw updateError
    } else if (action === 'unsuspend') {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      })
      if (updateError) throw updateError
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
