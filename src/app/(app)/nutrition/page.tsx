'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Flame, Zap, Wheat, Droplets } from 'lucide-react'
import { toast } from 'sonner'
import type { FoodLog, HardMemory, NutritionGoals, SoftMemory } from '@/types'
import { calculateNutritionGoals } from '@/lib/nutrition'
import { cn } from '@/lib/utils'

// =====================================================
// PROGRESS BAR
// =====================================================
function MacroBar({
  label,
  current,
  goal,
  unit,
  color,
  icon: Icon,
}: {
  label: string
  current: number
  goal: number
  unit: string
  color: string
  icon: React.ElementType
}) {
  const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0)
  const isOver = current > goal

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={2.5} />
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <span className={cn('text-xs font-semibold', isOver ? 'text-yellow-500' : 'text-muted-foreground')}>
          {Math.round(current)}{unit} / {Math.round(goal)}{unit}
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-500',
            isOver ? 'bg-yellow-500' : color.replace('text-', 'bg-')
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// =====================================================
// ADD FOOD FORM
// =====================================================
function AddFoodForm({ onAdd }: { onAdd: (food: Omit<FoodLog, 'id' | 'user_id' | 'created_at'>) => void }) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [open, setOpen] = useState(false)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !calories) return

    const today = new Date().toISOString().split('T')[0]
    onAdd({
      log_date: today,
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
    })

    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-crimson/30 hover:text-crimson transition-all"
      >
        <Plus className="w-4 h-4" />
        Log Food
      </button>
    )
  }

  return (
    <form onSubmit={handleAdd} className="glass-card rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-foreground">Add Food Entry</h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Food name (e.g. Chicken breast)"
        required
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson/30 transition-all"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Calories *</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="0"
            required
            min="0"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 transition-all mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Protein (g)</label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="0"
            min="0"
            step="0.1"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 transition-all mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Carbs (g)</label>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="0"
            min="0"
            step="0.1"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 transition-all mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fat (g)</label>
          <input
            type="number"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="0"
            min="0"
            step="0.1"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 transition-all mt-1"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 text-sm bg-crimson hover:bg-crimson/90 text-white rounded-lg font-semibold transition-all"
        >
          Add Entry
        </button>
      </div>
    </form>
  )
}

// =====================================================
// NUTRITION PAGE
// =====================================================
export default function NutritionPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [goals, setGoals] = useState<NutritionGoals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load nutrition goals from memory
      const { data: memory } = await supabase
        .from('user_memory')
        .select('hard_memory, soft_memory')
        .eq('user_id', user.id)
        .single()

      if (memory) {
        const hard = (memory.hard_memory ?? {}) as HardMemory
        const soft = (memory.soft_memory ?? {}) as SoftMemory
        setGoals(calculateNutritionGoals(hard, soft))
      }

      // Load today's food logs
      const { data: logs } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .order('created_at', { ascending: true })

      setFoodLogs(logs ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  async function handleAddFood(food: Omit<FoodLog, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('food_logs')
      .insert({ ...food, user_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Failed to add food entry')
      return
    }

    setFoodLogs((prev) => [...prev, data as FoodLog])
    toast.success(`${food.name} logged!`)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete entry')
      return
    }
    setFoodLogs((prev) => prev.filter((f) => f.id !== id))
  }

  // Calculate totals
  const totals = foodLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein_g: acc.protein_g + log.protein_g,
      carbs_g: acc.carbs_g + log.carbs_g,
      fat_g: acc.fat_g + log.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading nutrition…</div>
      </div>
    )
  }

  const calRemaining = goals ? Math.max(0, goals.goal_calories - totals.calories) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Nutrition
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Calorie summary card */}
      {goals && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Calories Today</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-foreground">{totals.calories}</span>
                <span className="text-muted-foreground text-sm">/ {goals.goal_calories} kcal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                calRemaining === 0 ? 'text-yellow-500' : 'text-crimson'
              )}>
                {calRemaining}
              </p>
            </div>
          </div>

          {/* Big calorie progress */}
          <div className="w-full bg-secondary rounded-full h-3 mb-5">
            <div
              className={cn(
                'h-3 rounded-full transition-all duration-500',
                totals.calories > goals.goal_calories ? 'bg-yellow-500' : 'bg-crimson'
              )}
              style={{ width: `${Math.min(100, (totals.calories / goals.goal_calories) * 100)}%` }}
            />
          </div>

          {/* Macro bars */}
          <div className="space-y-3">
            <MacroBar
              label="Protein"
              current={totals.protein_g}
              goal={goals.goal_protein_g}
              unit="g"
              color="text-crimson"
              icon={Zap}
            />
            <MacroBar
              label="Carbs"
              current={totals.carbs_g}
              goal={goals.goal_carbs_g}
              unit="g"
              color="text-blue-400"
              icon={Wheat}
            />
            <MacroBar
              label="Fat"
              current={totals.fat_g}
              goal={goals.goal_fat_g}
              unit="g"
              color="text-orange-400"
              icon={Droplets}
            />
          </div>
        </div>
      )}

      {/* Today's meals */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Today&apos;s Meals ({foodLogs.length})
        </h2>

        {foodLogs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No meals logged yet today.
          </div>
        ) : (
          <div className="space-y-2">
            {foodLogs.map((log) => (
              <div
                key={log.id}
                className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-crimson/10 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 text-crimson" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{log.name}</p>
                  <p className="text-xs text-muted-foreground">
                    P: {log.protein_g}g · C: {log.carbs_g}g · F: {log.fat_g}g
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{log.calories}</p>
                  <p className="text-[10px] text-muted-foreground">kcal</p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add food form */}
        <AddFoodForm onAdd={handleAddFood} />
      </div>

      {/* BMR info */}
      {goals && (
        <div className="border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground text-sm mb-2">Your targets (calculated from your profile)</p>
          <p>BMR: <span className="text-foreground font-medium">{goals.bmr} kcal</span></p>
          <p>TDEE (×1.55 activity): <span className="text-foreground font-medium">{goals.tdee} kcal</span></p>
          <p>Daily goal: <span className="text-crimson font-bold">{goals.goal_calories} kcal</span></p>
          <p className="text-[10px] pt-1 border-t border-border mt-2">
            Mifflin-St Jeor formula · Update your weight in Profile to recalculate
          </p>
        </div>
      )}
    </div>
  )
}
