'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Utensils, Plus, Flame, Loader2, Trash2, Search, TrendingUp, Coffee, Sun, Moon, Cookie, X, Star, ScanLine, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { calculateNutritionGoals } from '@/lib/nutrition'
import { haptic } from '@/lib/haptics'
import type { HardMemory, SoftMemory, NutritionGoals, FoodFavourite } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FoodLog {
  id: string
  meal_type?: string
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  created_at: string
}

interface FoodSearchResult {
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface WeekDay {
  label: string
  date: string
  protein_cal: number
  carbs_cal: number
  fat_cal: number
  total_cal: number
  isToday: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const MEAL_TYPES = [
  { value: 'Breakfast', icon: Coffee, color: 'text-orange-400' },
  { value: 'Lunch',     icon: Sun,    color: 'text-yellow-400' },
  { value: 'Dinner',    icon: Moon,   color: 'text-blue-400'   },
  { value: 'Snack',     icon: Cookie, color: 'text-purple-400' },
] as const

type MealType = typeof MEAL_TYPES[number]['value']

// ─── Open Food Facts search ────────────────────────────────────────────────────
async function searchFood(query: string): Promise<FoodSearchResult[]> {
  if (query.length < 2) return []
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments`
    )
    const data = await res.json()
    return (data.products ?? [])
      .filter((p: Record<string, unknown>) => p.product_name)
      .slice(0, 7)
      .map((p: Record<string, unknown>) => {
        const n = (p.nutriments ?? {}) as Record<string, number>
        return {
          food_name: String(p.product_name),
          calories:  Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ?? 0) / 4.184),
          protein_g: Math.round(n['proteins_100g'] ?? 0),
          carbs_g:   Math.round(n['carbohydrates_100g'] ?? 0),
          fat_g:     Math.round(n['fat_100g'] ?? 0),
        }
      })
  } catch {
    return []
  }
}

async function getFoodByBarcode(barcode: string): Promise<FoodSearchResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    const data = await res.json()
    if (data.status === 1 && data.product) {
      const p = data.product
      const n = (p.nutriments ?? {}) as Record<string, number>
      return {
        food_name: String(p.product_name || 'Unknown Product'),
        calories:  Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ?? 0) / 4.184),
        protein_g: Math.round(n['proteins_100g'] ?? 0),
        carbs_g:   Math.round(n['carbohydrates_100g'] ?? 0),
        fat_g:     Math.round(n['fat_100g'] ?? 0),
      }
    }
  } catch {
    // ignore
  }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────
import { useNutritionData } from '@/lib/hooks/use-data'

export default function NutritionPage() {
  const supabase = createClient()
  const { data, isLoading, mutate } = useNutritionData()
  const logs = data?.todayLogs || []
  const weekData = data?.weekData || []
  const favourites = data?.favourites || []

  // Derived Goals from memory
  const memData = data?.memory
  let goals = { bmr: 0, tdee: 0, goal_calories: 2200, goal_protein_g: 160, goal_carbs_g: 250, goal_fat_g: 70 }
  if (memData?.hard_memory) {
    goals = calculateNutritionGoals(memData.hard_memory as HardMemory, (memData.soft_memory ?? {}) as SoftMemory)
  }

  const [showAdd, setShowAdd] = useState(false)
  const [viewMode, setViewMode] = useState<'log' | 'ai'>('log')
  
  // AI Recipe State
  const [generatingRecipe, setGeneratingRecipe] = useState(false)
  const [aiRecipe, setAiRecipe] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<MealType | 'All'>('All')
  
  // Form State
  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mealType, setMealType] = useState<MealType>('Breakfast')
  const [foodName, setFoodName] = useState('')

  // AI Scanner State
  const [showScanner, setShowScanner] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Meal Generator State
  const [showGenerator, setShowGenerator] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoggingAI, setIsLoggingAI] = useState(false)
  const [preferences, setPreferences] = useState('')
  const [generatedMeal, setGeneratedMeal] = useState<{
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    recipe: string;
  } | null>(null)

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  // Search state
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
  const [searching,     setSearching]     = useState(false)
  const [showResults,   setShowResults]   = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scanner state
  const [isScanning, setIsScanning] = useState(false)

  // Camera/Image state
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)



  // ── Scanner Logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (showScanner && !html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader")
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          if (isScanning) return // prevent multiple hits
          setIsScanning(true)
          
          toast.success("Barcode scanned! Fetching food...")
          const result = await getFoodByBarcode(decodedText)
          
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current?.clear()
              setShowScanner(false)
            }).catch(console.error)
          }

          if (result) {
            selectFood(result)
            toast.success("Found " + result.food_name)
          } else {
            toast.error("Food not found in database.")
          }
          setIsScanning(false)
        },
        () => {} // ignore errors (scan loop)
      ).catch((err) => {
        toast.error("Could not start camera.")
        console.error(err)
        setShowScanner(false)
      })
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear()
        }).catch(console.error)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner])

  // ── Camera / Vision Logic ──────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAnalyzingImage(true)
    toast.success("Analyzing food image...")
    try {
      const { compressImage } = await import('@/lib/utils/image-compression')
      const compressedImage = await compressImage(file, 800, 800, 0.8)

      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedImage })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Vision API failed')

      const result = data.result
      setFoodName(result.foodName || '')
      setSearchQuery(result.foodName || '')
      setCalories(String(result.calories || 0))
      setProtein(String(result.protein_g || 0))
      setCarbs(String(result.carbs_g || 0))
      setFat(String(result.fat_g || 0))
      
      toast.success("Food analyzed successfully!")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to analyze image.")
    } finally {
      setIsAnalyzingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }


  // ── Food search (debounced) ────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    setFoodName(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 2) { setSearchResults([]); setShowResults(false); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      const results = await searchFood(q)
      setSearchResults(results)
      setShowResults(results.length > 0)
      setSearching(false)
    }, 400)
  }, [])

  if (isLoading) {
    return (
      <div className="relative min-h-screen px-4 pt-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-white/5 rounded-lg"></div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
            <div className="h-32 bg-white/5 rounded-[2rem]"></div>
          </div>
          <div className="h-64 bg-white/5 rounded-[2rem]"></div>
        </div>
      </div>
    )
  }

  function selectFood(item: { food_name: string, calories: number, protein_g: number, carbs_g: number, fat_g: number }) {
    setFoodName(item.food_name)
    setSearchQuery(item.food_name)
    setCalories(item.calories > 0 ? String(item.calories) : '')
    setProtein(item.protein_g > 0 ? String(item.protein_g) : '')
    setCarbs(item.carbs_g > 0 ? String(item.carbs_g) : '')
    setFat(item.fat_g > 0 ? String(item.fat_g) : '')
    setShowResults(false)
  }

  // ── Favourites ─────────────────────────────────────────────────────────────
  async function toggleFavourite(name: string, cal: number, pro: number, carb: number, fat: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = favourites.find(f => f.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      const { error } = await supabase.from('food_favourites').delete().eq('id', existing.id)
      if (!error) {
        mutate()
        toast.success("Removed from favourites")
      }
    } else {
      const { data, error } = await supabase.from('food_favourites').insert([{
        user_id: user.id, name, calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat
      }]).select().single()
      
      if (!error && data) {
        mutate()
        toast.success("Saved to favourites")
      } else {
        toast.error("Failed to save favourite")
      }
    }
  }

  // ── Add food ───────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!foodName.trim()) { toast.error('Please enter a food name'); return }
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('food_logs').insert([{
      user_id:   user.id,
      log_date:  new Date().toISOString().split('T')[0],
      name: foodName.trim(),
      calories:  parseInt(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g:   parseFloat(carbs) || 0,
      fat_g:     parseFloat(fat) || 0,
    }])

    if (error) {
      toast.error('Failed to log food')
    } else {
      toast.success(`${foodName} logged!`)
      setShowAdd(false)
      setFoodName(''); setSearchQuery(''); setCalories(''); setProtein(''); setCarbs(''); setFat('')
      mutate()
    }
    setIsSubmitting(false)
  }

  // ── Delete food ────────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string, cal: number) {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete entry')
    } else {
      toast.success(`${name} removed`)
      mutate()
    }
  }

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
      const alreadyLogged = logs.some((l: FoodLog) => l.name === aiRecipe.mealName + ' (AI Generated)')
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
        log_date: new Date().toISOString().split('T')[0] // Important: explicitly set date
      }

      const { error } = await supabase.from('food_logs').insert([newLog])
      if (!error) {
        toast.success('AI Meal Logged successfully!')
        setAiRecipe(null)
        setViewMode('log')
        mutate()
      } else {
        toast.error('Failed to log meal: ' + error.message)
      }
    } catch (e: any) {
      toast.error('An error occurred')
    }
    setIsLoggingAI(false)
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  const totals = logs.reduce((acc, l) => ({
    cal:  acc.cal  + l.calories,
    pro:  acc.pro  + l.protein_g,
    carb: acc.carb + l.carbs_g,
    fat:  acc.fat  + l.fat_g,
  }), { cal: 0, pro: 0, carb: 0, fat: 0 })

  const filteredLogs = activeTab === 'All' ? logs : logs.filter(l => (l.meal_type || 'Snack') === activeTab)

  const groupedLogs = MEAL_TYPES.map(m => ({
    ...m,
    logs: filteredLogs.filter(l => (l.meal_type || 'Snack') === m.value),
  })).filter(g => g.logs.length > 0)

  const macros = [
    { label: 'Calories', current: totals.cal,  max: goals.goal_calories,  unit: 'kcal', color: 'bg-orange-500', text: 'text-orange-400' },
    { label: 'Protein',  current: totals.pro,  max: goals.goal_protein_g, unit: 'g',    color: 'bg-gold',       text: 'text-gold'      },
    { label: 'Carbs',    current: totals.carb, max: goals.goal_carbs_g,   unit: 'g',    color: 'bg-blue-500',   text: 'text-blue-400'  },
    { label: 'Fat',      current: totals.fat,  max: goals.goal_fat_g,     unit: 'g',    color: 'bg-purple-500', text: 'text-purple-400'},
  ]

  const weekAvg = weekData.filter(d => d.total_cal > 0).length > 0
    ? Math.round(weekData.reduce((a, d) => a + d.total_cal, 0) / weekData.filter(d => d.total_cal > 0).length)
    : 0

  return (
    <div className="relative min-h-screen">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight">Nutrition</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {goals.goal_calories.toLocaleString()} kcal goal · {goals.goal_protein_g}g protein · {goals.goal_carbs_g}g carbs
            </p>
          </div>
          <button
            onClick={() => { haptic.light(); setShowAdd(!showAdd); }}
            className="w-12 h-12 rounded-full bg-gold text-gold-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all transform-gpu glow-gold"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${showAdd ? 'rotate-45' : ''}`} />
          </button>
        </motion.div>

        {/* View Toggle */}
        <div className="flex bg-black/20 p-1 rounded-2xl w-full max-w-sm mx-auto">
          <button 
            onClick={() => setViewMode('log')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${viewMode === 'log' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground'}`}
          >
            Food Log
          </button>
          <button 
            onClick={() => setViewMode('ai')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${viewMode === 'ai' ? 'bg-gold/20 text-gold shadow-sm glow-gold' : 'text-muted-foreground'}`}
          >
            AI Meal Plan
          </button>
        </div>

        {viewMode === 'ai' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-8 rounded-[2rem] text-center">
              <h2 className="text-2xl font-bold mb-2">AI Dietician</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Need meal inspiration? Based on your remaining macros today, your dietary lifestyles, and allergies, the AI will construct a perfect recipe for you.
              </p>
              <button 
                onClick={() => { haptic.medium(); generateAIRecipe(); }}
                disabled={generatingRecipe}
                className="px-8 py-4 bg-gold text-gold-foreground rounded-2xl font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto glow-gold disabled:opacity-50 disabled:scale-100 active:scale-95 transform-gpu"
              >
                {generatingRecipe ? <Loader2 className="w-6 h-6 animate-spin" /> : <Flame className="w-6 h-6" />}
                {generatingRecipe ? 'Crafting Recipe...' : 'Generate Meal'}
              </button>
            </div>

            {aiRecipe && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 rounded-[2rem]">
                <div className="relative w-full h-56 mb-6 rounded-2xl overflow-hidden group bg-black/40 border border-white/5 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-blue-500/20 opacity-80 z-10 mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-black/40 z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80" 
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
                  <button 
                    onClick={() => { haptic.success(); logAIRecipe(); }}
                    disabled={isLoggingAI}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transform-gpu"
                  >
                    {isLoggingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} 
                    {isLoggingAI ? 'Logging...' : 'Log This Meal'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {viewMode === 'log' && (
          <>
          {/* ── Add Food Form ── */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="transform-gpu origin-top"
            >
              <div className="glass-card p-6 md:p-8 rounded-[2rem] space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-gold" /> Log Food
                  </h3>
                  <button type="button" onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Quick Add Favourites */}
                {favourites.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <Star className="w-3 h-3 text-gold" /> Quick Add Favourites
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                      {favourites.map(f => (
                        <button
                          key={f.id}
                          onClick={() => {
                            selectFood({ food_name: f.name, calories: f.calories, protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g })
                          }}
                          className="shrink-0 snap-start bg-black/20 border border-gold/20 hover:bg-gold/10 px-4 py-2 rounded-xl text-sm transition-colors text-left"
                        >
                          <p className="font-semibold text-white">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.calories} kcal</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleAdd} className="space-y-6">
                  {/* Meal type */}
                  <div className="grid grid-cols-4 gap-2">
                    {MEAL_TYPES.map(({ value, icon: Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMealType(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          mealType === value
                            ? 'bg-gold/10 border-gold/40 text-gold'
                            : 'border-white/5 hover:bg-white/5 text-muted-foreground'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${mealType === value ? 'text-gold' : color}`} />
                        <span className="text-xs font-semibold">{value}</span>
                      </button>
                    ))}
                  </div>

                  {/* Food search & Scanner */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Search or Scan</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold animate-spin" />}
                        <input
                          value={searchQuery}
                          onChange={e => handleSearch(e.target.value)}
                          onBlur={() => setTimeout(() => setShowResults(false), 200)}
                          onFocus={() => searchResults.length > 0 && setShowResults(true)}
                          placeholder="Search food or type manually…"
                          className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-12 py-3 focus:ring-1 focus:ring-gold outline-none transition-all"
                          autoComplete="off"
                        />
                        <AnimatePresence>
                          {showResults && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="absolute top-full mt-2 left-0 right-0 z-50 glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                            >
                              {searchResults.map((item, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onMouseDown={() => selectFood(item)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gold/10 transition-colors text-left border-b border-white/5 last:border-0"
                                >
                                  <div className="min-w-0 mr-4">
                                    <p className="text-sm font-medium text-foreground truncate">{item.food_name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">per 100g</p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
                                    <span className="text-orange-400">{item.calories} kcal</span>
                                    <span className="text-gold">{item.protein_g}P</span>
                                    <span className="text-blue-400">{item.carbs_g}C</span>
                                  </div>
                                </button>
                              ))}
                              <div className="px-4 py-2 border-t border-white/5">
                                <p className="text-[10px] text-muted-foreground/40">Powered by Open Food Facts · macros per 100g</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowScanner(!showScanner)}
                        className={`px-4 py-3 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
                          showScanner ? 'bg-gold/20 border-gold/40 text-gold' : 'bg-black/20 border-white/5 hover:bg-white/5 text-muted-foreground'
                        }`}
                      >
                        <ScanLine className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzingImage}
                        className={`px-4 py-3 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
                          isAnalyzingImage ? 'bg-gold/20 border-gold/40 text-gold animate-pulse' : 'bg-black/20 border-white/5 hover:bg-white/5 text-muted-foreground'
                        }`}
                      >
                        {isAnalyzingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      </button>
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </div>

                    {showScanner && (
                      <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 flex flex-col items-center">
                        <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden border border-white/5 mb-4"></div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          {isScanning ? <Loader2 className="w-3 h-3 animate-spin text-gold" /> : <ScanLine className="w-3 h-3" />}
                          {isScanning ? "Fetching Open Food Facts..." : "Position a barcode in the view"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Macro inputs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Calories', val: calories, set: setCalories, unit: 'kcal', ring: 'focus:ring-orange-500/40' },
                      { label: 'Protein',  val: protein,  set: setProtein,  unit: 'g',    ring: 'focus:ring-gold/40' },
                      { label: 'Carbs',    val: carbs,    set: setCarbs,    unit: 'g',    ring: 'focus:ring-blue-500/40' },
                      { label: 'Fat',      val: fat,      set: setFat,      unit: 'g',    ring: 'focus:ring-purple-500/40' },
                    ].map((f, i) => (
                      <div key={i} className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{f.label}</label>
                        <div className="relative">
                          <input
                            type="number" min="0" step="0.1"
                            value={f.val} onChange={e => f.set(e.target.value)} placeholder="0"
                            className={`w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:ring-1 ${f.ring} outline-none pr-10`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/40">{f.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-4">
                    <button
                      type="button"
                      disabled={!foodName.trim()}
                      onClick={() => toggleFavourite(foodName, Number(calories)||0, Number(protein)||0, Number(carbs)||0, Number(fat)||0)}
                      className={`text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        favourites.some(f => f.name.toLowerCase() === foodName.trim().toLowerCase()) 
                        ? 'text-gold bg-gold/10' : 'text-muted-foreground hover:bg-white/5'
                      } disabled:opacity-30`}
                    >
                      <Star className={`w-4 h-4 ${favourites.some(f => f.name.toLowerCase() === foodName.trim().toLowerCase()) ? 'fill-gold' : ''}`} /> 
                      {favourites.some(f => f.name.toLowerCase() === foodName.trim().toLowerCase()) ? 'Favourited' : 'Add to Favourites'}
                    </button>
                    
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors text-sm font-medium">
                        Cancel
                      </button>
                      <button
                        type="submit" disabled={isSubmitting || !foodName.trim()}
                        className="px-8 py-3 bg-gold text-gold-foreground rounded-xl font-semibold hover:bg-gold/90 transition-all flex items-center gap-2 glow-gold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Macro summary cards ── */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          {macros.map((m, i) => {
            const pct = Math.min(100, Math.round((m.current / m.max) * 100))
            const over = m.current > m.max
            return (
              <div key={i} className="glass-card p-5 rounded-[1.5rem] space-y-3 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</span>
                  {over && <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">Over!</span>}
                </div>
                <p className={`text-2xl font-heading font-bold ${over ? 'text-red-400' : m.text}`}>
                  {m.current.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">/ {m.max.toLocaleString()} {m.unit}</p>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                    className={`h-full rounded-full ${over ? 'bg-red-400' : m.color}`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{pct}% of goal</p>
              </div>
            )
          })}
        </motion.div>

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Food log list */}
          <motion.div className="lg:col-span-3 space-y-4" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

            {/* Meal tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['All', ...MEAL_TYPES.map(m => m.value)] as (MealType | 'All')[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gold text-gold-foreground glow-gold scale-105'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {tab}
                  {tab !== 'All' && logs.filter(l => l.meal_type === tab).length > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      {logs.filter(l => l.meal_type === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="glass-card p-12 rounded-[2rem] text-center flex flex-col items-center justify-center gap-3">
                <Utensils className="w-12 h-12 text-muted-foreground/20" />
                <p className="text-muted-foreground text-sm">
                  {activeTab === 'All' ? 'No meals logged today.' : `No ${activeTab} logged yet.`}
                </p>
                <button onClick={() => setShowAdd(true)} className="text-gold text-sm font-semibold hover:underline">
                  + Log a meal
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {groupedLogs.map(group => (
                  <div key={group.value} className="space-y-2">
                    {activeTab === 'All' && (
                      <div className="flex items-center gap-2 px-1">
                        <group.icon className={`w-4 h-4 ${group.color}`} />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{group.value}</span>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-xs text-muted-foreground">
                          {group.logs.reduce((a, l) => a + l.calories, 0).toLocaleString()} kcal
                        </span>
                      </div>
                    )}
                    {group.logs.map(log => (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="glass-card p-4 rounded-[1.5rem] flex items-center justify-between gap-3 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <Flame className="w-4 h-4 text-gold" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{log.name || log.food_name}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{log.meal_type || 'Snack'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-orange-400">{log.calories}</span>
                            <span className="text-muted-foreground/20">|</span>
                            <span className="text-gold">{log.protein_g}P</span>
                            <span className="text-muted-foreground/20">|</span>
                            <span className="text-blue-400">{log.carbs_g}C</span>
                            <span className="text-muted-foreground/20">|</span>
                            <span className="text-purple-400">{log.fat_g}F</span>
                          </div>
                          <span className="sm:hidden text-sm font-bold text-orange-400">{log.calories}</span>
                          <button
                            onClick={() => handleDelete(log.id, log.name || log.food_name, log.calories)}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>

          {/* Weekly Macro chart */}
          <motion.div
            className="lg:col-span-2 glass-card p-6 rounded-[2rem] flex flex-col"
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-heading font-bold">Weekly Macros</h2>
              </div>
            </div>

            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                  <Tooltip
                    cursor={{ fill: 'rgba(212,175,106,0.1)' }}
                    contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', border: '1px solid rgba(212,175,106,0.2)', borderRadius: '1rem', color: '#fff', fontSize: 12 }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  {/* Stacked Bars representing calories from each macro */}
                  <Bar dataKey="protein_cal" name="Protein (kcal)" stackId="a" fill="#D4AF6A" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="carbs_cal" name="Carbs (kcal)" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="fat_cal" name="Fat (kcal)" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 space-y-2.5">
              {[
                { label: '7-day average', value: `${weekAvg.toLocaleString()} kcal`, color: 'text-foreground' },
                { label: 'Daily goal',    value: `${goals.goal_calories.toLocaleString()} kcal`, color: 'text-gold' },
                { label: 'Today',         value: `${totals.cal.toLocaleString()} kcal`, color: totals.cal > goals.goal_calories ? 'text-red-400' : 'text-green-400' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
