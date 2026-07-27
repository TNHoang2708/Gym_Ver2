'use client'

import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Trash2, Edit2, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Exercise {
  id: string
  name: string
  category: string
  equipment: string
  difficulty: string
  instructions: string[]
  target_muscles: string[]
  video_url: string | null
}

const CATEGORIES = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio', 'Full Body']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export default function ExerciseCMS() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState<Partial<Exercise>>({
    name: '', category: 'Chest', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: [], target_muscles: [], video_url: ''
  })
  const [instructionInput, setInstructionInput] = useState('')
  const [muscleInput, setMuscleInput] = useState('')

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/exercises')
      if (res.ok) {
        const data = await res.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(ex: Exercise) {
    setFormData(ex)
    setEditingId(ex.id)
    setShowForm(true)
  }

  function handleAddNew() {
    setFormData({ name: '', category: 'Chest', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: [], target_muscles: [], video_url: '' })
    setEditingId(null)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this exercise?')) return
    
    try {
      const res = await fetch(`/api/admin/exercises?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Exercise deleted')
      setExercises(prev => prev.filter(e => e.id !== id))
    } catch (e) {
      toast.error('Failed to delete exercise')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const payload = editingId ? { ...formData, id: editingId } : formData
      
      const res = await fetch('/api/admin/exercises', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Submit failed')
      
      toast.success(editingId ? 'Exercise updated' : 'Exercise created')
      setShowForm(false)
      loadExercises()
    } catch (e) {
      toast.error('Failed to save exercise')
    }
  }

  const filteredExercises = exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-red-500" /> Exercise Library CMS
        </h1>
        
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </button>
      </div>

      <div className="relative w-full max-w-md mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      {loading && !showForm ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : showForm ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Exercise' : 'New Exercise'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Exercise Name</label>
                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Equipment</label>
                <input required value={formData.equipment || ''} onChange={e => setFormData({...formData, equipment: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Difficulty</label>
                <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  {DIFFICULTIES.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Video URL (Optional)</label>
                <input value={formData.video_url || ''} onChange={e => setFormData({...formData, video_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" placeholder="https://youtube.com/..." />
              </div>
              
              {/* Instructions Array */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Instructions (Steps)</label>
                <div className="flex gap-2 mb-2">
                  <input value={instructionInput} onChange={e => setInstructionInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (instructionInput.trim()) {
                        setFormData({ ...formData, instructions: [...(formData.instructions || []), instructionInput.trim()] })
                        setInstructionInput('')
                      }
                    }
                  }} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2" placeholder="Press Enter to add step" />
                </div>
                <ul className="list-decimal pl-5 space-y-1">
                  {(formData.instructions || []).map((inst, i) => (
                    <li key={i} className="text-sm text-foreground flex items-center justify-between group">
                      <span>{inst}</span>
                      <button type="button" onClick={() => setFormData({ ...formData, instructions: formData.instructions?.filter((_, idx) => idx !== i) })} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target Muscles Array */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Target Muscles</label>
                <div className="flex gap-2 mb-2">
                  <input value={muscleInput} onChange={e => setMuscleInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (muscleInput.trim()) {
                        setFormData({ ...formData, target_muscles: [...(formData.target_muscles || []), muscleInput.trim().toLowerCase()] })
                        setMuscleInput('')
                      }
                    }
                  }} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2" placeholder="e.g. chest (Press Enter)" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.target_muscles || []).map((m, i) => (
                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs flex items-center gap-2">
                      {m}
                      <button type="button" onClick={() => setFormData({ ...formData, target_muscles: formData.target_muscles?.filter((_, idx) => idx !== i) })} className="text-red-500"><XCircle className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Save Exercise</button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredExercises.map(ex => (
              <motion.div key={ex.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-black/40 border border-white/5 hover:border-white/20 transition-all p-6 rounded-2xl group relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(ex)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(ex.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h3 className="font-bold text-lg mb-1 pr-16">{ex.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{ex.category} • {ex.equipment}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${ex.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ex.difficulty === 'Intermediate' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {ex.difficulty}
                  </span>
                  {ex.target_muscles.slice(0, 2).map(m => (
                    <span key={m} className="text-[10px] uppercase font-bold px-2 py-1 rounded border bg-white/5 text-muted-foreground border-white/10">{m}</span>
                  ))}
                  {ex.target_muscles.length > 2 && <span className="text-[10px] uppercase font-bold px-2 py-1 rounded border bg-white/5 text-muted-foreground border-white/10">+{ex.target_muscles.length - 2}</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
// Placeholder component to avoid XCircle error
function XCircle({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  )
}
