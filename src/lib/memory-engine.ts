/**
 * Memory Engine
 * Handles:
 * - Mood decay logic (per spec decay windows)
 * - Heavy-context filtering
 * - Dynamic greeting generation (all 6 cases from spec)
 * - Tag parsing: [MEMORY:...], [EMOTION:...|...], [TOPIC:...], [SCHEDULE:...]
 */

import type {
  EmotionalMemory,
  EmotionalMemoryEntry,
  HardMemory,
  MoodType,
  SessionMeta,
  SoftMemory,
  UserMemory,
  WorkoutSchedule,
} from '@/types'

// =====================================================
// MOOD DECAY WINDOWS (days)
// =====================================================
const MOOD_DECAY_DAYS: Record<MoodType, number> = {
  tired: 3,
  stressed: 3,
  sad: 7,
  motivated: 2,
  happy: 2,
  neutral: 1,
}

/** Returns true if the mood is still within its decay window */
export function isMoodActive(entry: EmotionalMemoryEntry): boolean {
  if (!entry.set_at) return false
  const setAt = new Date(entry.set_at)
  const now = new Date()
  const daysDiff = (now.getTime() - setAt.getTime()) / (1000 * 60 * 60 * 24)
  const decayDays = MOOD_DECAY_DAYS[entry.mood] ?? 1
  return daysDiff <= decayDays
}

/**
 * Returns the current active mood (if within decay window) or null.
 * Heavy contexts are NOT auto-resurfaced by the AI.
 */
export function getActiveMood(emotionalMemory: EmotionalMemory): EmotionalMemoryEntry | null {
  const current = emotionalMemory?.current
  if (!current) return null
  if (!isMoodActive(current)) return null
  return current
}

/**
 * Heavy-context filter:
 * These events are stored in memory but NEVER auto-resurfaced by the AI.
 * The AI only acknowledges them if the user brings them up first.
 */
const HEAVY_CONTEXTS = [
  'breakup', 'death', 'illness', 'accident', 'divorce', 'job loss',
  'bereaved', 'funeral', 'cancer', 'hospital', 'surgery', 'fired', 'layoff',
]

export function isHeavyContext(context?: string): boolean {
  if (!context) return false
  const lower = context.toLowerCase()
  return HEAVY_CONTEXTS.some((kw) => lower.includes(kw))
}

/**
 * Returns emotional context safe to include in the AI prompt.
 * Filters out heavy contexts from proactive AI mention.
 */
export function getSafeEmotionalContext(
  emotionalMemory: EmotionalMemory
): string | null {
  const active = getActiveMood(emotionalMemory)
  if (!active) return null
  if (active.is_heavy) return null // never proactively mention
  return active.mood
}

// =====================================================
// DAYS SINCE date helpers
// =====================================================
export function daysSince(isoTimestamp: string): number {
  const then = new Date(isoTimestamp)
  const now = new Date()
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)
}

// =====================================================
// DYNAMIC GREETING GENERATOR
// Covers all 6 cases from spec
// =====================================================
export function generateGreetingContext(memory: UserMemory): {
  type: 'first_time' | 'long_absence' | 'week_absence' | 'recent_note' | 'emotional' | 'default'
  context: Record<string, string | undefined>
} {
  const sessionMeta = memory.session_meta as SessionMeta
  const emotionalMemory = memory.emotional_memory as EmotionalMemory
  const softMemory = memory.soft_memory as SoftMemory
  const lastOpened = sessionMeta?.last_opened_at

  // Case 1: First time ever
  if (!lastOpened || !sessionMeta?.onboarding_completed) {
    return { type: 'first_time', context: {} }
  }

  const days = daysSince(lastOpened)

  // Case 5/6: Emotional state takes priority over time
  const activeMood = getActiveMood(emotionalMemory)
  if (activeMood && !activeMood.is_heavy) {
    const negativeMoods: MoodType[] = ['tired', 'stressed', 'sad']
    const positiveMoods: MoodType[] = ['motivated', 'happy']

    if (negativeMoods.includes(activeMood.mood)) {
      return {
        type: 'emotional',
        context: { mood: activeMood.mood, valence: 'negative' },
      }
    }
    if (positiveMoods.includes(activeMood.mood)) {
      return {
        type: 'emotional',
        context: { mood: activeMood.mood, valence: 'positive' },
      }
    }
  }

  // Case 2: Long absence (14+ days)
  if (days >= 14) {
    return { type: 'long_absence', context: { days: Math.round(days).toString() } }
  }

  // Case 3: Week absence (7-13 days)
  if (days >= 7) {
    return { type: 'week_absence', context: { days: Math.round(days).toString() } }
  }

  // Case 4: Returning after 2+ days — reference a note if available
  const notes = softMemory?.notes ?? []
  if (days >= 2 && notes.length > 0) {
    const recentNote = notes[notes.length - 1]
    return { type: 'recent_note', context: { note: recentNote } }
  }

  // Case 6: Default — reference last topic or simple greeting
  const lastTopic = sessionMeta?.last_topics?.[0]
  return {
    type: 'default',
    context: lastTopic ? { lastTopic } : {},
  }
}

// =====================================================
// TAG PARSING
// The AI outputs structured tags at the end of its response.
// These are parsed server-side and stripped before showing user.
// =====================================================
export interface ParsedTags {
  memories: string[]
  emotion: { mood: MoodType; context?: string; is_heavy?: boolean } | null
  topics: string[]
  schedule: WorkoutSchedule | null
  nutrition: { food_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number } | null
  cleanedText: string
}

const TAG_REGEX = /\[(MEMORY|EMOTION|TOPIC):([^\]]+)\]/g

export function parseAITags(rawText: string): ParsedTags {
  const memories: string[] = []
  const topics: string[] = []
  let emotion: ParsedTags['emotion'] = null
  let schedule: WorkoutSchedule | null = null
  let nutrition: ParsedTags['nutrition'] = null

  let cleanedText = rawText

  // Helper to extract JSON blocks
  const extractJsonBlock = (tagPrefix: string): any => {
    const startIdx = cleanedText.indexOf(tagPrefix)
    if (startIdx === -1) return null

    let tagEnd = cleanedText.indexOf(']', startIdx)
    try {
      const jsonStart = cleanedText.indexOf('{', startIdx)
      const jsonEnd = cleanedText.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart && jsonStart > startIdx) {
        const jsonStr = cleanedText.slice(jsonStart, jsonEnd + 1)
        const parsed = JSON.parse(jsonStr)
        
        const closingBracketIdx = cleanedText.indexOf(']', jsonEnd)
        if (closingBracketIdx !== -1) {
          tagEnd = closingBracketIdx
        } else {
          tagEnd = jsonEnd
        }
        
        cleanedText = cleanedText.slice(0, startIdx) + cleanedText.slice(tagEnd + 1)
        return parsed
      }
    } catch (e) {
      console.warn(`[Tags] Failed to parse ${tagPrefix} JSON:`, e)
    }
    
    // If we fail to parse, still remove the tag to avoid showing it to user
    if (tagEnd !== -1) {
      cleanedText = cleanedText.slice(0, startIdx) + cleanedText.slice(tagEnd + 1)
    }
    return null
  }

  // 1. Extract JSON tags (SCHEDULE, NUTRITION) first to avoid regex breaking on nested braces
  schedule = extractJsonBlock('[SCHEDULE:')
  nutrition = extractJsonBlock('[NUTRITION:')

  // 2. Parse remaining simple tags (MEMORY, EMOTION, TOPIC)
  let match: RegExpExecArray | null
  TAG_REGEX.lastIndex = 0
  const regex = new RegExp(TAG_REGEX.source, TAG_REGEX.flags)

  while ((match = regex.exec(cleanedText)) !== null) {
    const fullMatch = match[0]
    const type = match[1]
    const value = match[2].trim()

    switch (type) {
      case 'MEMORY':
        if (value) memories.push(value)
        break
      case 'EMOTION': {
        const parts = value.split('|')
        const rawMood = parts[0]?.trim().toLowerCase() as MoodType
        const context = parts[1]?.trim()
        const validMoods: MoodType[] = ['tired', 'stressed', 'sad', 'motivated', 'happy', 'neutral']
        if (validMoods.includes(rawMood)) {
          emotion = {
            mood: rawMood,
            context,
            is_heavy: context ? isHeavyContext(context) : false,
          }
        }
        break
      }
      case 'TOPIC':
        if (value) topics.push(value)
        break
    }
    
    // Remove the matched tag from cleaned text
    cleanedText = cleanedText.replace(fullMatch, '')
  }

  cleanedText = cleanedText.trim()

  return { memories, emotion, topics, schedule, nutrition, cleanedText }
}

// =====================================================
// CONVERSATION MODE DETECTION
// =====================================================
export type ConversationMode = 'emotional_support' | 'coaching'

const EMOTIONAL_KEYWORDS = [
  'sad', 'crying', 'cry', 'depressed', 'stressed', 'anxious', 'anxiety',
  'tired', 'exhausted', 'overwhelmed', 'breakup', 'broke up', 'lonely',
  'alone', 'scared', 'afraid', 'worried', 'upset', 'hurt', 'angry',
  'frustrated', 'hate', 'hopeless', 'worthless', 'miserable', 'grief',
  'died', 'death', 'lost my', 'miss him', 'miss her', 'miss them',
  'venting', 'vent', 'just want to talk', 'need to talk',
]

export function detectConversationMode(
  userMessage: string,
  activeMood: EmotionalMemoryEntry | null
): ConversationMode {
  const lower = userMessage.toLowerCase()
  const hasEmotionalKeyword = EMOTIONAL_KEYWORDS.some((kw) => lower.includes(kw))

  // If mood is negative and within decay window, lean emotional
  if (activeMood) {
    const negativeMoods: MoodType[] = ['sad', 'stressed', 'tired']
    if (negativeMoods.includes(activeMood.mood) && hasEmotionalKeyword) {
      return 'emotional_support'
    }
  }

  if (hasEmotionalKeyword) return 'emotional_support'

  return 'coaching'
}
