'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookHeart, Plus, Calendar, Smile, Dumbbell, Loader2, Save, Search, ImageIcon, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DiaryEntry {
  id: string
  entry_date: string
  content: string
  mood: string
  workout_completed: boolean
  photo_url?: string
}

const moods = [
  { icon: '🚀', label: 'Energetic', score: 5 },
  { icon: '😊', label: 'Good', score: 4 },
  { icon: '😐', label: 'Neutral', score: 3 },
  { icon: ' خسته ', label: 'Tired', score: 2 },
  { icon: '🤕', label: 'Sore', score: 1 }
]

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDate, setFilterDate] = useState('')
  
  // Form State
  const [content, setContent] = useState('')
  const [selectedMood, setSelectedMood] = useState('Good')
  const [workoutDone, setWorkoutDone] = useState(true)
  const [photoUrl, setPhotoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (data) setEntries(data)
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newEntry = {
      user_id: user.id,
      entry_date: new Date().toISOString().split('T')[0],
      content,
      mood: selectedMood,
      workout_completed: workoutDone,
      photo_url: photoUrl || null
    }

    // Insert diary entry
    const { error } = await supabase.from('diary_entries').insert([newEntry])

    if (error) {
      toast.error('Failed to save entry')
    } else {
      // Sync mood to user_memory
      const { data: memData } = await supabase.from('user_memory').select('emotional_memory').eq('user_id', user.id).single()
      if (memData) {
        const currentEmotional = memData.emotional_memory || {}
        const newEmotion = {
          mood: selectedMood.toLowerCase(),
          context: 'Logged via Training Diary',
          set_at: new Date().toISOString(),
          is_heavy: false
        }
        const history = currentEmotional.history || []
        const updatedEmotional = {
          current: newEmotion,
          history: [...history.slice(-10), newEmotion]
        }
        await supabase.from('user_memory').update({ emotional_memory: updatedEmotional }).eq('user_id', user.id)
      }

      toast.success('Journal entry saved')
      setShowAdd(false)
      setContent('')
      setSelectedMood('Good')
      setWorkoutDone(true)
      setPhotoUrl('')
      loadEntries()
    }
    setIsSubmitting(false)
  }

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDate = filterDate ? entry.entry_date === filterDate : true
      return matchesSearch && matchesDate
    })
  }, [entries, searchQuery, filterDate])

  // Chart Data (Last 14 days)
  const chartData = useMemo(() => {
    const data = []
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = entries.find(e => e.entry_date === dateStr)
      const score = entry ? moods.find(m => m.label === entry.mood)?.score || 3 : null
      
      data.push({
        name: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        score: score
      })
    }
    return data
  }, [entries])

  // Streak Calculation
  const currentStreak = useMemo(() => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let checkDate = new Date(today)
    
    const hasEntryToday = entries.some(e => e.entry_date === checkDate.toISOString().split('T')[0])
    if (!hasEntryToday) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const hasEntry = entries.some(e => e.entry_date === dateStr)
      if (hasEntry) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [entries])

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-8 pt-8">
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight">Training Diary</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Reflect on your progress and mental state.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 font-semibold border border-orange-500/20">
               <Flame className="w-4 h-4" />
               {currentStreak} Day Streak
            </div>
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="px-6 py-2 rounded-full bg-gold text-gold-foreground font-semibold flex items-center gap-2 hover:bg-gold/90 transition-all hover:scale-105 active:scale-95 glow-gold"
            >
              <Plus className={`w-5 h-5 transition-transform ${showAdd ? 'rotate-45' : ''}`} />
              {showAdd ? 'Cancel' : 'New Entry'}
            </button>
          </div>
        </motion.div>

        {/* Mood Chart */}
        {entries.length > 0 && (
           <motion.div className="glass-card p-6 rounded-[2rem]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Mood Trend (14 Days)</h3>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis domain={[1, 5]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff' }}
                      formatter={(value: any) => [moods.find(m => m.score === value)?.label || 'Unknown', 'Mood']}
                    />
                    <Line type="monotone" dataKey="score" stroke="#D4AF6A" strokeWidth={3} dot={{ fill: '#D4AF6A', r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </motion.div>
        )}

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="glass-card p-6 md:p-8 rounded-[2rem] space-y-8 mb-8">
              
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Smile className="w-4 h-4 text-gold" /> How are you feeling?
                </label>
                <div className="flex flex-wrap gap-3">
                  {moods.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setSelectedMood(m.label)}
                      className={`px-5 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                        selectedMood === m.label 
                          ? 'bg-gold/10 border-gold text-gold glow-gold' 
                          : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="font-medium text-sm">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${workoutDone ? 'bg-gold/20' : 'bg-white/10'}`}>
                    <Dumbbell className={`w-5 h-5 ${workoutDone ? 'text-gold' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Did you workout today?</p>
                    <p className="text-xs text-muted-foreground">Keep your streak alive</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={workoutDone} onChange={(e) => setWorkoutDone(e.target.checked)} className="sr-only peer" />
                  <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold transition-colors"></div>
                </label>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <BookHeart className="w-4 h-4 text-gold" /> Notes
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How was your training? How's your recovery?"
                  className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-gold min-h-[150px] resize-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gold" /> Photo Attachment (URL)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/20 border border-white/5 rounded-2xl p-3 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !content.trim()} 
                  className="px-8 py-3.5 bg-gold text-gold-foreground rounded-xl font-semibold hover:bg-gold/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 glow-gold"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Journal</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtering */}
      {entries.length > 0 && (
         <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
               <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <input 
                  type="text" 
                  placeholder="Search entries..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-gold transition-colors"
               />
            </div>
            <div className="relative">
               <input 
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-gold transition-colors"
               />
            </div>
         </div>
      )}

      <div className="space-y-6">
        {filteredEntries.length === 0 ? (
          <motion.div className="glass-card p-12 rounded-[2rem] text-center flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BookHeart className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-heading font-bold mb-2">{entries.length === 0 ? 'No Entries Yet' : 'No matching entries found'}</h3>
            <p className="text-muted-foreground">{entries.length === 0 ? 'Start journaling to track your mental and physical journey.' : 'Try adjusting your search or date filter.'}</p>
          </motion.div>
        ) : (
          filteredEntries.map((entry, index) => (
            <motion.div 
              key={entry.id} 
              className="glass-card p-6 md:p-8 rounded-[2rem] hover:border-white/10 transition-colors group relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold/50 to-transparent" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl border border-white/5">
                    {moods.find(m => m.label === entry.mood)?.icon || '📝'}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{entry.mood}</h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.entry_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                {entry.workout_completed && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20">
                    <Dumbbell className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Workout Done</span>
                  </div>
                )}
              </div>
              
              <div className="pl-4 prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed mb-4">
                <p>{entry.content}</p>
              </div>

              {entry.photo_url && (
                <div className="pl-4 mt-4">
                  <img src={entry.photo_url} alt="Diary attachment" className="rounded-xl w-full max-w-sm object-cover aspect-video border border-white/5" />
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
