'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import type { HardMemory, SoftMemory } from '@/types'
import { cn } from '@/lib/utils'

// =====================================================
// STEP DEFINITIONS (15 steps in exact spec order)
// =====================================================
interface Option {
  value: string
  label: string
  emoji?: string
}

interface Step {
  id: number
  field: string
  memoryLayer: 'hard' | 'soft'
  question: string
  subtitle?: string
  type: 'single' | 'multi' | 'number'
  options?: Option[]
  unit?: string
  min?: number
  max?: number
  placeholder?: string
}

const STEPS: Step[] = [
  {
    id: 1, field: 'gender', memoryLayer: 'hard', type: 'single',
    question: 'What\'s your gender?',
    subtitle: 'Helps calculate your nutrition targets accurately.',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Non-binary / Other' },
    ],
  },
  {
    id: 2, field: 'age_group', memoryLayer: 'hard', type: 'single',
    question: 'Which age group are you in?',
    options: [
      { value: '18-29', label: '18–29' },
      { value: '30-39', label: '30–39' },
      { value: '40-49', label: '40–49' },
      { value: '50+', label: '50+' },
    ],
  },
  {
    id: 3, field: 'height_cm', memoryLayer: 'hard', type: 'number',
    question: 'How tall are you?',
    unit: 'cm', min: 100, max: 250, placeholder: 'e.g. 175',
  },
  {
    id: 4, field: 'weight_kg', memoryLayer: 'hard', type: 'number',
    question: 'What\'s your current weight?',
    unit: 'kg', min: 30, max: 300, placeholder: 'e.g. 80',
  },
  {
    id: 5, field: 'body_type', memoryLayer: 'hard', type: 'single',
    question: 'How would you describe your current body type?',
    options: [
      { value: 'slim', label: 'Slim / Lean' },
      { value: 'average', label: 'Average build' },
      { value: 'overweight', label: 'Carrying extra weight' },
      { value: 'muscular', label: 'Already muscular' },
    ],
  },
  {
    id: 6, field: 'experience_level', memoryLayer: 'soft', type: 'single',
    question: 'How experienced are you with training?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'novice', label: 'Novice' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    id: 7, field: 'training_location', memoryLayer: 'soft', type: 'single',
    question: 'Where do you train?',
    options: [
      { value: 'gym', label: 'Gym' },
      { value: 'home', label: 'Home' },
      { value: 'both', label: 'Both' },
    ],
  },
  {
    id: 8, field: 'current_frequency', memoryLayer: 'soft', type: 'single',
    question: 'How many days a week do you currently train?',
    options: [
      { value: '0', label: 'Just starting out' },
      { value: '1-2', label: '1–2 days' },
      { value: '3-4', label: '3–4 days' },
      { value: '5+', label: '5+ days' },
    ],
  },
  {
    id: 9, field: 'injuries', memoryLayer: 'hard', type: 'multi',
    question: 'Any injuries or medical conditions?',
    subtitle: 'Your coach will NEVER recommend exercises that could hurt you.',
    options: [
      { value: 'none', label: 'None — all clear' },
      { value: 'back', label: 'Back issues' },
      { value: 'knee', label: 'Knee problems' },
      { value: 'shoulder', label: 'Shoulder problems' },
      { value: 'high_blood_pressure', label: 'High blood pressure' },
      { value: 'other', label: 'Other condition' },
    ],
  },
  {
    id: 10, field: 'main_goal', memoryLayer: 'soft', type: 'single',
    question: 'What\'s your main fitness goal?',
    options: [
      { value: 'muscle_gain', label: 'Build muscle' },
      { value: 'fat_loss', label: 'Lose fat' },
      { value: 'strength', label: 'Get stronger' },
      { value: 'general_health', label: 'General health' },
    ],
  },
  {
    id: 11, field: 'target_physique', memoryLayer: 'soft', type: 'single',
    question: 'What\'s your target physique?',
    options: [
      { value: 'lean_toned', label: 'Lean & toned' },
      { value: 'muscular', label: 'Muscular' },
      { value: 'athletic', label: 'Athletic' },
      { value: 'strong', label: 'Strong & powerful' },
    ],
  },
  {
    id: 12, field: 'desired_frequency', memoryLayer: 'soft', type: 'single',
    question: 'How many days per week do you want to train?',
    options: [
      { value: '3', label: '3 days' },
      { value: '4', label: '4 days' },
      { value: '5', label: '5 days' },
      { value: '6', label: '6 days' },
    ],
  },
  {
    id: 13, field: 'preferred_time', memoryLayer: 'soft', type: 'single',
    question: 'When do you prefer to train?',
    options: [
      { value: 'morning', label: 'Morning' },
      { value: 'afternoon', label: 'Afternoon' },
      { value: 'evening', label: 'Evening' },
      { value: 'flexible', label: 'Flexible' },
    ],
  },
  {
    id: 14, field: 'motivation', memoryLayer: 'soft', type: 'single',
    question: 'What motivates you most?',
    options: [
      { value: 'health', label: 'Long-term health' },
      { value: 'appearance', label: 'Looking better' },
      { value: 'confidence', label: 'Feeling confident' },
      { value: 'sport', label: 'Sport performance' },
    ],
  },
  {
    id: 15, field: 'commitment_level', memoryLayer: 'soft', type: 'single',
    question: 'How would you describe your commitment level?',
    options: [
      { value: 'casual', label: 'Casual' },
      { value: 'serious', label: 'Serious' },
      { value: 'hardcore', label: 'Hardcore' },
    ],
  },
]

// =====================================================
// ONBOARDING PAGE COMPONENT
// =====================================================
export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [numInput, setNumInput] = useState('')
  const [multiSelected, setMultiSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward

  const step = STEPS[currentStep]
  const progress = ((currentStep) / STEPS.length) * 100
  const isLast = currentStep === STEPS.length - 1

  // Get current step's answer value
  function getCurrentAnswer() {
    return answers[step.field]
  }

  function selectSingle(value: string) {
    setAnswers((prev) => ({ ...prev, [step.field]: value }))
  }

  function toggleMulti(value: string) {
    setMultiSelected((prev) => {
      if (value === 'none') return ['none']
      const withoutNone = prev.filter((v) => v !== 'none')
      if (prev.includes(value)) return withoutNone.filter((v) => v !== value)
      return [...withoutNone, value]
    })
  }

  function canProceed(): boolean {
    if (step.type === 'single') return !!getCurrentAnswer()
    if (step.type === 'multi') return multiSelected.length > 0
    if (step.type === 'number') {
      const n = parseFloat(numInput)
      return !isNaN(n) && n >= (step.min ?? 0) && n <= (step.max ?? 9999)
    }
    return false
  }

  function handleNext() {
    if (!canProceed()) return

    // Save current answer
    if (step.type === 'multi') {
      setAnswers((prev) => ({ ...prev, [step.field]: multiSelected }))
    } else if (step.type === 'number') {
      setAnswers((prev) => ({ ...prev, [step.field]: parseFloat(numInput) }))
    }

    if (isLast) {
      handleSubmit()
    } else {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
      setNumInput('')
      setMultiSelected([])
    }
  }

  function handleBack() {
    if (currentStep === 0) return
    setDirection(-1)
    setCurrentStep((prev) => prev - 1)
    // Restore previous inputs
    const prevStep = STEPS[currentStep - 1]
    if (prevStep.type === 'number') {
      setNumInput(String(answers[prevStep.field] ?? ''))
    }
    if (prevStep.type === 'multi') {
      setMultiSelected((answers[prevStep.field] as string[]) ?? [])
    }
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Separate answers into hard and soft memory
      const hardMemory: HardMemory = {}
      const softMemory: SoftMemory = {}

      // Build final answers including current step
      const finalAnswers = { ...answers }
      if (step.type === 'multi') finalAnswers[step.field] = multiSelected
      if (step.type === 'number') finalAnswers[step.field] = parseFloat(numInput)

      for (const s of STEPS) {
        const val = finalAnswers[s.field]
        if (val === undefined) continue
        if (s.memoryLayer === 'hard') {
          (hardMemory as Record<string, unknown>)[s.field] = val
        } else {
          (softMemory as Record<string, unknown>)[s.field] = val
        }
      }

      // Upsert user_memory
      const { error } = await supabase
        .from('user_memory')
        .upsert({
          user_id: user.id,
          hard_memory: hardMemory,
          soft_memory: softMemory,
          session_meta: { onboarding_completed: true },
        }, { onConflict: 'user_id' })

      if (error) throw error

      // Navigate to welcome screen with answers
      router.push('/onboarding/welcome')
    } catch (err) {
      toast.error('Failed to save your profile. Please try again.')
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-background flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[10%] left-[-20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col w-full">
        {/* Header / progress */}
        <div className="px-6 pt-8 pb-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-gold" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
          <div
            className="bg-gold h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}% complete</p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 max-w-lg mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div 
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="pt-4 pb-6"
          >
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {step.question}
            </h1>
          {step.subtitle && (
            <p className="text-sm text-muted-foreground mb-6">{step.subtitle}</p>
          )}

          {/* SINGLE SELECT */}
          {step.type === 'single' && step.options && (
            <div className="space-y-2.5 mt-6">
              {step.options.map((opt) => {
                const isSelected = getCurrentAnswer() === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => selectSingle(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all duration-150',
                      isSelected
                        ? 'bg-gold/10 border-gold/40 text-foreground'
                        : 'bg-secondary border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                    )}
                  >
                    {opt.emoji && <span className="text-xl w-8 text-center">{opt.emoji}</span>}
                    <span className="font-medium flex-1">{opt.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* MULTI SELECT */}
          {step.type === 'multi' && step.options && (
            <div className="space-y-2.5 mt-6">
              <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>
              {step.options.map((opt) => {
                const isSelected = multiSelected.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMulti(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all duration-150',
                      isSelected
                        ? 'bg-gold/10 border-gold/40 text-foreground'
                        : 'bg-secondary border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                    )}
                  >
                    {opt.emoji && <span className="text-xl w-8 text-center">{opt.emoji}</span>}
                    <span className="font-medium flex-1">{opt.label}</span>
                    <div className={cn(
                      'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                      isSelected ? 'bg-gold border-gold' : 'border-border'
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* NUMBER INPUT */}
          {step.type === 'number' && (
            <div className="mt-6">
              <div className="relative">
                <input
                  type="number"
                  value={numInput}
                  onChange={(e) => setNumInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                  min={step.min}
                  max={step.max}
                  placeholder={step.placeholder}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-4 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 pr-20 transition-all"
                  autoFocus
                />
                {step.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                    {step.unit}
                  </span>
                )}
              </div>
              {step.min !== undefined && step.max !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  Valid range: {step.min}–{step.max} {step.unit}
                </p>
              )}
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="px-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full bg-background/80 backdrop-blur-md">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-all font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200',
              canProceed() && !saving
                ? 'bg-gold hover:bg-gold/90 text-white glow-gold'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {saving ? (
              'Saving…'
            ) : isLast ? (
              <>Complete Setup <Check className="w-4 h-4" /></>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
