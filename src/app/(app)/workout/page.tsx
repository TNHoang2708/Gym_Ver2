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
    <div className="max-w-xl mx-auto px-4 pt-8 pb-28 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">{todayDayName}</p>
        <h1 className="text-3xl font-heading font-black tracking-tight text-white uppercase">
          {hasWorkout ? "Today's Workout" : schedule ? "Rest Day 🛌" : "No Plan Yet"}
        </h1>
      </motion.div>

      {/* Today's Workout Card */}
      {hasWorkout && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-[#12141F] p-6 rounded-2xl border border-white/[0.08] shadow-xl space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-base text-white uppercase tracking-tight">{todayWorkout!.muscle_groups.join(' · ')}</p>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-0.5">{todayWorkout!.exercises.length} exercises scheduled</p>
              </div>
            </div>

            {/* Exercise preview list */}
            <div className="space-y-2.5 bg-black/20 p-4 rounded-xl border border-white/[0.05]">
              {todayWorkout!.exercises.slice(0, 4).map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.06] last:border-0">
                  <span className="text-xs font-medium text-zinc-200">{ex.name}</span>
                  <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums">{ex.sets} × {ex.reps}</span>
                </div>
              ))}
              {todayWorkout!.exercises.length > 4 && (
                <p className="text-[10px] font-mono text-zinc-400 text-center pt-1.5 uppercase tracking-widest">
                  +{todayWorkout!.exercises.length - 4} MORE EXERCISES
                </p>
              )}
            </div>

            <Link
              href="/workout/active"
              onClick={() => haptic.heavy()}
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white font-mono font-black py-4 rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 uppercase tracking-wider text-xs min-h-[48px]"
            >
              <Play className="w-4 h-4 fill-current" />
              START SESSION NOW
            </Link>
          </div>
        </motion.div>
      )}

      {/* Rest Day */}
      {isRestDay && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-[#12141F] p-8 rounded-2xl text-center space-y-3 border border-white/[0.08] shadow-xl">
            <p className="text-4xl">🛌</p>
            <p className="font-heading font-black text-xl uppercase tracking-tight text-white">REST & RECOVERY DAY</p>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">Muscles grow and rebuild during recovery. Take time to hydrate, stretch, and refuel today.</p>
          </div>
        </motion.div>
      )}

      {/* No schedule — prompt to use AI */}
      {!schedule && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-[#12141F] p-8 rounded-2xl space-y-5 text-center border border-white/[0.08] shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="font-heading font-black text-xl uppercase tracking-tight text-white mb-1">NO PROGRAM GENERATED YET</p>
              <p className="text-xs text-zinc-400 font-light">Let your Pro AI Coach generate a tailored workout split for your specific goals.</p>
            </div>
            <Link
              href="/ai-coach"
              onClick={() => haptic.medium()}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-mono font-black uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              BUILD PROGRAM WITH AI
            </Link>
          </div>
        </motion.div>
      )}

      {/* Full Week Overview */}
      {schedule && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
          <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">WEEKLY OVERVIEW</p>
          <div className="space-y-2">
            {schedule.days.map((day, i) => {
              const isToday = day.day.toLowerCase() === todayDayName.toLowerCase()
              const isRest = day.muscle_groups.length === 0
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    isToday ? 'bg-red-600/10 border border-red-500/30' : 'bg-[#12141F] border border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${isToday ? 'text-red-500' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isToday ? 'text-white' : 'text-zinc-300'}`}>{day.day}</span>
                    {isToday && (
                      <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest bg-red-600/20 border border-red-500/30 px-2 py-0.5 rounded">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-zinc-400 uppercase">
                    {isRest ? 'REST DAY' : day.muscle_groups.join(' · ')}
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
          className="flex items-center justify-between p-4.5 rounded-xl bg-[#12141F] border border-white/[0.08] hover:border-white/20 transition-all min-h-[52px]"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-zinc-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">WORKOUT HISTORY & LOGS</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </Link>
      </motion.div>

    </div>
  )
}
