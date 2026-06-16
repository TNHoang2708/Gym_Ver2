'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Search, Loader2, Dumbbell, ChevronRight } from 'lucide-react'
import AnatomyMap from '@/components/AnatomyMap'

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: string;
  instructions: string[];
  target_muscles: string[];
  video_url: string | null;
}

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // Modal State
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    async function loadExercises() {
      const supabase = createClient()
      const { data, error } = await supabase.from('exercises').select('*').order('name')
      if (data && !error) {
        setExercises(data as Exercise[])
        setFilteredExercises(data as Exercise[])
      }
      setLoading(false)
    }
    loadExercises()
  }, [])

  useEffect(() => {
    let result = exercises
    if (activeCategory !== 'All') {
      result = result.filter(ex => ex.category === activeCategory)
    }
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(ex => ex.name.toLowerCase().includes(lowerSearch))
    }
    setFilteredExercises(result)
  }, [searchTerm, activeCategory, exercises])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
  }

  return (
    <div className="min-h-screen pb-24 pt-8 px-4 max-w-4xl mx-auto relative">
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-gold/5 blur-[120px] rounded-full transform-gpu pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Exercise <span className="text-gradient-gold">Library</span></h1>
        <p className="text-muted-foreground mt-2">Explore exercises and see targeted muscles.</p>
      </motion.div>

      {/* Search and Filters */}
      <div className="sticky top-4 z-20 bg-background/80 backdrop-blur-xl pb-4 border-b border-white/5 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold transition-shadow"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-gold text-gold-foreground glow-gold' 
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExercises.map((ex, i) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedExercise(ex)}
            className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gold/30 hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Dumbbell className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-foreground line-clamp-1">{ex.name}</h3>
                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                  <span>{ex.category}</span>
                  <span>•</span>
                  <span className={ex.difficulty === 'Beginner' ? 'text-green-400' : ex.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'}>
                    {ex.difficulty}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors" />
          </motion.div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No exercises found matching your search.
        </div>
      )}

      {/* Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedExercise(null)} />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl"
          >
            <button 
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-1 pr-10">{selectedExercise.name}</h2>
            <div className="flex gap-2 text-sm text-gold font-medium mb-6">
              <span>{selectedExercise.category}</span>
              <span>•</span>
              <span>{selectedExercise.equipment}</span>
            </div>

            <div className="mb-8">
              <AnatomyMap activeMuscles={selectedExercise.target_muscles} />
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 uppercase tracking-widest text-muted-foreground text-xs">Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/80">
                {selectedExercise.instructions.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
