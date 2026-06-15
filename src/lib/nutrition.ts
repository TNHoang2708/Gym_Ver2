/**
 * Nutrition calculations — Mifflin-St Jeor BMR → TDEE → macro goals
 */

import type { HardMemory, NutritionGoals, SoftMemory } from '@/types'

// Activity multiplier (moderate — ~1.55 as per spec)
const ACTIVITY_MULTIPLIER = 1.55

/**
 * Mifflin-St Jeor BMR formula
 * Male:   10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161  [CORRECTION: +5 for male]
 * Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 */
function estimateAge(ageGroup: string): number {
  switch (ageGroup) {
    case '18-29': return 24
    case '30-39': return 34
    case '40-49': return 44
    case '50+': return 55
    default: return 30
  }
}

export function calculateBMR(hard: HardMemory): number {
  const weight = hard.weight_kg ?? 75
  const height = hard.height_cm ?? 170
  const age = estimateAge(hard.age_group ?? '30-39')
  const isMale = hard.gender !== 'female'

  // Mifflin-St Jeor
  const bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161)
  return Math.round(bmr)
}

export function calculateTDEE(bmr: number): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIER)
}

/**
 * Adjust TDEE for goal:
 * - fat_loss: -500 kcal/day (≈0.5kg/week loss)
 * - muscle_gain: +300 kcal/day (lean bulk)
 * - strength / general_health: maintenance
 */
export function calculateGoalCalories(tdee: number, goal?: string): number {
  switch (goal) {
    case 'fat_loss': return Math.max(1200, tdee - 500)
    case 'muscle_gain': return tdee + 300
    default: return tdee // strength, general_health = maintenance
  }
}

/**
 * Macro targets (grams):
 * Protein: 2.2g per kg body weight (muscle gain) or 2.0g (others)
 * Fat: 25% of goal calories
 * Carbs: remainder
 */
export function calculateMacroGoals(
  goalCalories: number,
  weightKg: number,
  goal?: string
): { protein_g: number; fat_g: number; carbs_g: number } {
  const proteinMultiplier = goal === 'muscle_gain' ? 2.2 : 2.0
  const protein_g = Math.round(weightKg * proteinMultiplier)
  const fat_g = Math.round((goalCalories * 0.25) / 9) // 9 kcal/g
  const carbsKcal = goalCalories - protein_g * 4 - fat_g * 9
  const carbs_g = Math.round(Math.max(50, carbsKcal / 4)) // 4 kcal/g, min 50g

  return { protein_g, fat_g, carbs_g }
}

/**
 * Full nutrition goals calculation from user memory
 */
export function calculateNutritionGoals(
  hard: HardMemory,
  soft: SoftMemory
): NutritionGoals {
  const bmr = calculateBMR(hard)
  const tdee = calculateTDEE(bmr)
  const goal_calories = calculateGoalCalories(tdee, soft.main_goal)
  const { protein_g, fat_g, carbs_g } = calculateMacroGoals(
    goal_calories,
    hard.weight_kg ?? 75,
    soft.main_goal
  )

  return {
    bmr,
    tdee,
    goal_calories,
    goal_protein_g: protein_g,
    goal_carbs_g: carbs_g,
    goal_fat_g: fat_g,
  }
}

/**
 * BMI calculation
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1))
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}
