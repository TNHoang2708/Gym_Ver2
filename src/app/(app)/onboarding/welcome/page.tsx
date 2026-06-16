import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Dumbbell, Target, MapPin, Clock, Zap, Flame } from 'lucide-react'
import type { HardMemory, SoftMemory } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome — Your Coach is Ready',
}

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'Build Muscle', fat_loss: 'Lose Fat',
  strength: 'Get Stronger', general_health: 'General Health',
}
const PHYSIQUE_LABELS: Record<string, string> = {
  lean_toned: 'Lean & Toned', muscular: 'Muscular',
  athletic: 'Athletic', strong: 'Strong & Powerful',
}
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner', novice: 'Novice',
  intermediate: 'Intermediate', advanced: 'Advanced',
}
const LOCATION_LABELS: Record<string, string> = {
  gym: 'Gym', home: 'Home', both: 'Gym + Home',
}
const TIME_LABELS: Record<string, string> = {
  morning: 'Morning', afternoon: 'Afternoon',
  evening: 'Evening', flexible: 'Flexible',
}
const COMMIT_LABELS: Record<string, string> = {
  casual: 'Casual', serious: 'Serious', hardcore: 'Hardcore 💯',
}

export default async function OnboardingWelcomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memory } = await supabase
    .from('user_memory')
    .select('hard_memory, soft_memory')
    .eq('user_id', user.id)
    .single()

  if (!memory) redirect('/onboarding')

  const hard = (memory.hard_memory ?? {}) as HardMemory
  const soft = (memory.soft_memory ?? {}) as SoftMemory

  const summaryCards = [
    {
      icon: Target,
      label: 'Main Goal',
      value: GOAL_LABELS[soft.main_goal ?? ''] ?? soft.main_goal ?? '—',
    },
    {
      icon: Zap,
      label: 'Experience',
      value: EXPERIENCE_LABELS[soft.experience_level ?? ''] ?? '—',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: LOCATION_LABELS[soft.training_location ?? ''] ?? '—',
    },
    {
      icon: Flame,
      label: 'Frequency',
      value: soft.desired_frequency ? `${soft.desired_frequency} days/week` : '—',
    },
    {
      icon: Clock,
      label: 'Preferred Time',
      value: TIME_LABELS[soft.preferred_time ?? ''] ?? '—',
    },
    {
      icon: Dumbbell,
      label: 'Commitment',
      value: COMMIT_LABELS[soft.commitment_level ?? ''] ?? '—',
    },
  ]

  const injuries = hard.injuries ?? []
  const hasInjuries = injuries.length > 0 && !injuries.includes('none')

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-gold/5 blur-[120px] rounded-full transform-gpu" />
        <div className="absolute bottom-[10%] left-[-20%] w-[50vw] h-[50vw] bg-gold/5 blur-[100px] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto glow-gold">
            <Dumbbell className="w-10 h-10 text-gold" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Your Coach is Ready! 🎉
            </h1>
            <p className="text-muted-foreground mt-2">
              Here&apos;s what your AI coach now knows about you.
            </p>
          </div>
        </div>

        {/* Body stats */}
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Your Profile
          </p>
          <div className="flex flex-wrap gap-3">
            {hard.gender && (
              <span className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium capitalize">
                {hard.gender}
              </span>
            )}
            {hard.age_group && (
              <span className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium">
                Age {hard.age_group}
              </span>
            )}
            {hard.height_cm && (
              <span className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium">
                {hard.height_cm} cm
              </span>
            )}
            {hard.weight_kg && (
              <span className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium">
                {hard.weight_kg} kg
              </span>
            )}
            {hard.body_type && (
              <span className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium capitalize">
                {hard.body_type}
              </span>
            )}
          </div>
        </div>

        {/* Goals + preferences grid */}
        <div className="grid grid-cols-2 gap-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="glass-card rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <card.icon className="w-4 h-4 text-gold" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Target physique */}
        {soft.target_physique && (
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Target Physique</p>
            <p className="font-semibold text-foreground">
              {PHYSIQUE_LABELS[soft.target_physique] ?? soft.target_physique}
            </p>
          </div>
        )}

        {/* Injuries notice */}
        {hasInjuries && (
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-2">
              ⚠️ Injury Aware
            </p>
            <p className="text-sm text-muted-foreground">
              Your coach will never recommend exercises that conflict with:{' '}
              <span className="text-foreground font-medium">{injuries.join(', ')}</span>
            </p>
          </div>
        )}

        {/* CTA */}
        <Link
          href="/ai-coach"
          className="flex items-center justify-center gap-3 w-full bg-gold hover:bg-gold/90 text-white font-bold py-4 rounded-2xl text-base transition-all glow-gold group"
        >
          Meet Your AI Coach
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <p className="text-center text-xs text-muted-foreground">
          Your profile is saved. You can edit it anytime in{' '}
          <Link href="/profile" className="text-gold hover:underline">Profile</Link>.
        </p>
      </div>
    </div>
  )
}
