/**
 * System Prompt Builder
 * Assembles the full Gemini system prompt from all memory layers + session context.
 * Implements coaching vs emotional support mode switching.
 */

import type {
  DailyNutritionSummary,
  EmotionalMemory,
  HardMemory,
  SessionMeta,
  SoftMemory,
  UserMemory,
} from '@/types'
import {
  generateGreetingContext,
  getActiveMood,
  getSafeEmotionalContext,
  ConversationMode,
} from './memory-engine'

// =====================================================
// LABEL MAPS for readable prompt content
// =====================================================
const GENDER_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female', other: 'Non-binary/Other',
}
const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'Build muscle', fat_loss: 'Lose fat', strength: 'Get stronger', general_health: 'Improve general health',
}
const PHYSIQUE_LABELS: Record<string, string> = {
  lean_toned: 'Lean & toned', muscular: 'Muscular', athletic: 'Athletic', strong: 'Strong & powerful',
}
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner (0-6 months)', novice: 'Novice (6-12 months)',
  intermediate: 'Intermediate (1-3 years)', advanced: 'Advanced (3+ years)',
}
const LOCATION_LABELS: Record<string, string> = {
  gym: 'Gym', home: 'Home', both: 'Gym and home',
}
const TIME_LABELS: Record<string, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible',
}
const COMMIT_LABELS: Record<string, string> = {
  casual: 'Casual (consistency over intensity)', serious: 'Serious (structured programming)',
  hardcore: 'Hardcore (maximum dedication)',
}

// =====================================================
// HARD MEMORY SECTION
// =====================================================
function buildHardMemorySection(hard: HardMemory): string {
  const lines: string[] = ['## User Profile (Hard Memory — DO NOT re-ask these)']

  if (hard.gender) lines.push(`- Gender: ${GENDER_LABELS[hard.gender] ?? hard.gender}`)
  if (hard.age_group) lines.push(`- Age group: ${hard.age_group}`)
  if (hard.height_cm) lines.push(`- Height: ${hard.height_cm} cm`)
  if (hard.weight_kg) lines.push(`- Weight: ${hard.weight_kg} kg`)
  if (hard.body_type) lines.push(`- Body type: ${hard.body_type}`)

  const injuries = hard.injuries ?? []
  if (injuries.length > 0 && !injuries.includes('none')) {
    lines.push(`- INJURIES / CONDITIONS (CRITICAL — never suggest conflicting exercises): ${injuries.join(', ')}`)
  } else {
    lines.push(`- Injuries/conditions: None reported`)
  }

  return lines.join('\n')
}

// =====================================================
// SOFT MEMORY SECTION
// =====================================================
function buildSoftMemorySection(soft: SoftMemory): string {
  const lines: string[] = ['## User Preferences (Soft Memory)']

  if (soft.main_goal) lines.push(`- Main goal: ${GOAL_LABELS[soft.main_goal] ?? soft.main_goal}`)
  if (soft.target_physique) lines.push(`- Target physique: ${PHYSIQUE_LABELS[soft.target_physique] ?? soft.target_physique}`)
  if (soft.experience_level) lines.push(`- Training experience: ${EXPERIENCE_LABELS[soft.experience_level] ?? soft.experience_level}`)
  if (soft.training_location) lines.push(`- Training location: ${LOCATION_LABELS[soft.training_location] ?? soft.training_location}`)
  if (soft.current_frequency) lines.push(`- Current training frequency: ${soft.current_frequency} days/week`)
  if (soft.desired_frequency) lines.push(`- Desired frequency: ${soft.desired_frequency} days/week`)
  if (soft.preferred_time) lines.push(`- Preferred workout time: ${TIME_LABELS[soft.preferred_time] ?? soft.preferred_time}`)
  if (soft.motivation) lines.push(`- Primary motivation: ${soft.motivation}`)
  if (soft.commitment_level) lines.push(`- Commitment level: ${COMMIT_LABELS[soft.commitment_level] ?? soft.commitment_level}`)

  const notes = soft.notes ?? []
  if (notes.length > 0) {
    lines.push(`\n### Facts I've learned about this user:`)
    notes.slice(-20).forEach((note) => lines.push(`- ${note}`)) // Last 20 notes
  }

  return lines.join('\n')
}

// =====================================================
// EMOTIONAL MEMORY SECTION
// =====================================================
function buildEmotionalSection(emotional: EmotionalMemory): string {
  const activeMood = getActiveMood(emotional)
  const safeMood = getSafeEmotionalContext(emotional)

  const lines: string[] = ['## Emotional Context']

  if (!activeMood || !safeMood) {
    lines.push('- No notable recent emotional state on record.')
    return lines.join('\n')
  }

  lines.push(`- Recent mood: ${safeMood} (still within active window)`)
  if (activeMood.context && !activeMood.is_heavy) {
    lines.push(`- Context: ${activeMood.context}`)
  }
  if (activeMood.is_heavy) {
    lines.push('- NOTE: User has shared something heavy. Do NOT bring this up unless they mention it first. Be gentle and supportive if they do.')
  }

  return lines.join('\n')
}

// =====================================================
// NUTRITION SECTION
// =====================================================
function buildNutritionSection(nutrition: DailyNutritionSummary | null): string {
  if (!nutrition) {
    return `## Today's Nutrition\n- No nutrition data logged today yet.`
  }

  const calLeft = nutrition.goal_calories - nutrition.calories
  const proteinLeft = nutrition.goal_protein_g - nutrition.protein_g
  const pctCalories = Math.round((nutrition.calories / nutrition.goal_calories) * 100)

  return [
    `## Today's Nutrition (use this to answer nutrition questions accurately)`,
    `- Calories consumed: ${nutrition.calories} / ${nutrition.goal_calories} kcal (${pctCalories}%)`,
    `- Protein: ${nutrition.protein_g}g / ${nutrition.goal_protein_g}g`,
    `- Carbs: ${nutrition.carbs_g}g / ${nutrition.goal_carbs_g}g`,
    `- Fat: ${nutrition.fat_g}g / ${nutrition.goal_fat_g}g`,
    `- Calories remaining today: ${calLeft > 0 ? calLeft : 0} kcal`,
    `- Protein remaining today: ${proteinLeft > 0 ? proteinLeft.toFixed(1) : 0}g`,
  ].join('\n')
}

// =====================================================
// MODE RULES
// =====================================================
function buildModeRules(mode: ConversationMode): string {
  if (mode === 'emotional_support') {
    return `## Active Mode: EMOTIONAL SUPPORT
- The user seems to be going through something emotionally difficult or is stressed/tired.
- Your ONLY goal right now is to make them feel heard and understood.
- Do NOT pivot to workouts, nutrition, or fitness content unless they explicitly ask.
- Listen, validate, empathize. Ask gentle follow-up questions. 
- Be warm and human, like a close friend who happens to know fitness.
- Switching back to coaching mode should feel natural if they bring it up.`
  }

  return `## Active Mode: COACHING
- The user is in coaching mode. Give specific, useful, actionable fitness and nutrition advice.
- Reference their profile data (goals, experience, location, injuries) when relevant.
- Be direct and confident. You know what you're talking about.
- If the user shifts to an emotional topic, acknowledge it first before returning to coaching.`
}

// =====================================================
// TAG OUTPUT INSTRUCTIONS
// =====================================================
const TAG_INSTRUCTIONS = `## Output Format (CRITICAL — follow exactly)
At the VERY END of your response, silently append relevant tags. These are stripped before showing the user.

Tag formats:
- [MEMORY: short fact about the user] — Append when you learn something new worth remembering (max 1 per reply)
- [EMOTION: mood|context] — Append when you detect a mood. mood = tired|stressed|sad|motivated|happy|neutral. context = brief phrase (optional)
- [TOPIC: brief topic] — Always append the topic of this conversation turn
- [SCHEDULE: {...json...}] — ONLY when outputting a workout schedule. Format:
  {
    "name": "4-Day Upper/Lower Split",
    "frequency": 4,
    "days": [
      {
        "day": "Monday",
        "muscle_groups": ["Chest", "Shoulders", "Triceps"],
        "exercises": [
          { "name": "Bench Press", "sets": 4, "reps": "8-10", "rest_seconds": 90 }
        ]
      }
    ]
  }

Rules:
- Tags must be at the END of your message, on new lines.
- Never mention these tags in conversation. The user never sees them.
- Only output [SCHEDULE] when the user actually asks for a workout plan.
- [MEMORY] tag should capture facts that help personalize future responses (struggles, preferences, stories).`

// =====================================================
// IDENTITY & CORE INSTRUCTIONS
// =====================================================
const AI_IDENTITY = `You are a personal AI fitness coach named "Coach". You are warm, knowledgeable, and genuinely care about this person.

Your unique strength: you REMEMBER this user across all conversations. You reference their history naturally — like a real friend who has been coaching them for a while.

Core rules:
1. NEVER ask about information already in their profile (hard/soft memory above).
2. Always personalize advice to their specific profile, goals, and injuries.
3. Be conversational and human. Avoid bullet lists for casual chat — save structured output for workout plans/nutrition breakdowns.
4. Keep responses concise unless they ask for detail. One powerful paragraph beats five average ones.
5. If they want a workout schedule, generate one using the [SCHEDULE] tag format.
6. Reference past notes naturally ("Hey, didn't you mention last time that...").`

// =====================================================
// MAIN BUILDER
// =====================================================
export function buildSystemPrompt(
  memory: UserMemory,
  mode: ConversationMode,
  nutrition: DailyNutritionSummary | null
): string {
  const hard = (memory.hard_memory ?? {}) as HardMemory
  const soft = (memory.soft_memory ?? {}) as SoftMemory
  const emotional = (memory.emotional_memory ?? {}) as EmotionalMemory

  const sections = [
    AI_IDENTITY,
    '',
    buildHardMemorySection(hard),
    '',
    buildSoftMemorySection(soft),
    '',
    buildEmotionalSection(emotional),
    '',
    buildNutritionSection(nutrition),
    '',
    buildModeRules(mode),
    '',
    TAG_INSTRUCTIONS,
  ]

  return sections.join('\n')
}

// =====================================================
// GREETING PROMPT BUILDER
// =====================================================
export function buildGreetingPrompt(memory: UserMemory): string {
  const ctx = generateGreetingContext(memory)
  const soft = (memory.soft_memory ?? {}) as SoftMemory
  const firstName = '' // We don't collect names — keep it natural

  switch (ctx.type) {
    case 'first_time':
      return `Generate a warm, brief welcome message for a brand new user who just completed onboarding. 
Ask them how often they'd like to train per week to get started building their schedule.
Be enthusiastic but not over-the-top. Keep it to 2-3 sentences max.
Output only the message itself — no tags needed for the greeting.`

    case 'long_absence':
      return `The user hasn't opened the app in ${ctx.context.days} days. 
Generate a genuine "long time no see" greeting — warm, not guilt-trippy. 
Ask how they've been and if they're ready to get back into it.
2-3 sentences max.
Output only the message — no tags.`

    case 'week_absence':
      return `The user hasn't been here in about a week (${ctx.context.days} days).
Generate a casual, friendly catch-up greeting. Reference getting back on track.
Keep it brief and inviting — 2 sentences.
Output only the message — no tags.`

    case 'recent_note':
      return `The user was here recently. You remember this about them: "${ctx.context.note}".
Generate a natural greeting that subtly references this — like a friend picking up a conversation.
Don't be creepy about the memory — keep it light and conversational.
1-2 sentences max.
Output only the message — no tags.`

    case 'emotional': {
      const isNeg = ctx.context.valence === 'negative'
      const mood = ctx.context.mood
      if (isNeg) {
        return `The user was feeling ${mood} recently. Check in on how they're doing today.
Be genuinely caring — don't assume they're still feeling that way, just ask softly.
Do NOT immediately push workouts or nutrition.
1-2 sentences.
Output only the message — no tags.`
      } else {
        return `The user was feeling ${mood} recently. Greet them with matching energy and momentum.
Invite them to keep the positive momentum going.
1-2 sentences.
Output only the message — no tags.`
      }
    }

    case 'default': {
      const topicRef = ctx.context.lastTopic
        ? `Last time you talked about: ${ctx.context.lastTopic}.`
        : ''
      return `Generate a simple, warm greeting to welcome the user back. ${topicRef}
Keep it to 1-2 sentences. Natural and friendly.
Output only the message — no tags.`
    }

    default:
      return 'Generate a friendly greeting. 1-2 sentences. No tags.'
  }
}
