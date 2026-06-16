import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIWithFallback } from '@/lib/ai'
import type { UserMemory } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const { nutrition, workoutStreak } = await request.json()

    // 3. Load user memory
    const { data: memoryRow } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const memory = memoryRow as UserMemory | undefined
    const name = memory?.hard_memory?.gender === 'male' ? 'bro' : 'my friend'
    const mood = memory?.emotional_memory?.current?.mood || 'neutral'
    const goal = memory?.soft_memory?.main_goal || 'fitness'
    
    // Get recent notes to make it more personal
    const notes = memory?.soft_memory?.notes || []
    const recentNotes = notes.slice(-3).join(', ')

    // 4. Build prompt
    const systemPrompt = `You are a world-class AI Fitness Coach.
Your goal is to provide a SINGLE, short, highly motivating sentence to the user for their dashboard.
Keep it under 20 words. Be punchy, personalized, and engaging.

User Context:
- Current Mood: ${mood}
- Main Goal: ${goal}
- Recent Notes: ${recentNotes}
- Today's Calories: ${nutrition?.calories || 0} / ${nutrition?.goal_calories || 2000} kcal
- Workout Streak: ${workoutStreak} days

Instructions:
- Write ONE sentence.
- Do NOT use emojis.
- Do NOT include hashtags.
- Reference their streak or nutrition if relevant, or their mood.`

    // 5. Call AI
    const insight = await callAIWithFallback({
      systemPrompt,
      history: [],
      userMessage: 'Give me my daily dashboard insight.',
      temperature: 0.9,
      maxOutputTokens: 50,
    })

    return NextResponse.json({ insight: insight.trim().replace(/^"|"$/g, '') })
  } catch (error) {
    console.error('[/api/insight] Error:', error)
    return NextResponse.json({ error: 'Internal server error', insight: "Stay focused and trust the process. Today is another opportunity to get closer to your goals." }, { status: 500 })
  }
}
