import React from 'react'
import { type DailyNutritionSummary } from '@/types'
import { Flame } from 'lucide-react'

const NutritionOverview = React.memo(function NutritionOverview({ nutrition }: { nutrition?: DailyNutritionSummary | null }) {
  if (!nutrition) return null;

  const calPercent = Math.min((nutrition.calories / nutrition.goal_calories) * 100, 100) || 0
  const proPercent = Math.min((nutrition.protein_g / nutrition.goal_protein_g) * 100, 100) || 0
  const carbPercent = Math.min((nutrition.carbs_g / nutrition.goal_carbs_g) * 100, 100) || 0
  const fatPercent = Math.min((nutrition.fat_g / nutrition.goal_fat_g) * 100, 100) || 0

  return (
    <div className="bg-gradient-to-b from-[#161826] to-[#0E101B] p-6 md:p-7 rounded-3xl border border-white/10 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">NUTRITION TARGET</span>
            <p className="text-2xl md:text-3xl font-mono font-black text-white tabular-nums tracking-tight">
              {nutrition.calories.toLocaleString()} <span className="text-xs text-zinc-400 font-normal">/ {nutrition.goal_calories.toLocaleString()} kcal</span>
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-black text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-xl">
          {Math.round(calPercent)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
          style={{ width: `${calPercent}%` }}
        />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-red-400 uppercase">Protein</span>
            <span className="text-[10px] font-mono text-zinc-400">{Math.round(proPercent)}%</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-white tabular-nums">{nutrition.protein_g}g <span className="text-[10px] text-zinc-400 font-normal">/ {nutrition.goal_protein_g}g</span></p>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${proPercent}%` }} />
          </div>
        </div>

        <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Carbs</span>
            <span className="text-[10px] font-mono text-zinc-400">{Math.round(carbPercent)}%</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-white tabular-nums">{nutrition.carbs_g}g <span className="text-[10px] text-zinc-400 font-normal">/ {nutrition.goal_carbs_g}g</span></p>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${carbPercent}%` }} />
          </div>
        </div>

        <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">Fat</span>
            <span className="text-[10px] font-mono text-zinc-400">{Math.round(fatPercent)}%</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-white tabular-nums">{nutrition.fat_g}g <span className="text-[10px] text-zinc-400 font-normal">/ {nutrition.goal_fat_g}g</span></p>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${fatPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default NutritionOverview
