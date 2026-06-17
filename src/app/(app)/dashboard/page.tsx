'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Flame, Dumbbell, Target, Sparkles, Trophy, CalendarCheck, Watch, Moon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { syncHealthData } from '@/lib/health/sync'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { UserMemory, DailyNutritionSummary, WorkoutLog, WorkoutSchedule } from '@/types'
import { useDashboardData } from '@/lib/hooks/use-data'

export default function DashboardPage() {
  const { data, isLoading, mutate } = useDashboardData()
  const [insightLoading, setInsightLoading] = useState(false)
  const [syncingHealth, setSyncingHealth] = useState(false)
  const [insight, setInsight] = useState("Stay focused and trust the process. Today is another opportunity to get closer to your goals.")

  useEffect(() => {
    if (data && !(data as any).insightFetched) {
      setInsightLoading(true)
      // Fetch dynamic insight asynchronously
      fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutrition: data.nutrition, workoutStreak: data.streak })
      })
      .then(res => res.json())
      .then(json => {
        if (json.insight) {
          setInsight(json.insight)
          // Mark as fetched so we don't refetch on every cache hit
          mutate(prev => prev ? { ...prev, insightFetched: true } as any : prev, false)
        }
      })
      .catch(err => console.error('Failed to fetch insight:', err))
      .finally(() => setInsightLoading(false))
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="relative min-h-screen px-4 pt-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-white/5 rounded-lg"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-[2rem]"></div>
            <div className="h-[400px] bg-white/5 rounded-[2rem]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null;

  const { memory, nutrition, workoutLogs, schedule, streak } = data

  async function handleHealthSync() {
    setSyncingHealth(true)
    try {
      const hd = await syncHealthData()
      if (memory && memory.soft_memory) {
        mutate({
          ...data!,
          memory: {
            ...memory,
            soft_memory: {
              ...memory.soft_memory,
              latest_steps: hd.steps,
              latest_sleep_hours: hd.sleepHours
            }
          }
        }, false)
      }
      toast.success('Device Sync Complete')
    } catch (err) {
      toast.error('Failed to sync health data')
    }
    setSyncingHealth(false)
  }

  // Chart Data Preparation (Last 7 Days)
  const chartData = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const shortName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const log = workoutLogs.find(l => l.log_date === dateStr)
    
    chartData.push({
      name: shortName,
      volume: log?.volume_kg || 0
    })
  }

  const metrics = [
    { label: 'Calories', value: nutrition?.calories || 0, goal: nutrition?.goal_calories || 2000, icon: Flame, color: 'text-orange-500' },
    { label: 'Protein', value: `${nutrition?.protein_g || 0}g`, goal: `${nutrition?.goal_protein_g || 150}g`, icon: Dumbbell, color: 'text-gold' },
    { label: 'Active Mood', value: memory?.emotional_memory?.current?.mood || 'Neutral', goal: 'Status', icon: Activity, color: 'text-green-500' },
    { label: 'Workout Streak', value: `${streak}`, goal: 'Days', icon: Trophy, color: 'text-yellow-400' },
  ]

  // Weekly Totals
  const workoutsThisWeek = chartData.filter(d => d.volume > 0).length
  const workoutsPlanned = schedule ? schedule.frequency : 0

  return (
    <div className="relative min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <motion.div 
          className="flex items-end justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight">Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Here is your daily snapshot.</p>
          </div>
          <Link href="/workout/active" className="flex items-center gap-2 bg-gold text-black font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform glow-gold">
            <Dumbbell className="w-4 h-4" />
            <span className="hidden md:inline">Start Workout</span>
          </Link>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {metrics.map((metric, i) => (
            <div key={i} className="glass-card p-5 md:p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity duration-500">
                <metric.icon className={`w-20 h-20 ${metric.color}`} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  {metric.label}
                </p>
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-gradient-gold mb-1">{metric.value}</h3>
                <p className="text-xs md:text-sm text-muted-foreground/70">/ {metric.goal}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <motion.div 
            className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[2rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-heading font-bold">Activity Pulse</h2>
                <Link href="/workout/history" className="text-xs font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full hover:bg-gold/20 transition-colors">History</Link>
              </div>
              <select className="bg-transparent text-sm text-muted-foreground outline-none border-b border-border pb-1">
                <option>Past 7 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                    formatter={(value: any) => [`${value} kg`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#D4AF6A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
               <div>
                  <p className="text-sm text-muted-foreground">Workouts this week</p>
                  <p className="text-xl font-bold text-foreground">{workoutsThisWeek} <span className="text-sm font-normal text-muted-foreground">/ {workoutsPlanned || '-'} planned</span></p>
               </div>
               {schedule && (
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">Active Plan</p>
                    <p className="text-sm font-semibold text-gold flex items-center gap-1 justify-end"><CalendarCheck className="w-4 h-4"/> {schedule.name}</p>
                 </div>
               )}
            </div>
          </motion.div>

          {/* AI Insight Card */}
          <motion.div 
            className="glass-card p-6 md:p-8 rounded-[2rem] flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-6 glow-gold">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-4">Coach Insights</h2>
            
            <div className="flex-1 space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-sm text-foreground leading-relaxed italic flex items-center gap-2">
                  {insightLoading && <Loader2 className="w-3 h-3 animate-spin text-gold shrink-0" />}
                  "{insight}"
                </p>
              </div>
              
              <div className="pt-4">
                 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Calorie Balance</h3>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In (Food)</span>
                      <span className="font-medium text-foreground">{nutrition?.calories || 0} kcal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Out (Est.)</span>
                      <span className="font-medium text-foreground">{(nutrition?.goal_calories || 2000) + (workoutsThisWeek > 0 ? 300 : 0)} kcal</span>
                    </div>
                 </div>
              </div>

              {memory?.soft_memory?.notes && memory.soft_memory.notes.length > 0 && (
                <div className="pt-4 border-t border-white/5 mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Context</p>
                  <ul className="space-y-2">
                    {memory.soft_memory.notes.slice(-3).map((note, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-gold mt-1">•</span> {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Wearable Telemetry ── */}
        <motion.div
          className="glass-card p-6 md:p-8 rounded-[2rem]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              <Watch className="w-5 h-5 text-blue-400" /> Wearable Telemetry
            </h2>
            <button 
              onClick={handleHealthSync}
              disabled={syncingHealth}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {syncingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {syncingHealth ? 'Syncing...' : 'Sync Device'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Activity className="w-24 h-24 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Daily Steps</h3>
              <p className="text-3xl font-bold text-foreground">
                {memory?.soft_memory?.latest_steps?.toLocaleString() || '---'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">/ 10,000 goal</p>
            </div>
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Moon className="w-24 h-24 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sleep Data</h3>
              <p className="text-3xl font-bold text-foreground">
                {memory?.soft_memory?.latest_sleep_hours || '---'}<span className="text-lg font-normal text-muted-foreground"> hrs</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Last night</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
