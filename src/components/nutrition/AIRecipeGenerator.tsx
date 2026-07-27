'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Loader2, Utensils, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { haptic } from '@/lib/haptics'

interface AIRecipeGeneratorProps {
  goals: { goal_calories: number, goal_protein_g: number, goal_carbs_g: number, goal_fat_g: number }
  totals: { cal: number, pro: number, carb: number, fat: number }
  logs: any[]
  mutate: () => void
  onSwitchToLog: () => void
}

export function AIRecipeGenerator({ goals, totals, logs, mutate, onSwitchToLog }: AIRecipeGeneratorProps) {
  const [generatingRecipe, setGeneratingRecipe] = useState(false)
  const [aiRecipe, setAiRecipe] = useState<any>(null)
  const [isLoggingAI, setIsLoggingAI] = useState(false)

  async function generateAIRecipe() {
    setGeneratingRecipe(true)
    setAiRecipe(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not auth')

      const { data: memData } = await supabase.from('user_memory').select('*').eq('user_id', user.id).single()
      const dietaryLifestyles = memData?.hard_memory?.dietary_lifestyles || []
      const allergies = memData?.hard_memory?.allergies || []

      const remainingCalories = Math.max(0, goals.goal_calories - totals.cal)
      const remainingProtein = Math.max(0, goals.goal_protein_g - totals.pro)

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCalories: remainingCalories > 200 ? remainingCalories : goals.goal_calories / 3,
          targetProtein: remainingProtein > 10 ? remainingProtein : goals.goal_protein_g / 3,
          dietaryLifestyles,
          allergies
        })
      })

      const data = await res.json()
      if (data.recipe) {
        setAiRecipe(data.recipe)
      } else {
        toast.error('Failed to generate recipe')
      }
    } catch (err) {
      toast.error('AI Error')
    }
    setGeneratingRecipe(false)
  }

  async function logAIRecipe() {
    if (!aiRecipe || isLoggingAI) return
    setIsLoggingAI(true)
    try {
      // Duplicate entry guard
      const alreadyLogged = logs.some((l: any) => l.name === aiRecipe.mealName + ' (AI Generated)')
      if (alreadyLogged) {
        toast.error('This AI meal has already been logged today!')
        setIsLoggingAI(false)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        setIsLoggingAI(false)
        return
      }

      const newLog = {
        user_id: user.id,
        name: aiRecipe.mealName + ' (AI Generated)',
        calories: aiRecipe.macros.calories,
        protein_g: aiRecipe.macros.protein,
        carbs_g: aiRecipe.macros.carbs,
        fat_g: aiRecipe.macros.fat,
        log_date: new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase.from('food_logs').insert([newLog])
      if (!error) {
        toast.success('AI Meal Logged successfully!')
        setAiRecipe(null)
        onSwitchToLog()
        mutate()
      } else {
        toast.error('Failed to log meal: ' + error.message)
      }
    } catch (e: any) {
      toast.error('An error occurred')
    }
    setIsLoggingAI(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="iron-card p-8 rounded-[2rem] text-center">
        <h2 className="text-2xl font-bold mb-2">AI Dietician</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Need meal inspiration? Based on your remaining macros today, your dietary lifestyles, and allergies, the AI will construct a perfect recipe for you.
        </p>
        <button 
          onClick={() => { haptic.medium(); generateAIRecipe(); }}
          disabled={generatingRecipe}
          className="px-8 py-4 bg-gradient-fire text-white rounded-2xl font-black text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto glow-gold disabled:opacity-50 disabled:scale-100 active:scale-95 transform-gpu uppercase tracking-widest border-t border-white/20 shadow-xl"
        >
          {generatingRecipe ? <Loader2 className="w-6 h-6 animate-spin" /> : <Flame className="w-6 h-6" />}
          {generatingRecipe ? 'Crafting Recipe...' : 'Generate Meal'}
        </button>
      </div>

      {aiRecipe && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="iron-card p-6 rounded-[2rem]">
          <div className="relative w-full h-56 mb-6 rounded-2xl overflow-hidden group bg-black/40 border border-white/5 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-blue-500/20 opacity-80 z-10 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img 
              src={`https://image.pollinations.ai/prompt/delicious%20food%20${encodeURIComponent(aiRecipe.mealName)}`}
              alt="AI Michelin Recipe" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="relative z-20 text-center">
              <Utensils className="w-10 h-10 text-gold mb-2 mx-auto drop-shadow-lg" />
              <p className="text-xs text-white uppercase tracking-widest font-bold drop-shadow-md bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">AI Michelin Recipe</p>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{aiRecipe.mealName}</h3>
          <p className="text-sm text-muted-foreground mb-4">Prep time: {aiRecipe.prepTimeMinutes} mins</p>
          
          <div className="flex gap-2 mb-6">
            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold">{aiRecipe.macros.calories} kcal</span>
            <span className="px-3 py-1 bg-gold/10 text-gold rounded-full text-xs font-bold">{aiRecipe.macros.protein}g P</span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold">{aiRecipe.macros.carbs}g C</span>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold">{aiRecipe.macros.fat}g F</span>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Ingredients</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {aiRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                {aiRecipe.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
              </ol>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            {(() => {
              const alreadyLogged = logs.some((l: any) => l.name === aiRecipe.mealName + ' (AI Generated)');
              return (
                <button 
                  onClick={() => { haptic.success(); logAIRecipe(); }}
                  disabled={isLoggingAI || alreadyLogged}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transform-gpu"
                >
                  {isLoggingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : (alreadyLogged ? <Check className="w-5 h-5 text-green-400" /> : <Plus className="w-5 h-5" />)} 
                  {isLoggingAI ? 'Logging...' : (alreadyLogged ? 'Logged Today' : 'Log This Meal')}
                </button>
              );
            })()}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
