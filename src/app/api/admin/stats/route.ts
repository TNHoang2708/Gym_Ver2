import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAuthorization } from '@/lib/auth/admin-check'

export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuthorization()
    if (!auth.isAdmin) return auth.errorResponse!
    const supabase = await createClient()

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
    const totalCost = tData.reduce((acc: number, curr: Record<string, any>) => acc + Number(curr.cost_estimated || 0), 0)

    // Aggregate Daily API Token Usage
    const tokenData = tData.reduce((acc: Record<string, number>, curr: Record<string, any>) => {
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
      recentLogs.forEach((log: { user_id: string; date: string }) => {
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

    // Fetch top 5 exercises from workout_session_logs
    const { data: sessionLogs } = await supabase
      .from('workout_session_logs')
      .select('exercise_name')

    const exerciseMap: Record<string, number> = {}
    if (sessionLogs) {
      sessionLogs.forEach((log: { exercise_name: string }) => {
        if (!exerciseMap[log.exercise_name]) {
          exerciseMap[log.exercise_name] = 0
        }
        exerciseMap[log.exercise_name] += 1
      })
    }

    const topExercises = Object.entries(exerciseMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        totalUsers,
        totalLogs: totalLogs || 0,
        totalCost,
      },
      chartTokens,
      dauData,
      topExercises
    })
  } catch (error: any) {
    console.error('Admin API Stats Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
