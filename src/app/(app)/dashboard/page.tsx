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

      <div className="relative z-10 max-w-xl mx-auto px-6 pt-12 pb-24 space-y-10">
        
        {/* 1. Hero Section & Main CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">{greeting},</h1>
            <h2 className="text-4xl font-heading font-bold text-gradient-gold">{name}</h2>
          </div>

          <Link 
            href={workedOutToday ? "/nutrition" : "/workout/active"}
            onClick={() => haptic.heavy()}
            className="block w-full bg-gold text-gold-foreground font-bold text-lg py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all transform-gpu glow-gold shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {workedOutToday ? 'Log Next Meal' : 'Start Workout'} 
            </span>
          </Link>
        </motion.div>

        {/* 2. AI Insight Pill */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Link href="/ai-coach" onClick={() => haptic.light()} className="block">
            <div className="glass-card p-4 rounded-2xl flex items-start gap-3 hover:bg-white/5 transition-colors border border-gold/20">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                {insightLoading ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Sparkles className="w-4 h-4 text-gold" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Coach Note</p>
                <p className="text-sm text-foreground/90 italic leading-relaxed line-clamp-2">"{insight}"</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 2.5 Quick Logger & Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <AIQuickLogger />
          
          <div className="flex gap-3">
            <button 
              onClick={handleLogWater}
              disabled={loggingWater}
              className={`flex-1 glass-card p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors active:scale-95 transform-gpu ${waterLogged > 0 ? 'bg-blue-500/10 border-blue-500/40' : 'hover:bg-white/5 border-blue-500/20'}`}
            >
              {loggingWater ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <Droplet className={`w-5 h-5 ${waterLogged > 0 ? 'text-blue-300' : 'text-blue-400'}`} />}
              <span className={`text-xs font-bold ${waterLogged > 0 ? 'text-blue-300' : 'text-blue-400'}`}>
                {waterLogged > 0 ? `${waterLogged}ml` : 'Water'}
              </span>
            </button>
            <button 
              onClick={() => { haptic.light(); setShowWeightModal(true) }}
              className="flex-1 glass-card p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 border-green-500/20 transition-colors active:scale-95 transform-gpu"
            >
              <Scale className="w-5 h-5 text-green-400" />
              <span className="text-xs font-bold text-green-400">Weight</span>
            </button>
          </div>
        </motion.div>

        {/* 3. Nutrition Overview & Core Metrics Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          <NutritionOverview nutrition={nutrition} />
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5">
              <Activity className="w-5 h-5 text-green-500 mb-2" />
              <span className="text-sm font-bold text-foreground">{memory?.emotional_memory?.current?.mood || 'Neutral'}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Mood</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5">
              <Trophy className="w-5 h-5 text-yellow-400 mb-2" />
              <span className="text-sm font-bold text-foreground">{streak}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Day Streak</span>
            </div>
          </div>
        </motion.div>

        {/* 4. Compact Wearable Telemetry */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-4">
              <Watch className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-sm font-bold text-foreground">{memory?.soft_memory?.latest_steps?.toLocaleString() || '---'} <span className="text-xs font-normal text-muted-foreground">steps</span></p>
                <p className="text-sm font-bold text-foreground">{memory?.soft_memory?.latest_sleep_hours || '---'} <span className="text-xs font-normal text-muted-foreground">hrs sleep</span></p>
              </div>
            </div>
            <button onClick={handleHealthSync} disabled={syncingHealth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors">
              <Activity className={`w-5 h-5 ${syncingHealth ? 'animate-pulse text-blue-400' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* 5. Collapsible Activity Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <button 
            onClick={() => setShowCharts(!showCharts)}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Weekly Pulse</span>
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
                <div className="pt-2 pb-6 px-2">
                  {hasRealChartData ? (
                    <div className="h-[200px] w-full bg-gradient-to-b from-white/[0.02] to-black/20 rounded-2xl p-4 border border-white/5 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                      <DashboardChart data={chartData} />
                    </div>
                  ) : (
                    <div className="h-[140px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                      <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Complete a workout to see your volume chart</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
