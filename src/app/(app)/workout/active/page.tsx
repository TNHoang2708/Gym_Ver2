'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Play, Dumbbell, ChevronRight, X, Loader2, Trophy, Share2, Info, AlertTriangle, History, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import AnatomyMap from '@/components/AnatomyMap'
import { useSound } from '@/hooks/useSound'
import { useRouter } from 'next/navigation'

interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: string;
  instructions: string[];
  target_muscles: string[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

const STORAGE_KEY = 'forge_active_workout_state'

export default function ActiveWorkoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [workoutDayName, setWorkoutDayName] = useState<string>('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  
  // Workout State
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [currentSetIdx, setCurrentSetIdx] = useState(0)
  
  // Set Logging
  const [currentWeight, setCurrentWeight] = useState('')
  const [currentReps, setCurrentReps] = useState('')
  const [sessionLogs, setSessionLogs] = useState<any[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  
  // Rest Timer State
  const [isResting, setIsResting] = useState(false)
  const [restDuration, setRestDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // End State
  const [workoutComplete, setWorkoutComplete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shareToCommunity, setShareToCommunity] = useState(true)
  
  // UI States
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [libraryEx, setLibraryEx] = useState<LibraryExercise | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapOptions, setSwapOptions] = useState<LibraryExercise[]>([])
  const [loadingSwap, setLoadingSwap] = useState(false)
  
  const { playSuccess } = useSound()

  useEffect(() => {
    loadWorkoutData()
  }, [])

  // Auto-save state to localStorage
  useEffect(() => {
    if (!loading && exercises.length > 0 && !workoutComplete) {
      const state = {
        workoutDayName,
        exercises,
        currentExerciseIdx,
        currentSetIdx,
        sessionLogs,
        startTime,
        isResting,
        timeLeft,
        restDuration,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [loading, workoutDayName, exercises, currentExerciseIdx, currentSetIdx, sessionLogs, startTime, isResting, timeLeft, restDuration, workoutComplete])

  async function loadWorkoutData() {
    const searchParams = new URLSearchParams(window.location.search)
    const urlDayIndexStr = searchParams.get('dayIndex')
    const urlDayIndex = urlDayIndexStr ? parseInt(urlDayIndexStr, 10) : null

    // 1. Check LocalStorage for an ongoing session
    if (!urlDayIndexStr) {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          // Only restore if the session is from today (within 12 hours)
          if (Date.now() - state.timestamp < 12 * 60 * 60 * 1000) {
            setWorkoutDayName(state.workoutDayName)
            setExercises(state.exercises)
            setCurrentExerciseIdx(state.currentExerciseIdx)
            setCurrentSetIdx(state.currentSetIdx)
            setSessionLogs(state.sessionLogs)
            setStartTime(state.startTime)
            
            if (state.isResting && state.timeLeft > 0) {
              // Calculate time passed while away
              const elapsedSinceSave = Math.floor((Date.now() - state.timestamp) / 1000)
              const remaining = state.timeLeft - elapsedSinceSave
              if (remaining > 0) {
                setTimeLeft(remaining)
                setRestDuration(state.restDuration)
                setIsResting(true)
              }
            }
            setLoading(false)
            return
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } else {
      // Force fresh start from AI Coach
      localStorage.removeItem(STORAGE_KEY)
    }

    // 2. Load schedule from DB
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: schedules } = await supabase
      .from('workout_schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (schedules && schedules.length > 0 && schedules[0].schedule && schedules[0].schedule.days) {
      let workoutDay;
      if (urlDayIndex !== null && urlDayIndex >= 0 && urlDayIndex < schedules[0].schedule.days.length) {
        workoutDay = schedules[0].schedule.days[urlDayIndex]
      } else {
        workoutDay = schedules[0].schedule.days.find((d: any) => d.exercises && d.exercises.length > 0)
      }
      
      if (workoutDay && workoutDay.exercises && workoutDay.exercises.length > 0) {
        setExercises(workoutDay.exercises)
        setWorkoutDayName(workoutDay.day)
        setStartTime(Date.now())
      }
    }
    setLoading(false)
  }

  // Timer logic
  useEffect(() => {
    if (isResting && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (isResting && timeLeft <= 0) {
      setIsResting(false)
      // Vibrate if supported
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      toast.success("Rest over! Back to work.")
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isResting, timeLeft])

  const getSmartRestTime = (exName: string) => {
    const heavyLifts = ['squat', 'deadlift', 'bench press', 'barbell row']
    const nameLower = (exName || '').toLowerCase()
    if (heavyLifts.some(l => nameLower.includes(l))) return 90
    if (nameLower.includes('leg press') || nameLower.includes('pull up')) return 75
    return 60
  }

  const startRest = (exName: string) => {
    const t = getSmartRestTime(exName)
    setRestDuration(t)
    setTimeLeft(t)
    setIsResting(true)
  }

  const skipRest = () => {
    setIsResting(false)
    setTimeLeft(0)
  }

  const adjustRest = (amount: number) => {
    setTimeLeft(prev => {
      const newTime = prev + amount
      return newTime > 0 ? newTime : 0
    })
    setRestDuration(prev => prev + amount > 0 ? prev + amount : 0)
  }

  const logSet = async () => {
    if (!currentWeight || !currentReps) {
      toast.error('Please enter both weight and reps')
      return
    }

    const currentEx = exercises[currentExerciseIdx]
    
    const newLog = {
      exercise_name: currentEx.name || 'Unknown Exercise',
      set_number: currentSetIdx + 1,
      weight_kg: parseFloat(currentWeight),
      reps_achieved: parseInt(currentReps)
    }
    
    const updatedLogs = [...sessionLogs, newLog]
    setSessionLogs(updatedLogs)
    playSuccess()
    
    if (currentSetIdx < (currentEx.sets || 1) - 1) {
      setCurrentSetIdx(prev => prev + 1)
      startRest(currentEx.name || '')
    } else {
      if (currentExerciseIdx < exercises.length - 1) {
        setCurrentExerciseIdx(prev => prev + 1)
        setCurrentSetIdx(0)
        startRest(exercises[currentExerciseIdx + 1]?.name || '')
      } else {
        // Complete Workout
        setIsResting(false)
        setWorkoutComplete(true)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    
    setCurrentWeight('')
    setCurrentReps('')
  }

  const handleCancelWorkout = () => {
    localStorage.removeItem(STORAGE_KEY)
    router.push('/dashboard')
  }

  const loadHistory = async (exerciseName: string) => {
    setLoadingHistory(true)
    setShowHistoryModal(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('workout_session_logs')
        .select('weight_kg, reps_achieved, created_at')
        .eq('user_id', user.id)
        .ilike('exercise_name', exerciseName)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setHistoryLogs(data || [])
    } catch (err) {
      toast.error('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadSwapOptions = async (exerciseName: string) => {
    setLoadingSwap(true)
    setShowSwapModal(true)
    try {
      const supabase = createClient()
      const { data: currentEx } = await supabase.from('exercises').select('*').eq('name', exerciseName).single()
      
      if (currentEx && currentEx.target_muscles && currentEx.target_muscles.length > 0) {
        const primaryMuscle = currentEx.target_muscles[0]
        const { data: alternatives } = await supabase
          .from('exercises')
          .select('*')
          .contains('target_muscles', [primaryMuscle])
          .neq('name', exerciseName)
          .limit(10)
          
        setSwapOptions(alternatives || [])
      } else {
        setSwapOptions([])
      }
    } catch (err) {
      toast.error('Failed to load alternatives')
    } finally {
      setLoadingSwap(false)
    }
  }

  const executeSwap = (newExName: string) => {
    const updatedExercises = [...exercises]
    updatedExercises[currentExerciseIdx] = {
      ...updatedExercises[currentExerciseIdx],
      name: newExName
    }
    setExercises(updatedExercises)
    setShowSwapModal(false)
    toast.success(`Swapped to ${newExName}`)
  }
  const saveAndFinishWorkout = async (shareToCommunity: boolean) => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      
      const durationMins = Math.max(1, Math.floor((Date.now() - startTime) / 60000))
      const totalVolume = sessionLogs.reduce((sum, log) => sum + (log.weight_kg * log.reps_achieved), 0)

      // 1. Create the parent workout log
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          notes: `Completed ${workoutDayName} routine`,
          trained: true
        })
        .select()
        .single()
        
      if (logError) throw logError
      const workoutLogId = logData.id

      // 2. Insert session logs
      const dbLogs = sessionLogs.map(l => ({
        ...l,
        user_id: user.id,
        workout_log_id: workoutLogId
      }))
      
      if (dbLogs.length > 0) {
        const { error: sessionError } = await supabase.from('workout_session_logs').insert(dbLogs)
        if (sessionError) throw sessionError
      }

      // 3. Optional: Share to community
      if (shareToCommunity) {
        try {
          const res = await fetch('/api/social/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionLogs, totalVolume })
          })
          
          if (res.ok) {
            const { summary } = await res.json()
            const { error: postError } = await supabase.from('posts').insert({
              user_id: user.id,
              workout_log_id: workoutLogId,
              ai_summary: summary,
              volume_lifted: totalVolume
            })
            if (postError) throw postError
            toast.success('Workout shared to community! 🎊')
          } else {
            toast.success('Workout Saved!')
          }
        } catch (socialErr) {
          console.error('Social share error:', socialErr)
          toast.success('Workout Saved! (Community share skipped)')
        }
      } else {
        toast.success('Workout Saved!')
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Save Workout Error:', err?.message || err)
      toast.error(`Failed to save workout: ${err?.message || 'Unknown error'}`)
      setIsSaving(false)
    }
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

    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-10 rounded-[3rem] text-center max-w-md w-full relative z-10 border-gold/20 shadow-2xl"
        >
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-gold animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-gradient-gold mb-2">Workout Complete!</h1>
          <p className="text-muted-foreground mb-8">You crushed it today.</p>
          
          <div className="bg-black/30 rounded-2xl p-6 mb-6 border border-white/5 shadow-inner">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Volume Moved</p>
            <p className="text-4xl font-bold text-foreground">{totalVolume} <span className="text-xl text-muted-foreground">kg</span></p>
            <p className="text-xs text-muted-foreground mt-2">{sessionLogs.length} sets completed</p>
          </div>
          
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 mb-8 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setShareToCommunity(!shareToCommunity)}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Share2 className="w-5 h-5 text-gold" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Share to Feed</p>
                <p className="text-xs text-muted-foreground">Let others fist bump your gains</p>
              </div>
            </div>
            <button 
              className={`w-12 h-6 rounded-full transition-colors relative ${shareToCommunity ? 'bg-gold' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 bg-black rounded-full absolute top-0.5 transition-transform ${shareToCommunity ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          
          <button 
            onClick={() => saveAndFinishWorkout(shareToCommunity)}
            disabled={isSaving}
            className="block w-full bg-gold text-gold-foreground py-4 rounded-xl font-bold glow-gold disabled:opacity-50 text-lg"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Save & Return Home'}
          </button>
        </motion.div>
      </div>
    )
  }

  const currentEx = exercises[currentExerciseIdx]

  if (!currentEx) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-heading font-bold mb-4">Workout Error</h1>
        <p className="text-muted-foreground mb-8">Failed to load the next exercise. Your session data might be corrupted.</p>
        <button onClick={handleCancelWorkout} className="bg-white/10 text-foreground px-8 py-4 rounded-xl font-bold">Reset Session</button>
      </div>
    )
  }

  const safeSets = currentEx.sets || 1
  const safeName = currentEx.name || 'Unknown Exercise'
  const safeReps = currentEx.reps || '10'

  const progressPercent = ((currentExerciseIdx + (currentSetIdx / safeSets)) / exercises.length) * 100

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 max-w-md mx-auto relative">
      <div className="absolute top-0 right-[-20%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] pointer-events-none z-0" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <button onClick={() => setShowCancelConfirm(true)} className="w-10 h-10 flex items-center justify-center glass-card rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-gold uppercase tracking-widest font-bold">{workoutDayName || 'Active Workout'}</p>
          <p className="font-heading font-bold">Exercise {currentExerciseIdx + 1} of {exercises.length}</p>
        </div>
        <div className="w-10 h-10" />
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-black/40 rounded-full mb-10 overflow-hidden relative z-10 shadow-inner border border-white/5">
        <motion.div 
          className="h-full bg-gradient-to-r from-gold to-yellow-300"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {isResting ? (
          <motion.div 
            key="rest"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-10 relative z-10"
          >
            <div className="w-56 h-56 rounded-full border-[6px] border-white/5 flex items-center justify-center relative mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle 
                  cx="112" cy="112" r="105" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  fill="none" 
                  className="text-gold" 
                  strokeLinecap="round"
                  strokeDasharray="660" 
                  strokeDashoffset={660 - (timeLeft / restDuration) * 660} 
                  style={{ transition: 'stroke-dashoffset 1s linear' }} 
                />
              </svg>
              <div className="text-center">
                <p className="text-7xl font-heading font-bold text-foreground tabular-nums">{timeLeft}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">Seconds</p>
              </div>
            </div>
            
            <div className="flex gap-4 mb-8">
              <button onClick={() => adjustRest(-15)} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10 active:scale-95 transition-all">-15s</button>
              <button onClick={() => adjustRest(15)} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10 active:scale-95 transition-all">+15s</button>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Rest & Recover</h3>
            <p className="text-muted-foreground mb-8">Up next: Set {currentSetIdx + 1} of {currentEx.name}</p>
            
            <button onClick={skipRest} className="w-full py-5 bg-white/10 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/20 active:scale-95 transition-all">
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
            <div className="glass-card p-6 md:p-8 rounded-[2.5rem] mb-6 shadow-2xl">
              <div className="inline-block px-4 py-1.5 bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                Set {currentSetIdx + 1} of {safeSets}
              </div>
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-heading font-bold leading-tight">{safeName}</h2>
                    <button 
                      onClick={() => loadSwapOptions(safeName)}
                      className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center hover:bg-gold hover:text-black transition-colors shrink-0"
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    setShowInfoModal(true)
                    setLoadingInfo(true)
                    const supabase = createClient()
                    const { data } = await supabase.from('exercises').select('*').eq('name', currentEx.name).single()
                    if (data) setLibraryEx(data as LibraryExercise)
                    setLoadingInfo(false)
                  }}
                  className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-gold transition-colors"
                >
                  <Info className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <p className="text-muted-foreground text-lg">Target: <span className="text-gold font-bold">{safeReps}</span> reps</p>
                <button 
                  onClick={() => loadHistory(safeName)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-lg hover:bg-gold/20 transition-colors"
                >
                  <History className="w-4 h-4" /> History
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/30 p-4 rounded-3xl border border-white/5 focus-within:border-gold/50 transition-colors">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-3 block text-center">Weight (kg)</label>
                  <input 
                    type="number"
                    inputMode="decimal"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent p-2 text-4xl font-bold text-center focus:outline-none placeholder:text-white/10"
                  />
                </div>
                <div className="bg-black/30 p-4 rounded-3xl border border-white/5 focus-within:border-gold/50 transition-colors">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-3 block text-center">Reps</label>
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent p-2 text-4xl font-bold text-center focus:outline-none placeholder:text-white/10"
                  />
                </div>
              </div>
              
              <button 
                onClick={logSet}
                className="w-full py-6 bg-gold text-gold-foreground rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all glow-gold shadow-2xl"
              >
                Log Set <CheckCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Up Next Preview */}
            {currentSetIdx === safeSets - 1 && currentExerciseIdx < exercises.length - 1 && (
              <div className="px-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-3 pl-2">Up Next</p>
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5 text-muted-foreground" />
                    <span className="font-bold">{exercises[currentExerciseIdx + 1]?.name || 'Next Exercise'}</span>
                  </div>
                  <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-lg">{exercises[currentExerciseIdx + 1]?.sets || 1} sets</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowCancelConfirm(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass-card rounded-[2rem] p-8 text-center border border-red-500/20 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Cancel Workout?</h3>
              <p className="text-muted-foreground mb-8">All progress from this session will be lost. This cannot be undone.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleCancelWorkout}
                  className="w-full py-4 bg-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  Yes, Cancel Workout
                </button>
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-4 bg-white/10 text-foreground font-bold rounded-xl hover:bg-white/20 transition-colors"
                >
                  Continue Workout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowInfoModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              {loadingInfo || !libraryEx ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
                  <p className="text-muted-foreground font-medium">Loading anatomy...</p>
                </div>
              ) : (
                <>
                  <div className="pr-12 mb-6">
                    <span className="inline-block px-3 py-1 bg-white/10 text-xs font-bold uppercase tracking-widest rounded-full mb-3">{libraryEx.category}</span>
                    <h2 className="text-3xl font-heading font-bold">{libraryEx.name}</h2>
                  </div>
                  
                  <div className="mb-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <AnatomyMap activeMuscles={libraryEx.target_muscles} />
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Instructions</h3>
                    <div className="space-y-4">
                      {libraryEx.instructions.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-6 h-6 shrink-0 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <p className="text-foreground/90 leading-relaxed text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowHistoryModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto glass-card rounded-[2rem] p-6 border border-gold/20 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-heading flex items-center gap-2"><History className="w-5 h-5 text-gold"/> Weight History</h3>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4"/></button>
              </div>

              {loadingHistory ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
              ) : historyLogs.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-2"/>
                  No previous logs found for this exercise.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log, i) => {
                    const d = new Date(log.created_at)
                    return (
                      <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                        <div>
                          <p className="text-gold font-bold text-lg">{log.weight_kg} kg</p>
                          <p className="text-xs text-muted-foreground">{log.reps_achieved} reps</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground">{d.toLocaleDateString()}</p>
                          <button onClick={() => { setCurrentWeight(log.weight_kg.toString()); setCurrentReps(log.reps_achieved.toString()); setShowHistoryModal(false); }} className="mt-1 text-xs text-gold underline opacity-70 hover:opacity-100">Copy</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Swap Modal */}
      <AnimatePresence>
        {showSwapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowSwapModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto glass-card rounded-[2rem] p-6 border border-gold/20 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-heading flex items-center gap-2"><Repeat className="w-5 h-5 text-gold"/> Swap Exercise</h3>
                <button onClick={() => setShowSwapModal(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4"/></button>
              </div>

              {loadingSwap ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
              ) : swapOptions.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  No alternatives found in database.
                </div>
              ) : (
                <div className="space-y-3">
                  {swapOptions.map((opt, i) => (
                    <div key={i} onClick={() => executeSwap(opt.name)} className="bg-black/40 p-4 rounded-xl border border-white/5 hover:border-gold/30 cursor-pointer transition-colors flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-sm group-hover:text-gold transition-colors">{opt.name}</p>
                        <p className="text-xs text-muted-foreground">{opt.equipment}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
