// =====================================================
// Gym Planner AI v2 — Shared TypeScript Types
// =====================================================

// ---- Memory Layer Types ----

export interface HardMemory {
  gender?: 'male' | 'female' | 'other'
  age_group?: '18-29' | '30-39' | '40-49' | '50+'
  height_cm?: number
  weight_kg?: number
  body_type?: 'slim' | 'average' | 'overweight' | 'muscular'
  injuries?: string[]
}

export interface SoftMemory {
  main_goal?: 'muscle_gain' | 'fat_loss' | 'strength' | 'general_health'
  target_physique?: 'lean_toned' | 'muscular' | 'athletic' | 'strong'
  experience_level?: 'beginner' | 'novice' | 'intermediate' | 'advanced'
  training_location?: 'gym' | 'home' | 'both'
  current_frequency?: '0' | '1-2' | '3-4' | '5+'
  desired_frequency?: '3' | '4' | '5' | '6'
  preferred_time?: 'morning' | 'afternoon' | 'evening' | 'flexible'
  motivation?: 'health' | 'appearance' | 'confidence' | 'sport'
  commitment_level?: 'casual' | 'serious' | 'hardcore'
  notes?: string[] // AI-extracted facts from conversations
}

export type MoodType = 'tired' | 'stressed' | 'sad' | 'motivated' | 'happy' | 'neutral'

export interface EmotionalMemoryEntry {
  mood: MoodType
  context?: string
  set_at: string // ISO timestamp
  is_heavy?: boolean // breakup, death, illness, accident, divorce, job loss
}

export interface EmotionalMemory {
  current?: EmotionalMemoryEntry
  history?: EmotionalMemoryEntry[]
}

export interface SessionMeta {
  last_opened_at?: string // ISO timestamp
  last_topics?: string[]
  onboarding_completed?: boolean
}

export interface UserMemory {
  id: string
  user_id: string
  hard_memory: HardMemory
  soft_memory: SoftMemory
  emotional_memory: EmotionalMemory
  session_meta: SessionMeta
  created_at: string
  updated_at: string
}

// ---- Chat Types ----

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    schedule?: WorkoutSchedule
    quick_replies?: string[]
  }
  created_at: string
}

// ---- Nutrition Types ----

export interface FoodLog {
  id: string
  user_id: string
  log_date: string // YYYY-MM-DD
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  created_at: string
}

export interface DailyNutritionSummary {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  goal_calories: number
  goal_protein_g: number
  goal_carbs_g: number
  goal_fat_g: number
}

export interface NutritionGoals {
  bmr: number
  tdee: number
  goal_calories: number
  goal_protein_g: number
  goal_carbs_g: number
  goal_fat_g: number
}

// ---- Workout Types ----

export interface WorkoutDay {
  day: string // e.g. "Monday", "Rest"
  muscle_groups: string[]
  exercises: WorkoutExercise[]
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string // e.g. "8-12" or "AMRAP"
  rest_seconds?: number
  notes?: string
}

export interface WorkoutSchedule {
  name: string
  frequency: number // days per week
  days: WorkoutDay[]
  created_at?: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  log_date: string
  trained: boolean
  notes?: string
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  log_date: string
  weight_kg: number
  created_at: string
}

// ---- Feedback Types ----

export interface Feedback {
  id: string
  user_id: string
  rating: number
  message?: string
  created_at: string
}

// ---- API Response Types ----

export interface ChatApiResponse {
  reply: string
  schedule?: WorkoutSchedule
  error?: string
}

export interface ApiError {
  error: string
  status: number
}
