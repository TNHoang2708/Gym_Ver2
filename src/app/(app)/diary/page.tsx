'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, TrendingUp, Dumbbell, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useWorkoutHistory } from '@/lib/hooks/use-data'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DiaryPage() {
  const { data: logs, isLoading } = useWorkoutHistory()
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  const validLogs = logs || []
  
  // Aggregate data for the chart (Last 30 days of volume)
  // Sort logs by date ascending for the chart
  const chartData = [...validLogs]
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
    .map(log => {
      const volume = (log.workout_session_logs || []).reduce((sum: number, s: any) => sum + ((s.weight_kg || 0) * (s.reps_achieved || 0)), 0)
      return {
        date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: volume
      }
    })

  const totalWorkouts = validLogs.length
  const totalVolume = validLogs.reduce((acc, log) => {
    const volume = (log.workout_session_logs || []).reduce((sum: number, s: any) => sum + ((s.weight_kg || 0) * (s.reps_achieved || 0)), 0)
    return acc + volume
  }, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-4xl font-heading font-bold text-gradient-gold mb-2">Training Diary</h1>
        <p className="text-muted-foreground">Your legacy, measured in sweat and iron.</p>
      </motion.div>

      {validLogs.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center border border-white/5 shadow-2xl">
          <CalendarDays className="w-16 h-16 text-gold/30 mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">No Workouts Yet</h2>
          <p className="text-muted-foreground">Start training to see your history and progress charts here.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-[2rem] text-center border-gold/20 shadow-xl">
              <Dumbbell className="w-6 h-6 text-gold mx-auto mb-3" />
              <p className="text-4xl font-heading font-bold text-foreground">{totalWorkouts}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">Workouts</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-[2rem] text-center border-gold/20 shadow-xl">
              <TrendingUp className="w-6 h-6 text-gold mx-auto mb-3" />
              <p className="text-4xl font-heading font-bold text-foreground">{totalVolume.toLocaleString()} <span className="text-sm">kg</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">Total Volume</p>
            </motion.div>
          </div>

          {/* Progress Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-[2rem] mb-10 border border-white/5 shadow-2xl overflow-hidden">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" /> Volume Progression
            </h3>
            <div className="h-[250px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8CE0FF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8CE0FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(20,20,25,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(140, 224, 255, 0.2)', borderRadius: '1rem', padding: '12px' }}
                    itemStyle={{ color: '#8CE0FF', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} kg`, 'Volume']}
                    labelStyle={{ color: '#888', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#8CE0FF" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Workout Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gold" /> Workout Timeline
            </h3>
            
            {validLogs.map((log: any, index: number) => {
              const isExpanded = expandedLogId === log.id;
              const dateObj = new Date(log.log_date)
              const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const sessionLogs = log.workout_session_logs || []
              
              // Group session logs by exercise
              const exercises: Record<string, any[]> = {}
              sessionLogs.forEach((s: any) => {
                if (!exercises[s.exercise_name]) exercises[s.exercise_name] = []
                exercises[s.exercise_name].push(s)
              })

              const logVolume = sessionLogs.reduce((sum: number, s: any) => sum + ((s.weight_kg || 0) * (s.reps_achieved || 0)), 0)

              return (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-card rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-300 hover:border-gold/30 shadow-xl relative"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-gold to-yellow-300" />
                  
                  <div 
                    className="p-6 flex items-center justify-between cursor-pointer select-none pl-8"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div>
                      <h4 className="font-heading font-bold text-xl mb-1 text-foreground">{formattedDate}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-gold/80" /> {logVolume.toLocaleString()} kg</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-gold/10' : 'bg-white/5'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gold" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/40 border-t border-white/5"
                      >
                        <div className="p-6 pl-8 space-y-6">
                          {Object.keys(exercises).length === 0 ? (
                            <p className="text-muted-foreground text-sm italic">No detailed sets logged.</p>
                          ) : (
                            Object.entries(exercises).map(([exName, sets]) => (
                              <div key={exName}>
                                <h5 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gold rounded-full" />
                                  {exName}
                                </h5>
                                <div className="space-y-2">
                                  {sets.map((set: any, i: number) => (
                                    <div key={set.id} className="flex items-center justify-between text-sm bg-white/5 rounded-xl px-4 py-2 border border-white/5">
                                      <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Set {set.set_number || i + 1}</span>
                                      <span className="font-bold text-foreground">{set.weight_kg} kg <span className="text-muted-foreground font-normal mx-2">×</span> {set.reps_achieved} reps</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                          
                          {log.notes && (
                            <div className="mt-4 p-4 rounded-2xl bg-gold/5 border border-gold/10 flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                              <p className="text-sm italic text-gold/90 leading-relaxed">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
