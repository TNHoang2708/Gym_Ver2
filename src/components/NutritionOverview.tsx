import { type DailyNutritionSummary } from '@/types'

export default function NutritionOverview({ nutrition }: { nutrition?: DailyNutritionSummary | null }) {
  if (!nutrition) return null;

  const calPercent = Math.min((nutrition.calories / nutrition.goal_calories) * 100, 100) || 0
  const proPercent = Math.min((nutrition.protein_g / nutrition.goal_protein_g) * 100, 100) || 0
  const carbPercent = Math.min((nutrition.carbs_g / nutrition.goal_carbs_g) * 100, 100) || 0
  const fatPercent = Math.min((nutrition.fat_g / nutrition.goal_fat_g) * 100, 100) || 0

  return (
    <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
      
      <div className="flex justify-between items-end mb-6 relative z-10">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Nutrition</p>
          <p className="text-3xl font-heading font-bold text-foreground">
            {nutrition.calories} <span className="text-sm font-normal text-muted-foreground">/ {nutrition.goal_calories} kcal</span>
          </p>
        </div>
      </div>

      {/* Main Calorie Bar */}
      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden mb-6 relative z-10 border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${calPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 relative z-10">
        {/* Protein */}
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Protein</p>
          <p className="font-bold text-foreground">{nutrition.protein_g}g <span className="text-xs text-muted-foreground font-normal">/ {nutrition.goal_protein_g}g</span></p>
          <div className="h-1.5 w-full bg-black/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${proPercent}%` }} />
          </div>
        </div>
        {/* Carbs */}
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Carbs</p>
          <p className="font-bold text-foreground">{nutrition.carbs_g}g <span className="text-xs text-muted-foreground font-normal">/ {nutrition.goal_carbs_g}g</span></p>
          <div className="h-1.5 w-full bg-black/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${carbPercent}%` }} />
          </div>
        </div>
        {/* Fat */}
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Fat</p>
          <p className="font-bold text-foreground">{nutrition.fat_g}g <span className="text-xs text-muted-foreground font-normal">/ {nutrition.goal_fat_g}g</span></p>
          <div className="h-1.5 w-full bg-black/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${fatPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
