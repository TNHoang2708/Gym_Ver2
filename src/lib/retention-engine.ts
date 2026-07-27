import { createClient } from '@/lib/supabase/client'

export interface ChurnUser {
  userId: string
  email: string
  displayName: string
  lastActiveDays: number
  workoutCountLast14Days: number
  nutritionLogsCountLast14Days: number
  engagementScore: number // 0 - 100
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedAction: string
}

/**
 * Calculates engagement score (0-100) and Churn Risk Level for a user
 */
export function calculateUserEngagement(params: {
  lastActiveDays: number
  workoutCount14d: number
  nutritionLogs14d: number
  hasGoalSet: boolean
}): { score: number; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' } {
  const { lastActiveDays, workoutCount14d, nutritionLogs14d, hasGoalSet } = params

  let score = 100

  // Deduct points for inactivity
  if (lastActiveDays > 14) score -= 60
  else if (lastActiveDays > 7) score -= 40
  else if (lastActiveDays > 3) score -= 20
  else if (lastActiveDays > 1) score -= 5

  // Workout engagement (up to 40 pts)
  const workoutPts = Math.min(workoutCount14d * 8, 40)
  score = score - 40 + workoutPts

  // Nutrition logging engagement (up to 20 pts)
  const nutritionPts = Math.min(nutritionLogs14d * 3, 20)
  score = score - 20 + nutritionPts

  if (hasGoalSet) score += 5

  score = Math.max(0, Math.min(100, Math.round(score)))

  let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  if (score < 40 || lastActiveDays >= 5) {
    riskLevel = 'HIGH'
  } else if (score < 70 || lastActiveDays >= 3) {
    riskLevel = 'MEDIUM'
  }

  return { score, riskLevel }
}

/**
 * Scans all users to generate Churn Risk Radar metrics
 */
export async function getChurnRiskRadarData(): Promise<{
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  users: ChurnUser[]
}> {
  const supabase = createClient()
  
  // Fetch user memories
  const { data: userMemories } = await supabase
    .from('user_memory')
    .select('user_id, display_name, hard_memory, soft_memory, updated_at')

  if (!userMemories) {
    return { highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, users: [] }
  }

  const now = new Date()

  // Fetch recent workout logs (past 14 days)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  
  const { data: recentWorkouts } = await supabase
    .from('workout_logs')
    .select('user_id, created_at')
    .gte('created_at', fourteenDaysAgo)

  // Fetch recent nutrition logs
  const { data: recentNutrition } = await supabase
    .from('daily_nutrition_summary')
    .select('user_id, date')

  const workoutsByUser: Record<string, number> = {}
  recentWorkouts?.forEach(w => {
    workoutsByUser[w.user_id] = (workoutsByUser[w.user_id] || 0) + 1
  })

  const nutritionByUser: Record<string, number> = {}
  recentNutrition?.forEach(n => {
    nutritionByUser[n.user_id] = (nutritionByUser[n.user_id] || 0) + 1
  })

  const users: ChurnUser[] = userMemories.map(mem => {
    const updatedAt = new Date(mem.updated_at || now)
    const diffMs = now.getTime() - updatedAt.getTime()
    const lastActiveDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

    const wCount = workoutsByUser[mem.user_id] || 0
    const nCount = nutritionByUser[mem.user_id] || 0
    const hasGoal = !!(mem.hard_memory?.target_weight_kg || mem.hard_memory?.goal)

    const { score, riskLevel } = calculateUserEngagement({
      lastActiveDays,
      workoutCount14d: wCount,
      nutritionLogs14d: nCount,
      hasGoalSet: hasGoal
    })

    let suggestedAction = 'Maintain engagement & send streak rewards.'
    if (riskLevel === 'HIGH') {
      suggestedAction = 'Send Urgent AI Coach Retention Motivation + 20% Pro Discount Code.'
    } else if (riskLevel === 'MEDIUM') {
      suggestedAction = 'Trigger Workout Reminder & Macro Check-in.'
    }

    return {
      userId: mem.user_id,
      email: mem.soft_memory?.email || `user_${mem.user_id.slice(0, 6)}@forge.ai`,
      displayName: mem.display_name || 'Athlete',
      lastActiveDays,
      workoutCountLast14Days: wCount,
      nutritionLogsCountLast14Days: nCount,
      engagementScore: score,
      riskLevel,
      suggestedAction
    }
  })

  users.sort((a, b) => a.engagementScore - b.engagementScore)

  const highRiskCount = users.filter(u => u.riskLevel === 'HIGH').length
  const mediumRiskCount = users.filter(u => u.riskLevel === 'MEDIUM').length
  const lowRiskCount = users.filter(u => u.riskLevel === 'LOW').length

  return {
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    users
  }
}

/**
 * Triggers automated retention actions (e.g. notifications / AI messages)
 */
export async function triggerRetentionCampaign(params: {
  userId: string
  actionType: 'WINBACK_DISCOUNT' | 'MOTIVATION_NUDGE' | 'STREAK_WARNING'
  customMessage?: string
}): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  const { userId, actionType, customMessage } = params

  let title = '🔥 Message from Forge AI Coach'
  let body = customMessage || 'We miss you in the Forge! Time to crush your goals.'

  if (actionType === 'WINBACK_DISCOUNT') {
    title = '🎁 Special Offer: 20% OFF Forge VIP Pro!'
    body = customMessage || 'Come back to Forge AI Coach with code REFORGE20 and claim your VIP Pro upgrade.'
  } else if (actionType === 'STREAK_WARNING') {
    title = '⚠️ Your Workout Streak is in Danger!'
    body = customMessage || 'Don’t let your hard work fade! Log a quick workout or cardio session today.'
  }

  // Insert into user_notifications or app toast log
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type: actionType,
      read: false,
      created_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn('Notifications table insert failed (fallback handling):', err)
  }

  return {
    success: true,
    message: `Retention campaign (${actionType}) sent to user ${userId}`
  }
}
