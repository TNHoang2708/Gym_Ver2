'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Dumbbell, Trophy, Sparkles, Watch, ChevronDown, ChevronUp, Loader2, Droplet, Scale, X, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { syncHealthData } from '@/lib/health/sync'
import { haptic } from '@/lib/haptics'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const DashboardChart = dynamic(() => import('@/components/charts/DashboardChart'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div> 
})
import type { UserMemory, DailyNutritionSummary, WorkoutLog, WorkoutSchedule } from '@/types'
import { useDashboardData } from '@/lib/hooks/use-data'
import AIQuickLogger from '@/components/AIQuickLogger'
import NutritionOverview from '@/components/NutritionOverview'
import WeeklyStrip from '@/components/WeeklyStrip'
import PullToRefresh from '@/components/PullToRefresh'

export default function DashboardPage() {
  const { data, isLoading, mutate } = useDashboardData()
  const [insightLoading, setInsightLoading] = useState(false)
  const [syncingHealth, setSyncingHealth] = useState(false)
  const [insight, setInsight] = useState("Stay focused. Today is another opportunity to get closer to your goals.")
  const [showCharts, setShowCharts] = useState(false)

  // Quick Actions state
  const [waterLogged, setWaterLogged] = useState(0)
  const [loggingWater, setLoggingWater] = useState(false)
  // Weight Modal state
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)

  // Determine Greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  useEffect(() => {
    if (!data) return
    // Cache insight in localStorage — TTL 6 hours to avoid unnecessary API calls
    const CACHE_KEY = 'dashboard_insight'
    const TTL_MS = 6 * 60 * 60 * 1000
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { text, ts } = JSON.parse(cached)
        if (Date.now() - ts < TTL_MS) {
          setInsight(text)
          return
        }
      }
    } catch {}

    setInsightLoading(true)
    fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nutrition: data.nutrition, workoutStreak: data.streak })
    })
    .then(res => res.json())
    .then(json => {
      if (json.insight) {
        setInsight(json.insight)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ text: json.insight, ts: Date.now() })) } catch {}
      }
    })
    .catch(err => console.error('Failed to fetch insight:', err))
    .finally(() => setInsightLoading(false))
  }, [data?.streak])

  if (isLoading || !data) {
    return (
      <div className="relative min-h-[100dvh]">
        <div className="relative z-10 max-w-xl mx-auto px-6 pt-12 pb-24 space-y-10 animate-pulse">
          {/* Hero Skeleton */}
          <div className="text-center space-y-6">
            <div>
              <div className="w-48 h-8 bg-white/10 rounded-lg mx-auto mb-2" />
              <div className="w-64 h-10 bg-white/10 rounded-lg mx-auto" />
            </div>
            <div className="w-full h-[68px] bg-white/5 rounded-2xl" />
          </div>
          
          {/* Insight Skeleton */}
          <div className="w-full h-[88px] bg-white/5 rounded-2xl border border-white/5" />
          
          {/* Quick Logger Skeleton */}
          <div className="w-full h-[120px] bg-white/5 rounded-2xl border border-white/5" />
          
          {/* Nutrition Skeleton */}
          <div className="w-full h-[180px] bg-white/5 rounded-2xl border border-white/5" />
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2">
            <div className="w-full h-[100px] bg-white/5 rounded-2xl" />
            <div className="w-full h-[100px] bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const { memory, nutrition, workoutLogs, streak } = data
  const name = memory?.display_name || 'Boss'

  // Has worked out today?
  const todayStr = new Date().toISOString().split('T')[0]
  const workedOutToday = workoutLogs.some(l => l.log_date === todayStr)

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

  async function handleLogWater() {
    if (loggingWater) return
    setLoggingWater(true)
    haptic.success()
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('food_logs').insert({
        user_id: user.id,
        log_date: today,
        name: 'Water 💧',
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      })
      setWaterLogged(prev => prev + 250)
      toast.success(`Water logged (${waterLogged + 250}ml today) 💧`)
    } catch {
      toast.error('Failed to log water')
    }
    setLoggingWater(false)
  }

  async function handleSaveWeight() {
    if (!weightInput || isNaN(parseFloat(weightInput))) {
      toast.error('Enter a valid weight')
      return
    }
    setSavingWeight(true)
    haptic.medium()
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('weight_logs').upsert({
        user_id: user.id,
        log_date: today,
        weight_kg: parseFloat(weightInput),
      }, { onConflict: 'user_id,log_date' })
      if (error) throw error
      toast.success(`Weight logged: ${weightInput} kg ⚖️`)
      setShowWeightModal(false)
      setWeightInput('')
      mutate()
    } catch {
      toast.error('Failed to log weight')
    }
    setSavingWeight(false)
  }

  // Chart Data — Real data only, no fake fallback
  const chartData = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const shortName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const log = workoutLogs.find((l: any) => l.log_date === dateStr)
    chartData.push({ name: shortName, volume: log?.volume_kg || 0 })
  }
  const hasRealChartData = chartData.some(d => d.volume > 0)


  return (
    <PullToRefresh onRefresh={async () => { await mutate() }}>
      <div className="relative min-h-[100dvh]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-28 space-y-6">

          {/* ========================================================================= */}
          {/* HERO LAUNCHPAD BANNER                                                     */}
          {/* ========================================================================= */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative bg-gradient-to-r from-[#1E2238] via-[#141624] to-[#0E101A] p-7 md:p-8 rounded-3xl border border-red-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-600/20 transition-all duration-500" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                      {workedOutToday ? 'COMPLETED TODAY' : 'TODAY\'S WORKOUT SESSION'}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-heading font-black text-white uppercase tracking-tight">
                    {workedOutToday ? 'RECOVERY & NUTRITION MODE' : 'PUSH DAY — CHEST & TRICEPS'}
                  </h1>
                  <p className="text-xs text-zinc-300 font-mono">
                    {workedOutToday ? 'Primary lifts completed. Hit your protein target and hydrate.' : '4 Main Exercises · 12 Total Sets · High Intensity Target'}
                  </p>
                </div>

                <Link
                  href={workedOutToday ? "/nutrition" : "/workout/active"}
                  onClick={() => haptic.heavy()}
                  className="inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-mono font-black uppercase tracking-wider text-xs md:text-sm py-4 px-8 rounded-2xl active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,51,51,0.5)] shrink-0 min-h-[50px]"
                >
                  <Dumbbell className="w-5 h-5 fill-current" />
                  <span>{workedOutToday ? 'LOG NEXT MEAL' : 'START WORKOUT NOW'}</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* WEEKLY 7-DAY ACTIVITY STRIP                                               */}
          {/* ========================================================================= */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <WeeklyStrip workoutLogs={workoutLogs} />
          </motion.div>

          {/* ========================================================================= */}
          {/* 4 TELEMETRY STAT CARDS (HIGH CONTRAST)                                    */}
          {/* ========================================================================= */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* Streak Card */}
              <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-5 rounded-2xl border border-white/10 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all flex flex-col justify-between h-32 group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">Streak</span>
                  <Trophy className="w-5 h-5 text-amber-400 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-mono font-black text-white tabular-nums tracking-tight">{streak}</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Days Active</p>
                </div>
              </div>

              {/* XP Card */}
              <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-5 rounded-2xl border border-white/10 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(255,51,51,0.15)] transition-all flex flex-col justify-between h-32 group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">Athletic XP</span>
                  <Sparkles className="w-5 h-5 text-red-500 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-mono font-black text-white tabular-nums tracking-tight">{memory?.xp_points || 0}</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Points</p>
                </div>
              </div>

              {/* Steps Card */}
              <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-5 rounded-2xl border border-white/10 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all flex flex-col justify-between h-32 group relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest">Steps</span>
                  <Watch className="w-5 h-5 text-purple-400 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-mono font-black text-white tabular-nums tracking-tight">{memory?.soft_memory?.latest_steps?.toLocaleString() || '0'}</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Daily Goal</p>
                </div>
                <button onClick={handleHealthSync} disabled={syncingHealth} aria-label="Sync Health Data" className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity className={`w-4 h-4 text-purple-400 ${syncingHealth ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Mood Card */}
              <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all flex flex-col justify-between h-32 group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Mood</span>
                  <Activity className="w-5 h-5 text-emerald-400 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-mono font-bold text-white uppercase tracking-tight">{memory?.emotional_memory?.current?.mood || 'Neutral'}</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">Recovery Status</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* AI COACH NOTE                                                             */}
          {/* ========================================================================= */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link href="/ai-coach" onClick={() => haptic.light()} className="block group">
              <div className="bg-gradient-to-r from-[#161826] to-[#0E101B] p-5 rounded-2xl border border-white/10 group-hover:border-red-500/30 transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  {insightLoading ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : <Sparkles className="w-5 h-5 text-red-500" />}
                </div>
                <p className="text-xs md:text-sm text-zinc-200 italic truncate flex-1">"{insight}"</p>
                <span className="text-xs font-mono font-bold text-red-400 group-hover:text-white transition-colors shrink-0">Ask AI Coach →</span>
              </div>
            </Link>
          </motion.div>

          {/* ========================================================================= */}
          {/* NUTRITION TELEMETRY OVERVIEW                                              */}
          {/* ========================================================================= */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <NutritionOverview nutrition={nutrition} />
          </motion.div>

          {/* ========================================================================= */}
          {/* QUICK LOGGING & WEEKLY VOLUME                                             */}
          {/* ========================================================================= */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">QUICK LOGGING ENGINE</span>
              <AIQuickLogger />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button 
                  onClick={handleLogWater}
                  disabled={loggingWater}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all min-h-[48px] active:scale-95 ${
                    waterLogged > 0 ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-black/30 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <Droplet className="w-4 h-4 text-blue-400" />
                  <span>{waterLogged > 0 ? `${waterLogged}ml` : '+ Water'}</span>
                </button>

                <button 
                  onClick={() => { haptic.light(); setShowWeightModal(true) }}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-300 hover:border-white/20 flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all min-h-[48px] active:scale-95"
                >
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>+ Weight</span>
                </button>
              </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
              <button 
                onClick={() => setShowCharts(!showCharts)}
                className="w-full flex items-center justify-between p-6 text-xs font-mono font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
              >
                <span>Weekly Volume Pulse</span>
                {showCharts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showCharts && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-0 pb-6 px-6">
                      {hasRealChartData ? (
                        <div className="h-[160px] w-full bg-black/30 rounded-2xl p-3 border border-white/5">
                          <DashboardChart data={chartData} />
                        </div>
                      ) : (
                        <div className="h-[100px] flex items-center justify-center rounded-2xl border border-white/5 bg-black/30">
                          <p className="text-xs font-mono text-zinc-400">No workout volume data yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Weight Log Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWeightModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg">Log Today's Weight</h3>
                <button onClick={() => setShowWeightModal(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 75.5"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-lg font-bold text-center focus:outline-none focus:border-gold/50 transition-colors"
                />
                <span className="text-muted-foreground font-semibold">kg</span>
              </div>
              <button
                onClick={handleSaveWeight}
                disabled={savingWeight}
                className="w-full bg-gold text-gold-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all glow-gold"
              >
                {savingWeight ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scale className="w-5 h-5" />}
                Save Weight
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PullToRefresh>
  )
}
