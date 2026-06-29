'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Dumbbell, Play, History, Sparkles, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { haptic } from '@/lib/haptics'
import type { WorkoutSchedule } from '@/types'

export default function WorkoutPage() {
  const [schedule, setSchedule] = useState<WorkoutSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayDayName, setTodayDayName] = useState('')

  useEffect(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    setTodayDayName(dayNames[new Date().getDay()])
    loadSchedule()
  }, [])

  async function loadSchedule() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('workout_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data?.schedule) setSchedule(data.schedule as WorkoutSchedule)
    } catch {}
    setLoading(false)
  }

  const todayWorkout = schedule?.days?.find(d =>
    d.day.toLowerCase() === todayDayName.toLowerCase()
  )
  const isRestDay = todayWorkout && todayWorkout.muscle_groups.length === 0
  const hasWorkout = todayWorkout && !isRestDay

  if (loading) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-5 pt-10 pb-28 space-y-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{todayDayName}</p>
        <h1 className="text-3xl font-heading font-bold tracking-tight">
          {hasWorkout ? "Today's Workout" : schedule ? "Rest Day 🛌" : "No Plan Yet"}
        </h1>
      </motion.div>

      {/* Today's Workout Card */}
      {hasWorkout && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-bold text-foreground">{todayWorkout!.muscle_groups.join(' · ')}</p>
                <p className="text-sm text-muted-foreground">{todayWorkout!.exercises.length} exercises</p>
              </div>
            </div>

            {/* Exercise preview list */}
            <div className="space-y-2">
              {todayWorkout!.exercises.slice(0, 4).map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-foreground">{ex.name}</span>
                  <span className="text-xs text-muted-foreground font-medium">{ex.sets} × {ex.reps}</span>
                </div>
              ))}
              {todayWorkout!.exercises.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{todayWorkout!.exercises.length - 4} more exercises
                </p>
              )}
            </div>

            <Link
              href="/workout/active"
              onClick={() => haptic.heavy()}
              className="flex items-center justify-center gap-2 w-full bg-gold text-gold-foreground font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all glow-gold"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Workout
            </Link>
          </div>
        </motion.div>
      )}

      {/* Rest Day */}
      {isRestDay && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="glass-card p-6 rounded-3xl text-center space-y-3">
            <p className="text-4xl">🛌</p>
            <p className="font-bold text-lg">Rest & Recovery</p>
            <p className="text-sm text-muted-foreground">Muscles grow when you rest. Take it easy today.</p>
          </div>
        </motion.div>
      )}

      {/* No schedule — prompt to use AI */}
      {!schedule && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="glass-card p-6 rounded-3xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-gold" />
            </div>
            <div>
              <p className="font-bold text-lg mb-1">No workout plan yet</p>
              <p className="text-sm text-muted-foreground">Ask your AI Coach to build a personalized program for you</p>
            </div>
            <Link
              href="/ai-coach"
              onClick={() => haptic.medium()}
              className="inline-flex items-center gap-2 bg-gold text-gold-foreground font-bold px-6 py-3.5 rounded-2xl glow-gold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Build My Plan
            </Link>
          </div>
        </motion.div>
      )}

      {/* Full Week Overview */}
      {schedule && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">This Week</p>
          <div className="space-y-2">
            {schedule.days.map((day, i) => {
              const isToday = day.day.toLowerCase() === todayDayName.toLowerCase()
              const isRest = day.muscle_groups.length === 0
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    isToday ? 'bg-gold/10 border border-gold/20' : 'bg-white/[0.03] border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${isToday ? 'text-gold' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-semibold ${isToday ? 'text-gold' : 'text-foreground'}`}>{day.day}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold text-gold/70 uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isRest ? '— Rest' : day.muscle_groups.join(' · ')}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* History Link */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <Link
          href="/workout/history"
          onClick={() => haptic.light()}
          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Workout History</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </motion.div>

    </div>
  )
}
