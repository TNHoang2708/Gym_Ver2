'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, Circle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import type { FoodLog, WorkoutLog } from '@/types'
import { cn } from '@/lib/utils'

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()
}

export default function DiaryPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const days = getLast14Days()

  const [selectedDate, setSelectedDate] = useState(today)
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<Record<string, WorkoutLog>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load food logs for selected date
      const { data: foods } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', selectedDate)
        .order('created_at', { ascending: true })
      setFoodLogs(foods ?? [])

      // Load workout logs for last 14 days
      const startDate = days[0]
      const { data: workouts } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', startDate)

      const workoutMap: Record<string, WorkoutLog> = {}
      for (const w of workouts ?? []) {
        workoutMap[w.log_date] = w as WorkoutLog
      }
      setWorkoutLogs(workoutMap)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  async function toggleTrained(date: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = workoutLogs[date]
    const newTrained = !existing?.trained

    const { data, error } = await supabase
      .from('workout_logs')
      .upsert(
        { user_id: user.id, log_date: date, trained: newTrained },
        { onConflict: 'user_id,log_date' }
      )
      .select()
      .single()

    if (error) {
      toast.error('Failed to update training status')
      return
    }

    setWorkoutLogs((prev) => ({ ...prev, [date]: data as WorkoutLog }))
    toast.success(newTrained ? '💪 Marked as trained!' : 'Training status cleared')
  }

  // Calculate streak
  const streak = (() => {
    let count = 0
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i]
      if (d > today) continue
      if (workoutLogs[d]?.trained) count++
      else if (d !== today) break
    }
    return count
  })()

  const totalCalories = foodLogs.reduce((acc, f) => acc + f.calories, 0)
  const totalProtein = foodLogs.reduce((acc, f) => acc + f.protein_g, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading diary…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Diary
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your training & nutrition history</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Current streak</p>
          <p className="text-2xl font-extrabold text-crimson">{streak} 🔥</p>
        </div>
      </div>

      {/* Date strip */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
          {days.map((date) => {
            const isTrained = workoutLogs[date]?.trained
            const isSelected = date === selectedDate
            const isToday = date === today
            const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
            const dayNum = new Date(date).getDate()

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center gap-1 w-10 py-2 rounded-xl border transition-all flex-shrink-0',
                  isSelected
                    ? 'bg-crimson/10 border-crimson/40'
                    : 'border-border hover:border-border/80 bg-secondary/30'
                )}
              >
                <span className={cn('text-[10px] font-medium', isSelected ? 'text-crimson' : 'text-muted-foreground')}>
                  {dayLabel}
                </span>
                <span className={cn('text-sm font-bold', isSelected ? 'text-crimson' : 'text-foreground', isToday && !isSelected && 'underline decoration-crimson/50')}>
                  {dayNum}
                </span>
                {isTrained && (
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date detail */}
      <div className="space-y-4">
        {/* Date header + train toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <button
            onClick={() => toggleTrained(selectedDate)}
            className={cn(
              'flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border transition-all',
              workoutLogs[selectedDate]?.trained
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'border-border text-muted-foreground hover:border-crimson/30 hover:text-crimson'
            )}
          >
            {workoutLogs[selectedDate]?.trained ? (
              <><CheckCircle className="w-4 h-4" /> Trained</>
            ) : (
              <><Circle className="w-4 h-4" /> Mark Trained</>
            )}
          </button>
        </div>

        {/* Nutrition summary for selected date */}
        {foodLogs.length > 0 ? (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold">Nutrition</span>
              <span className="ml-auto text-xs text-muted-foreground">{foodLogs.length} items</span>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-extrabold text-crimson">{totalCalories}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground">{Math.round(totalProtein)}g</p>
                <p className="text-[10px] text-muted-foreground">protein</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {foodLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{log.name}</span>
                  <span className="text-muted-foreground">{log.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm glass-card rounded-xl">
            No nutrition data for this day.
          </div>
        )}
      </div>
    </div>
  )
}
