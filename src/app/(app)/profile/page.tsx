'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Save, LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { HardMemory, SoftMemory } from '@/types'
import { cn } from '@/lib/utils'

const GOAL_OPTIONS = [
  { value: 'muscle_gain', label: 'Build Muscle' },
  { value: 'fat_loss', label: 'Lose Fat' },
  { value: 'strength', label: 'Get Stronger' },
  { value: 'general_health', label: 'General Health' },
]
const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'novice', label: 'Novice' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]
const LOCATION_OPTIONS = [
  { value: 'gym', label: 'Gym' },
  { value: 'home', label: 'Home' },
  { value: 'both', label: 'Both' },
]
const FREQ_OPTIONS = ['3', '4', '5', '6'].map((v) => ({ value: v, label: `${v} days/week` }))
const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'flexible', label: 'Flexible' },
]
const COMMIT_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'serious', label: 'Serious' },
  { value: 'hardcore', label: 'Hardcore' },
]

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson/30 transition-all appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Hard memory fields
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')

  // Soft memory fields
  const [mainGoal, setMainGoal] = useState('muscle_gain')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [trainingLocation, setTrainingLocation] = useState('gym')
  const [desiredFrequency, setDesiredFrequency] = useState('4')
  const [preferredTime, setPreferredTime] = useState('flexible')
  const [commitmentLevel, setCommitmentLevel] = useState('serious')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')

      const { data: memory } = await supabase
        .from('user_memory')
        .select('hard_memory, soft_memory')
        .eq('user_id', user.id)
        .single()

      if (memory) {
        const hard = (memory.hard_memory ?? {}) as HardMemory
        const soft = (memory.soft_memory ?? {}) as SoftMemory
        setHeightCm(String(hard.height_cm ?? ''))
        setWeightKg(String(hard.weight_kg ?? ''))
        setMainGoal(soft.main_goal ?? 'muscle_gain')
        setExperienceLevel(soft.experience_level ?? 'beginner')
        setTrainingLocation(soft.training_location ?? 'gym')
        setDesiredFrequency(soft.desired_frequency ?? '4')
        setPreferredTime(soft.preferred_time ?? 'flexible')
        setCommitmentLevel(soft.commitment_level ?? 'serious')
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_memory')
      .update({
        hard_memory: {
          height_cm: parseFloat(heightCm) || undefined,
          weight_kg: parseFloat(weightKg) || undefined,
        },
        soft_memory: {
          main_goal: mainGoal,
          experience_level: experienceLevel,
          training_location: trainingLocation,
          desired_frequency: desiredFrequency,
          preferred_time: preferredTime,
          commitment_level: commitmentLevel,
        },
      })
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to save profile')
    } else {
      toast.success('Profile updated! Your AI Coach will use this next time.')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
          <User className="w-6 h-6 text-crimson" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Profile
          </h1>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      {/* Body stats */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Body Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Height</label>
            <div className="relative">
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                min="100"
                max="250"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 pr-10 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight</label>
            <div className="relative">
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="80"
                min="30"
                max="300"
                step="0.1"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-crimson/40 pr-10 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Training Preferences</h2>
        <SelectField label="Main Goal" value={mainGoal} options={GOAL_OPTIONS} onChange={setMainGoal} />
        <SelectField label="Experience Level" value={experienceLevel} options={EXPERIENCE_OPTIONS} onChange={setExperienceLevel} />
        <SelectField label="Training Location" value={trainingLocation} options={LOCATION_OPTIONS} onChange={setTrainingLocation} />
        <SelectField label="Weekly Frequency" value={desiredFrequency} options={FREQ_OPTIONS} onChange={setDesiredFrequency} />
        <SelectField label="Preferred Time" value={preferredTime} options={TIME_OPTIONS} onChange={setPreferredTime} />
        <SelectField label="Commitment Level" value={commitmentLevel} options={COMMIT_OPTIONS} onChange={setCommitmentLevel} />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all',
          saving ? 'bg-secondary text-muted-foreground' : 'bg-crimson hover:bg-crimson/90 text-white glow-crimson'
        )}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        ) : (
          <><Save className="w-4 h-4" /> Save Changes</>
        )}
      </button>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border/80 font-medium transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Changes are reflected in your AI Coach on the next conversation.
      </p>
    </div>
  )
}
