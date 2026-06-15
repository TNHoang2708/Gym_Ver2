'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateBMI, getBMICategory } from '@/lib/nutrition'
import { Scale, TrendingUp, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { HardMemory, WeightLog } from '@/types'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const BMI_CATEGORIES = [
  { label: 'Underweight', range: '<18.5', color: 'text-blue-400' },
  { label: 'Normal', range: '18.5–24.9', color: 'text-green-400' },
  { label: 'Overweight', range: '25–29.9', color: 'text-yellow-400' },
  { label: 'Obese', range: '≥30', color: 'text-red-400' },
]

function getBMIColor(bmi: number): string {
  if (bmi < 18.5) return 'text-blue-400'
  if (bmi < 25) return 'text-green-400'
  if (bmi < 30) return 'text-yellow-400'
  return 'text-red-400'
}

export default function BMIPage() {
  const supabase = createClient()

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [heightCm, setHeightCm] = useState<number | null>(null)
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load height from hard_memory
      const { data: memory } = await supabase
        .from('user_memory')
        .select('hard_memory')
        .eq('user_id', user.id)
        .single()

      if (memory?.hard_memory) {
        const hard = memory.hard_memory as HardMemory
        setHeightCm(hard.height_cm ?? null)
        setCurrentWeight(hard.weight_kg ?? null)
      }

      // Load weight history
      const { data: logs } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })
        .limit(30)

      setWeightLogs(logs ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogWeight(e: React.FormEvent) {
    e.preventDefault()
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight < 20 || weight > 500) {
      toast.error('Please enter a valid weight (20–500 kg)')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weight_logs')
      .upsert(
        { user_id: user.id, log_date: today, weight_kg: weight },
        { onConflict: 'user_id,log_date' }
      )
      .select()
      .single()

    if (error) {
      toast.error('Failed to log weight')
      return
    }

    // Also update hard_memory with latest weight
    await supabase
      .from('user_memory')
      .update({ hard_memory: { weight_kg: weight } })
      .eq('user_id', user.id)

    setCurrentWeight(weight)
    setWeightLogs((prev) => {
      const filtered = prev.filter((l) => l.log_date !== today)
      return [...filtered, data as WeightLog].sort((a, b) =>
        a.log_date.localeCompare(b.log_date)
      )
    })
    setNewWeight('')
    toast.success(`Weight logged: ${weight} kg`)
  }

  const bmi = currentWeight && heightCm ? calculateBMI(currentWeight, heightCm) : null
  const bmiCategory = bmi ? getBMICategory(bmi) : null

  const chartData = weightLogs.map((log) => ({
    date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight_kg,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          BMI & Weight
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your body composition over time</p>
      </div>

      {/* BMI Card */}
      {bmi && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-6 h-6 text-crimson" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your BMI</p>
          <p className={cn('text-5xl font-extrabold', getBMIColor(bmi))}>{bmi}</p>
          <p className={cn('text-sm font-semibold mt-1', getBMIColor(bmi))}>{bmiCategory}</p>
          <p className="text-xs text-muted-foreground mt-3">
            Based on {currentWeight} kg · {heightCm} cm
          </p>

          {/* BMI scale */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {BMI_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={cn(
                  'rounded-lg p-2 text-center border',
                  bmiCategory === cat.label
                    ? 'border-current bg-current/10'
                    : 'border-border bg-secondary/50',
                  cat.color
                )}
              >
                <p className="text-[10px] font-bold">{cat.label}</p>
                <p className="text-[9px] opacity-70">{cat.range}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Weight */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-bold mb-3">Log Today&apos;s Weight</h2>
        <form onSubmit={handleLogWeight} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder={currentWeight ? String(currentWeight) : '75.0'}
              min="20"
              max="500"
              step="0.1"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 pr-12 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              kg
            </span>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-crimson hover:bg-crimson/90 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Log
          </button>
        </form>
      </div>

      {/* Weight History Chart */}
      {chartData.length > 1 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-crimson" />
            <h2 className="text-sm font-bold">Weight History</h2>
            <span className="ml-auto text-xs text-muted-foreground">Last {chartData.length} entries</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  width={35}
                  tickFormatter={(v) => `${v}kg`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.1 0 0)',
                    border: '1px solid oklch(0.18 0 0)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'oklch(0.96 0 0)',
                  }}
                  formatter={(v) => [`${v} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ fill: '#e11d48', r: 3 }}
                  activeDot={{ r: 5, fill: '#e11d48' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History list */}
      {weightLogs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All Entries</h2>
          {[...weightLogs].reverse().slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">
                {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-sm font-bold text-foreground">{log.weight_kg} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
