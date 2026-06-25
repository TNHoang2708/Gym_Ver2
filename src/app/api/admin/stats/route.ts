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

    const adminClient = createAdminClient()
    
    // Get total registered users from auth.users
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()
    const totalUsers = usersData?.users?.length || 0

    // Get total workouts
    const { count: totalLogs } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })

    // Get Telemetry for cost and tokens
    const { data: telemetryData } = await supabase
      .from('api_telemetry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000)

    const tData = telemetryData || []
    const totalCost = tData.reduce((acc, curr) => acc + Number(curr.cost_estimated || 0), 0)

    // Aggregate Daily API Token Usage
    const tokenData = tData.reduce((acc: any, curr) => {
      const dateStr = new Date(curr.created_at).toISOString().split('T')[0]
      if (!acc[dateStr]) acc[dateStr] = 0
      acc[dateStr] += curr.tokens_used
      return acc
    }, {})

    const chartTokens = Object.keys(tokenData).slice(0, 14).map(dateStr => ({
      name: dateStr.split('-').slice(1).join('/'),
      tokens: tokenData[dateStr]
    })).reverse()

    // Calculate DAU based on distinct user_ids in workout_logs per day
    const { data: recentLogs } = await supabase
      .from('workout_logs')
      .select('user_id, date')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    const dauMap: Record<string, Set<string>> = {}
    if (recentLogs) {
      recentLogs.forEach(log => {
        if (!dauMap[log.date]) dauMap[log.date] = new Set()
        dauMap[log.date].add(log.user_id)
      })
    }

    // Fill in last 30 days
    const dauData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().split('T')[0]
      return {
        name: `${d.getMonth()+1}/${d.getDate()}`,
        users: dauMap[dateStr]?.size || 0
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        totalLogs: totalLogs || 0,
        totalCost,
      },
      chartTokens,
      dauData
    })
  } catch (error: any) {
    console.error('Admin API Stats Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
