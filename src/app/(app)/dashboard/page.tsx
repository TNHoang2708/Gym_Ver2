'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brain, Flame, Target, Dumbbell, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { FoodLog, HardMemory, NutritionGoals, SoftMemory, WorkoutLog, WorkoutSchedule } from '@/types'
import { calculateNutritionGoals } from '@/lib/nutrition'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'Build Muscle', fat_loss: 'Lose Fat',
  strength: 'Get Stronger', general_health: 'General Health',
}

export default function DashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<NutritionGoals | null>(null)
  const [softMemory, setSoftMemory] = useState<SoftMemory | null>(null)
  const [streak, setStreak] = useState(0)
  const [activeSchedule, setActiveSchedule] = useState<WorkoutSchedule | null>(null)
  const [weeklyData, setWeeklyData] = useState<Array<{
    date: string
    calories: number
    protein: number
    goalCalories: number
    goalProtein: number
  }>>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user memory
      const { data: memory } = await supabase
        .from('user_memory')
        .select('hard_memory, soft_memory')
        .eq('user_id', user.id)
        .single()

      if (memory) {
        const hard = (memory.hard_memory ?? {}) as HardMemory
        const soft = (memory.soft_memory ?? {}) as SoftMemory
        setSoftMemory(soft)
        const nutritionGoals = calculateNutritionGoals(hard, soft)
        setGoals(nutritionGoals)

        // Build last 7 days of nutrition data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - 6 + i)
          return d.toISOString().split('T')[0]
        })

        const { data: foodData } = await supabase
          .from('food_logs')
          .select('log_date, calories, protein_g')
          .eq('user_id', user.id)
          .in('log_date', last7Days)

        const dailyMap: Record<string, { calories: number; protein: number }> = {}
        for (const log of foodData ?? []) {
          const fd = log as FoodLog
          if (!dailyMap[fd.log_date]) dailyMap[fd.log_date] = { calories: 0, protein: 0 }
          dailyMap[fd.log_date].calories += fd.calories
          dailyMap[fd.log_date].protein += fd.protein_g
        }

        setWeeklyData(last7Days.map((date) => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          calories: Math.round(dailyMap[date]?.calories ?? 0),
          protein: Math.round(dailyMap[date]?.protein ?? 0),
          goalCalories: nutritionGoals.goal_calories,
          goalProtein: nutritionGoals.goal_protein_g,
        })))
      }

      // Load active schedule
      const { data: scheduleData } = await supabase
        .from('workout_schedules')
        .select('schedule')
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      if (scheduleData?.schedule) {
        setActiveSchedule(scheduleData.schedule as WorkoutSchedule)
      }

      // Calculate streak from workout_logs
      const today = new Date().toISOString().split('T')[0]
      const { data: workoutLogs } = await supabase
        .from('workout_logs')
        .select('log_date, trained')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30)

      let streakCount = 0
      const logsMap: Record<string, boolean> = {}
      for (const log of workoutLogs ?? []) {
        const wl = log as WorkoutLog
        logsMap[wl.log_date] = wl.trained
      }

      let checkDate = new Date()
      // If today isn't marked, start from yesterday for streak
      if (!logsMap[today]) checkDate.setDate(checkDate.getDate() - 1)

      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (logsMap[dateStr]) {
          streakCount++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
      setStreak(streakCount)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading dashboard…</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
        Dashboard
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <Flame className="w-5 h-5 text-crimson mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-crimson">{streak}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Day Streak</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-foreground mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground truncate">
            {GOAL_LABELS[softMemory?.main_goal ?? ''] ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Main Goal</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Dumbbell className="w-5 h-5 text-foreground mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-foreground">
            {softMemory?.desired_frequency ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Days / Week</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Brain className="w-5 h-5 text-crimson mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground capitalize">
            {softMemory?.experience_level ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Level</p>
        </div>
      </div>

      {/* Weekly calories chart */}
      {weeklyData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-crimson" />
            <h2 className="text-sm font-bold">Weekly Calories</h2>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-crimson inline-block" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-border inline-block" /> Goal</span>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: 'oklch(0.1 0 0)', border: '1px solid oklch(0.18 0 0)', borderRadius: '8px', fontSize: '12px', color: 'oklch(0.96 0 0)' }}
                  formatter={(v) => [`${v} kcal`]}
                />
                <Bar dataKey="goalCalories" name="Goal" fill="oklch(0.18 0 0)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calories" name="Actual" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weekly protein chart */}
      {weeklyData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">Weekly Protein (g)</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'oklch(0.1 0 0)', border: '1px solid oklch(0.18 0 0)', borderRadius: '8px', fontSize: '12px', color: 'oklch(0.96 0 0)' }}
                  formatter={(v) => [`${v}g`]}
                />
                <Bar dataKey="goalProtein" name="Goal" fill="oklch(0.18 0 0)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="protein" name="Actual" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Active schedule summary */}
      {activeSchedule ? (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-crimson" />
            <h2 className="text-sm font-bold">Active Program</h2>
            <span className="ml-auto text-xs text-crimson">{activeSchedule.frequency}x/week</span>
          </div>
          <p className="font-semibold text-foreground mb-3">{activeSchedule.name}</p>
          <div className="grid grid-cols-7 gap-1">
            {activeSchedule.days.map((day, i) => {
              const isRest = !day.exercises || day.exercises.length === 0
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg p-1.5 text-center',
                    isRest ? 'bg-secondary' : 'bg-crimson/10 border border-crimson/20'
                  )}
                >
                  <p className="text-[9px] font-bold truncate" title={day.day}>
                    {day.day.slice(0, 3)}
                  </p>
                  {!isRest && <span className="text-[8px] text-crimson">•</span>}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-5 text-center">
          <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">No Active Program</p>
          <p className="text-xs text-muted-foreground mb-3">Ask your AI Coach to create a workout plan</p>
          <Link href="/ai-coach" className="text-xs text-crimson hover:underline">
            Open AI Coach →
          </Link>
        </div>
      )}
    </div>
  )
}
