'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import AnatomyMap from '@/components/AnatomyMap'
import { Search, Loader2, Dumbbell, PlayCircle } from 'lucide-react'

// Adjust type as needed
type Exercise = {
  id: string
  name: string
  category: string
  equipment: string
  difficulty: string
  instructions: string[]
  target_muscles: string[]
  video_url: string | null
}

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio', 'Full Body']

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  
  const supabase = createClient()

  useEffect(() => {
    async function loadExercises() {
      // Assuming table public.exercises exists (after migration 008)
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')
      
      if (!error && data) {
        setExercises(data as Exercise[])
      } else {
        console.error('Error fetching exercises:', error)
      }
      setLoading(false)
    }
    loadExercises()
  }, [supabase])

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || 
                          ex.target_muscles.join(' ').toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'All' || ex.category === category
      return matchSearch && matchCat
    })
  }, [exercises, search, category])

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Exercise Library</h1>
          <p className="text-muted-foreground mt-1">Master your form with visual anatomy guides.</p>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-2 pb-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises or muscles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat 
                  ? 'bg-gold text-gold-foreground' 
                  : 'bg-secondary text-muted-foreground hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-white/5">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No exercises found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map(ex => (
            <div key={ex.id} className="glass-card rounded-2xl overflow-hidden flex flex-col border border-white/5 hover:border-gold/30 transition-colors">
              <div className="p-4 bg-black/20 flex-1 relative flex items-center justify-center min-h-[200px]">
                 <AnatomyMap activeMuscles={ex.target_muscles} className="scale-75 origin-center" />
              </div>
              <div className="p-5 border-t border-white/5 bg-secondary/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg leading-tight">{ex.name}</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center ${
                    ex.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                    ex.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {ex.difficulty}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    {ex.equipment}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Targets</p>
                  <p className="text-sm text-white">{ex.target_muscles.join(', ')}</p>
                </div>

                {ex.video_url && (
                  <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors text-white">
                    <PlayCircle className="w-4 h-4 text-gold" />
                    Watch Tutorial
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
