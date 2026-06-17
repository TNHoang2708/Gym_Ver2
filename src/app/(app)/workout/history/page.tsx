'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Calendar, ChevronDown, Dumbbell, Trophy, Loader2 } from 'lucide-react'
import { useWorkoutHistory } from '@/lib/hooks/use-data'
import Link from 'next/link'

function groupSessionLogsByExercise(logs: any[]) {
  if (!logs) return []
  const grouped: Record<string, any[]> = {}
  logs.forEach(log => {
    if (!grouped[log.exercise_name]) {
      grouped[log.exercise_name] = []
    }
    grouped[log.exercise_name].push(log)
  })
  
  // Convert to array and sort sets
  return Object.entries(grouped).map(([name, sets]) => {
    sets.sort((a, b) => a.set_number - b.set_number)
    return { name, sets }
  })
}

export default function WorkoutHistoryPage() {
  const { data: logs, isLoading } = useWorkoutHistory()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="relative min-h-screen px-4 pt-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-12 w-64 bg-white/10 rounded-xl" />
          <div className="h-40 w-full bg-white/5 rounded-3xl" />
          <div className="h-40 w-full bg-white/5 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen px-4 pt-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-black tracking-tight text-gradient-gold mb-2">Workout History</h1>
            <p className="text-muted-foreground">Look back at your journey and celebrate the gains.</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center glow-gold">
            <History className="w-8 h-8 text-gold" />
          </div>
        </div>

        {/* List */}
        {(!logs || logs.length === 0) ? (
          <div className="glass-card p-12 rounded-[2rem] text-center border-dashed border-2 border-white/10">
            <Trophy className="w-16 h-16 text-gold/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No completed workouts yet</h3>
            <p className="text-muted-foreground mb-6">Your history will appear here once you finish a workout.</p>
            <Link href="/dashboard" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {logs.map((log: any, index: number) => {
                const isExpanded = expandedId === log.id
                const groupedExercises = groupSessionLogsByExercise(log.workout_session_logs)
                const dateObj = new Date(log.log_date)
                
                return (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-3xl overflow-hidden border transition-colors ${isExpanded ? 'border-gold/30 bg-black/40' : 'border-white/5 hover:bg-white/5'}`}
                  >
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full p-6 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/5">
                          <span className="text-xs text-muted-foreground font-bold uppercase">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-black text-gold">{dateObj.getDate()}</span>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            {log.notes || 'Workout Session'}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5"/> {log.volume_kg || 0} kg</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-gold/20' : 'bg-white/5'}`}>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-gold' : 'text-muted-foreground'}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 pt-0 border-t border-white/5 bg-black/20">
                            {groupedExercises.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic py-4">No specific sets recorded for this session.</p>
                            ) : (
                              <div className="space-y-6 pt-6">
                                {groupedExercises.map((ex, i) => (
                                  <div key={i} className="space-y-3">
                                    <h4 className="font-bold text-foreground flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                      {ex.name}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3 border-l border-white/10 ml-[3px]">
                                      {ex.sets.map((set: any, j: number) => (
                                        <div key={j} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg text-sm">
                                          <span className="text-muted-foreground">Set {set.set_number}</span>
                                          <span className="font-medium">{set.reps_achieved} reps <span className="text-muted-foreground mx-1">@</span> {set.weight_kg} kg</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
