'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Play, Dumbbell, ChevronRight, X, Loader2, Trophy, Share2, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import AnatomyMap from '@/components/AnatomyMap'

interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: string;
  instructions: string[];
  target_muscles: string[];
}

interface SetData {
  reps: string;
  weight: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

export default function ActiveWorkoutPage() {
  const [loading, setLoading] = useState(true)
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  
  // Workout State
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [currentSetIdx, setCurrentSetIdx] = useState(0)
  
  // Set Logging
  const [currentWeight, setCurrentWeight] = useState('')
  const [currentReps, setCurrentReps] = useState('')
  const [sessionLogs, setSessionLogs] = useState<any[]>([])
  
  // Rest Timer State
  const [isResting, setIsResting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60) // 60s default rest
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // End State
  const [workoutComplete, setWorkoutComplete] = useState(false)
  const [workoutVolume, setWorkoutVolume] = useState(0)
  
  // Info Modal State
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [libraryEx, setLibraryEx] = useState<LibraryExercise | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  useEffect(() => {
    loadTodayWorkout()
  }, [])

  async function loadTodayWorkout() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find an active schedule for today
    const { data: schedules } = await supabase
      .from('workout_schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (schedules && schedules.length > 0 && schedules[0].plan && schedules[0].plan.workouts) {
      // Find today's workout (simplified logic: pick the first one that is a workout day)
      const workoutDay = schedules[0].plan.workouts.find((w: any) => w.type !== 'Rest')
      if (workoutDay) {
        setExercises(workoutDay.exercises)
        // Create a new workout_log to attach these session logs to
        const { data: logData } = await supabase
          .from('workout_logs')
          .insert({
            user_id: user.id,
            duration_minutes: 0,
            volume_kg: 0,
            mood_score: 3,
            notes: `Started ${workoutDay.name} routine`
          })
          .select()
          .single()
        
        if (logData) setWorkoutLogId(logData.id)
      }
    }
    setLoading(false)
  }

  // Timer logic
  useEffect(() => {
    if (isResting && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (isResting && timeLeft === 0) {
      setIsResting(false)
      toast.success("Rest over! Back to work.")
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isResting, timeLeft])

  const startRest = () => {
    setTimeLeft(60)
    setIsResting(true)
  }

  const skipRest = () => {
    setIsResting(false)
    setTimeLeft(60)
  }

  const logSet = async () => {
    if (!currentWeight || !currentReps) {
      toast.error('Please enter both weight and reps')
      return
    }

    const currentEx = exercises[currentExerciseIdx]
    
    // Save to local state
    const newLog = {
      exercise_name: currentEx.name,
      set_number: currentSetIdx + 1,
      weight_kg: parseFloat(currentWeight),
      reps_achieved: parseInt(currentReps)
    }
    setSessionLogs(prev => [...prev, newLog])
    
    // Advance logic
    if (currentSetIdx < currentEx.sets - 1) {
      // Next set
      setCurrentSetIdx(prev => prev + 1)
      startRest()
    } else {
      // Next exercise
      if (currentExerciseIdx < exercises.length - 1) {
        setCurrentExerciseIdx(prev => prev + 1)
        setCurrentSetIdx(0)
        startRest()
      } else {
        // Workout Complete!
        finishWorkout([...sessionLogs, newLog])
      }
    }
    
    // Clear inputs
    setCurrentWeight('')
    setCurrentReps('')
  }

  const finishWorkout = async (finalLogs: any[]) => {
    setWorkoutComplete(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !workoutLogId) return
    
    // 1. Insert session logs
    const dbLogs = finalLogs.map(l => ({
      ...l,
      user_id: user.id,
      workout_log_id: workoutLogId
    }))
    
    await supabase.from('workout_session_logs').insert(dbLogs)
    
    // 2. Update parent workout log with total volume
    const totalVolume = finalLogs.reduce((sum, log) => sum + (log.weight_kg * log.reps_achieved), 0)
    
    await supabase.from('workout_logs')
      .update({ volume_kg: totalVolume, duration_minutes: 45, notes: 'Completed full routine' })
      .eq('id', workoutLogId)
      
    toast.success('Workout Saved!')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Dumbbell className="w-16 h-16 text-gold/30 mb-6" />
        <h1 className="text-3xl font-heading font-bold mb-4">No Active Workout</h1>
        <p className="text-muted-foreground mb-8">You don't have a workout scheduled for today.</p>
        <Link href="/dashboard" className="bg-gold text-gold-foreground px-8 py-4 rounded-xl font-bold">Go to Dashboard</Link>
      </div>
    )
  }

  if (workoutComplete) {
    const totalVolume = sessionLogs.reduce((sum, log) => sum + (log.weight_kg * log.reps_achieved), 0)
    
    const handleShare = () => {
      const text = `🔥 I just crushed a ${totalVolume}kg workout using Gym Planner AI! Join the leaderboard!`;
      if (navigator.share) {
        navigator.share({ title: 'Workout Complete', text });
      } else {
        navigator.clipboard.writeText(text);
        toast.success('Workout summary copied to clipboard!');
      }
    }

    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gold/5 blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-10 rounded-[3rem] text-center max-w-md w-full relative z-10 border-gold/20"
        >
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-gold animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-gradient-gold mb-2">Workout Complete!</h1>
          <p className="text-muted-foreground mb-8">You crushed it today.</p>
          
          <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-white/5">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Volume Moved</p>
            <p className="text-4xl font-bold text-foreground">{totalVolume} <span className="text-xl text-muted-foreground">kg</span></p>
          </div>
          
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full bg-white/5 text-foreground py-4 rounded-xl font-bold hover:bg-white/10 transition-colors mb-4"
          >
            <Share2 className="w-5 h-5" /> Share Milestone
          </button>
          
          <Link href="/dashboard" className="block w-full bg-gold text-gold-foreground py-4 rounded-xl font-bold glow-gold">
            Finish & Return Home
          </Link>
        </motion.div>
      </div>
    )
  }

  const currentEx = exercises[currentExerciseIdx]
  const progressPercent = ((currentExerciseIdx) / exercises.length) * 100

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 max-w-md mx-auto relative">
      <div className="absolute top-0 right-[-20%] w-[60vw] h-[60vw] bg-gold/10 blur-[120px] transform-gpu pointer-events-none z-0" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center glass-card rounded-full"><X className="w-5 h-5" /></Link>
        <div className="text-center">
          <p className="text-xs text-gold uppercase tracking-widest font-bold">Active Workout</p>
          <p className="font-heading font-bold">Exercise {currentExerciseIdx + 1} of {exercises.length}</p>
        </div>
        <div className="w-10 h-10" />
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-white/10 rounded-full mb-10 overflow-hidden relative z-10">
        <motion.div 
          className="h-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {isResting ? (
          <motion.div 
            key="rest"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-20 relative z-10"
          >
            <div className="w-48 h-48 rounded-full border-4 border-white/10 flex items-center justify-center relative mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="90" stroke="currentColor" strokeWidth="4" fill="none" className="text-gold" strokeDasharray="565" strokeDashoffset={565 - (timeLeft / 60) * 565} style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="text-center">
                <p className="text-6xl font-heading font-bold text-foreground">{timeLeft}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">Seconds</p>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Rest & Recover</h3>
            <p className="text-muted-foreground mb-8">Up next: Set {currentSetIdx + 1} of {currentEx.name}</p>
            
            <button onClick={skipRest} className="px-8 py-4 bg-white/5 rounded-full font-bold hover:bg-white/10 transition-colors">
              Skip Rest
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="exercise"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10"
          >
            <div className="glass-card p-8 rounded-[2.5rem] mb-6">
              <div className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest rounded-full mb-4">
                Set {currentSetIdx + 1} / {currentEx.sets}
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-heading font-bold">{currentEx.name}</h2>
                <button 
                  onClick={async () => {
                    setShowInfoModal(true)
                    setLoadingInfo(true)
                    const supabase = createClient()
                    const { data } = await supabase.from('exercises').select('*').eq('name', currentEx.name).single()
                    if (data) setLibraryEx(data as LibraryExercise)
                    setLoadingInfo(false)
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gold transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground mb-8">Target: {currentEx.reps} reps</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Weight (kg)</label>
                  <input 
                    type="number"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-2xl font-bold text-center focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Reps Completed</label>
                  <input 
                    type="number"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-2xl font-bold text-center focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>
              
              <button 
                onClick={logSet}
                className="w-full py-5 bg-gold text-gold-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gold/90 transition-colors glow-gold"
              >
                Log Set <CheckCircle className="w-5 h-5" />
              </button>
            </div>
            
            {/* Up Next Preview */}
            {currentSetIdx === currentEx.sets - 1 && currentExerciseIdx < exercises.length - 1 && (
              <div className="px-4">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-3">Up Next</p>
                <div className="glass-card p-4 rounded-xl flex items-center justify-between opacity-50">
                  <span className="font-bold">{exercises[currentExerciseIdx + 1].name}</span>
                  <span className="text-sm">{exercises[currentExerciseIdx + 1].sets} sets</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInfoModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md max-h-[80vh] overflow-y-auto glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl"
          >
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            {loadingInfo || !libraryEx ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
                <p className="text-muted-foreground text-sm">Loading anatomy...</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold pr-8 mb-4">{libraryEx.name}</h2>
                <div className="mb-6">
                  <AnatomyMap activeMuscles={libraryEx.target_muscles} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/80">
                    {libraryEx.instructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
