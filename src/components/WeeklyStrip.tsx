'use client'

import React from 'react'
import { Check, Dumbbell } from 'lucide-react'
import type { WorkoutLog } from '@/types'

interface WeeklyStripProps {
  workoutLogs?: WorkoutLog[] | null
}

export default function WeeklyStrip({ workoutLogs }: WeeklyStripProps) {
  // Generate 7 days of current week starting from Monday
  const today = new Date()
  const currentDayOfWeek = today.getDay() // 0 = Sun, 1 = Mon, ...
  const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek

  const monday = new Date(today)
  monday.setDate(today.getDate() + distanceToMon)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const isoDate = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNumber = date.getDate()
    const isToday = isoDate === today.toISOString().split('T')[0]

    // Check if workout logged on this date
    const hasWorkout = workoutLogs?.some(log => {
      if (!log.created_at && !log.log_date) return false
      const logDate = (log.log_date || log.created_at || '').split('T')[0]
      return logDate === isoDate
    })

    return { isoDate, dayName, dayNumber, isToday, hasWorkout }
  })

  return (
    <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-4.5 rounded-2xl border border-white/10 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">WEEKLY TRAINING ACTIVITY</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">MON – SUN</span>
      </div>

      {/* 7-Day Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day.isoDate}
            className={`flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all ${
              day.hasWorkout
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : day.isToday
                ? 'bg-red-500/15 border-red-500/50 text-white shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'bg-black/30 border-white/5 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono font-bold uppercase">{day.dayName}</span>
            <span className="text-sm font-mono font-black my-1 tabular-nums">{day.dayNumber}</span>
            
            <div className="w-4 h-4 rounded-full flex items-center justify-center">
              {day.hasWorkout ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                </div>
              ) : day.isToday ? (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
