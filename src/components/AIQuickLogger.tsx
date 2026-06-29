'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, Camera, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'

export default function AIQuickLogger() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisionLoading, setIsVisionLoading] = useState(false)
  const [visionResult, setVisionResult] = useState<any>(null)
  
  const { mutate } = useSWRConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/quick-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse log')

      toast.success(data.message || 'Log saved successfully!', { icon: '🤖' })
      setText('')
      mutate('dashboardData')
      mutate('nutritionData')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsVisionLoading(true)
    try {
      // Convert to Base64 Data URL
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        const base64Image = reader.result as string
        
        // Call Vision API
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Vision API failed')

        if (data.foodName === "Not a food item" || data.calories === 0) {
          toast.error("Hmm, I don't see any food in this picture.")
          return
        }

        setVisionResult({ ...data, previewUrl: base64Image })
      }
      
      reader.onerror = () => {
        throw new Error("Failed to read image file")
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to process image')
    } finally {
      setIsVisionLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirmVision = async () => {
    if (!visionResult) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please login first")

      const today = new Date().toISOString().split('T')[0]
      
      const { error } = await supabase.from('food_logs').insert({
        user_id: user.id,
        log_date: today,
        food_name: visionResult.foodName,
        calories: visionResult.calories,
        protein_g: visionResult.protein_g,
        carbs_g: visionResult.carbs_g,
        fat_g: visionResult.fat_g,
        logged_at: new Date().toISOString()
      })

      if (error) throw error

      toast.success(`Logged ${visionResult.foodName} (${visionResult.calories} kcal)`, { icon: '🍔' })
      setVisionResult(null)
      mutate('dashboardData')
      mutate('nutritionData')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save food log')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmitText} className="relative w-full max-w-xl mx-auto group">
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-gold to-yellow-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        
        <div className="relative flex items-center bg-[#1A1E29]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl">
          <div className="pl-4 pr-2 flex items-center justify-center">
            {isLoading || isVisionLoading ? (
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-gold animate-pulse" />
            )}
          </div>
          
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading || isVisionLoading}
            placeholder="Log anything (e.g. 'Ate 2 eggs', 'Weigh 75kg')..."
            className="w-full bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/50 text-sm md:text-base py-3"
          />
          
          {/* Camera Upload Button */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          
          <button
            type="button"
            disabled={isLoading || isVisionLoading}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded-xl transition-colors disabled:opacity-50 shrink-0 mr-2"
            title="Scan Food with AI"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={isLoading || isVisionLoading || !text.trim()}
            className="p-3 bg-gold/20 hover:bg-gold/40 text-gold rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Vision Confirmation Popup */}
      <AnimatePresence>
        {visionResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 left-0 right-0 mt-4 mx-auto max-w-sm glass-card rounded-[2rem] p-4 border border-gold/30 glow-gold shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> AI Vision Results
              </h3>
              <button 
                onClick={() => setVisionResult(null)}
                className="p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-4 items-center mb-4 bg-black/40 p-3 rounded-2xl border border-white/5">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={visionResult.previewUrl} alt="Food Scan" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground line-clamp-2">{visionResult.foodName}</p>
                <p className="text-xl font-black text-gold mt-1">{visionResult.calories} kcal</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Protein</p>
                <p className="text-sm font-bold text-white">{visionResult.protein_g}g</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Carbs</p>
                <p className="text-sm font-bold text-white">{visionResult.carbs_g}g</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Fat</p>
                <p className="text-sm font-bold text-white">{visionResult.fat_g}g</p>
              </div>
            </div>

            <button
              onClick={handleConfirmVision}
              disabled={isLoading}
              className="w-full py-3 bg-gold hover:bg-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Food Log</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
