import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { UserMemory, DailyNutritionSummary, WorkoutLog, WorkoutSchedule } from '@/types'
import { calculateNutritionGoals } from '@/lib/nutrition'

const supabase = createClient()

export function useDashboardData() {
  const fetcher = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not logged in")

    const today = new Date().toISOString().split('T')[0]

    const [
      { data: memData },
      { data: foodLogs },
      { data: workoutLogs },
      { data: schedules }
    ] = await Promise.all([
      supabase.from('user_memory').select('*').eq('user_id', user.id).single(),
      supabase.from('food_logs').select('*').eq('user_id', user.id).eq('log_date', today),
      supabase.from('workout_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }),
      supabase.from('workout_schedules').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1)
    ])

    const memory = memData as UserMemory | null
    const schedule = (schedules && schedules.length > 0) ? schedules[0].schedule as WorkoutSchedule : null

    // Calculate Nutrition
    let nutrition: DailyNutritionSummary | null = null
    if (foodLogs) {
      const totals = foodLogs.reduce(
        (acc: any, log: any) => ({
          calories: acc.calories + (log.calories || 0),
          protein_g: acc.protein_g + (log.protein_g || 0),
          carbs_g: acc.carbs_g + (log.carbs_g || 0),
          fat_g: acc.fat_g + (log.fat_g || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      )

      // Use real goals from user memory instead of hardcoded defaults
      const goals = memory
        ? calculateNutritionGoals(memory.hard_memory, memory.soft_memory)
        : { goal_calories: 2000, goal_protein_g: 150, goal_carbs_g: 200, goal_fat_g: 65 }

      nutrition = {
        ...totals,
        goal_calories: goals.goal_calories,
        goal_protein_g: goals.goal_protein_g,
        goal_carbs_g: goals.goal_carbs_g,
        goal_fat_g: goals.goal_fat_g,
      }
    }

    // Calculate Streak
    let currentStreak = 0
    const checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)
    
    const logs = workoutLogs || []
    
    const hasWorkoutToday = logs.some((l: any) => l.log_date === checkDate.toISOString().split('T')[0] && l.trained)
    if (!hasWorkoutToday) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const log = logs.find((l: any) => l.log_date === dateStr)
      if (log && log.trained) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      memory,
      nutrition,
      workoutLogs: logs,
      schedule,
      streak: currentStreak,
    }
  }

  const { data, error, mutate, isLoading } = useSWR('dashboardData', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // 1 minute cache
  })

  return { data, error, isLoading, mutate }
}

export function useDiaryData() {
  const fetcher = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not logged in")

    const { data } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    return data || []
  }

  const { data, error, mutate, isLoading } = useSWR('diaryData', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  })

  return { data, error, isLoading, mutate }
}

export function useWorkoutHistory() {
  const fetcher = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not logged in")

    const { data: logs } = await supabase
      .from('workout_logs')
      .select(`
        *,
        workout_session_logs (*)
      `)
      .eq('user_id', user.id)
      .eq('trained', true)
      .order('log_date', { ascending: false })

    return logs || []
  }

  const { data, error, mutate, isLoading } = useSWR('workoutHistoryData', fetcher, {
    revalidateOnFocus: true,
  })

  return { data, error, isLoading, mutate }
}

export function useNutritionData() {
  const fetcher = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not logged in")

    const today = new Date().toISOString().split('T')[0]
    
    const days: any[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        label: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }),
        date: dateStr,
        protein_cal: 0,
        carbs_cal: 0,
        fat_cal: 0,
        total_cal: 0,
        isToday: i === 0,
      })
    }

    const [
      { data: memData },
      { data: favData },
      { data: weekLogs }
    ] = await Promise.all([
      supabase.from('user_memory').select('hard_memory, soft_memory').eq('user_id', user.id).single(),
      supabase.from('food_favourites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('food_logs').select('*').eq('user_id', user.id).gte('log_date', days[0].date).lte('log_date', today)
    ])

    const todayLogs = (weekLogs || []).filter((l: any) => l.log_date === today)

    if (weekLogs) {
      for (const log of weekLogs) {
        const day = days.find(d => d.date === log.log_date)
        if (day) {
          day.total_cal += log.calories || 0
          day.protein_cal += (log.protein_g || 0) * 4
          day.carbs_cal += (log.carbs_g || 0) * 4
          day.fat_cal += (log.fat_g || 0) * 9
        }
      }
    }

    return {
      memory: memData,
      todayLogs,
      favourites: favData || [],
      weekData: days
    }
  }

  const { data, error, mutate, isLoading } = useSWR('nutritionData', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  })

  return { data, error, isLoading, mutate }
}
