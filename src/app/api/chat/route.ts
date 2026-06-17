/**
 * POST /api/chat
 * The main AI Coach endpoint.
 * 
 * Flow:
 * 1. Auth check
 * 2. Load user_memory + today's food_logs
 * 3. Build system prompt
 * 4. Load last 50 chat messages as history
 * 5. Detect conversation mode
 * 6. Call Gemini with retry/fallback
 * 7. Parse tags ([MEMORY]/[EMOTION]/[TOPIC]/[SCHEDULE])
 * 8. Persist: save messages, update memory, cap at 50
 * 9. Update session_meta (last_opened_at, last_topics)
 * 10. Return cleaned reply + optional schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIWithFallback, type AIMessage } from '@/lib/ai'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { parseAITags, detectConversationMode, getActiveMood } from '@/lib/memory-engine'
import { calculateNutritionGoals } from '@/lib/nutrition'
import type {
  ChatApiResponse,
  DailyNutritionSummary,
  EmotionalMemory,
  EmotionalMemoryEntry,
  HardMemory,
  SessionMeta,
  SoftMemory,
  UserMemory,
} from '@/types'

const MAX_CHAT_HISTORY = 50

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1.5. Kill Switch Check
    const { data: killSwitch } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'ai_kill_switch')
      .single()

    if (killSwitch?.value === true || killSwitch?.value === 'true') {
      return NextResponse.json(
        { error: 'AI services are temporarily disabled for maintenance.' },
        { status: 503 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const userMessage: string = body.message?.trim()
    const isGreeting: boolean = body.isGreeting === true

    if (!userMessage && !isGreeting) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // 3. Load user memory
    let { data: memoryRow } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Create memory row if it doesn't exist yet
    if (!memoryRow) {
      const { data: newMemory } = await supabase
        .from('user_memory')
        .insert({ user_id: user.id })
        .select()
        .single()
      memoryRow = newMemory
    }

    const memory = memoryRow as UserMemory

    // 4. Load today's nutrition totals
    const today = new Date().toISOString().split('T')[0]
    const { data: foodLogs } = await supabase
      .from('food_logs')
      .select('calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id)
      .eq('log_date', today)

    const hard = (memory.hard_memory ?? {}) as HardMemory
    const soft = (memory.soft_memory ?? {}) as SoftMemory
    const nutritionGoals = calculateNutritionGoals(hard, soft)

    let todayNutrition: DailyNutritionSummary | null = null
    if (foodLogs && foodLogs.length > 0) {
      const totals = foodLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + (log.calories ?? 0),
          protein_g: acc.protein_g + (log.protein_g ?? 0),
          carbs_g: acc.carbs_g + (log.carbs_g ?? 0),
          fat_g: acc.fat_g + (log.fat_g ?? 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      )
      todayNutrition = {
        ...totals,
        goal_calories: nutritionGoals.goal_calories,
        goal_protein_g: nutritionGoals.goal_protein_g,
        goal_carbs_g: nutritionGoals.goal_carbs_g,
        goal_fat_g: nutritionGoals.goal_fat_g,
      }
    }

    // 5. Load chat history (last 50 messages, oldest first)
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(MAX_CHAT_HISTORY)

    // Convert to OpenAI history format (reverse to get chronological order, exclude system)
    const history: AIMessage[] = (chatHistory ?? [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .reverse()
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    // 6. Detect conversation mode
    const activeMood = getActiveMood((memory.emotional_memory ?? {}) as EmotionalMemory)
    const mode = detectConversationMode(userMessage ?? '', activeMood)

    // 7. Build system prompt
    const systemPrompt = buildSystemPrompt(memory, mode, todayNutrition)

    // 8. For greeting requests, use a special greeting prompt
    let promptMessage = userMessage
    if (isGreeting) {
      const { buildGreetingPrompt } = await import('@/lib/system-prompt')
      promptMessage = buildGreetingPrompt(memory)
    }

    // 9. Call Custom AI with fallback
    const aiResponse = await callAIWithFallback({
      systemPrompt,
      history: isGreeting ? [] : history,
      userMessage: promptMessage,
      temperature: 0.85,
      maxOutputTokens: 1500,
    })

    const rawReply = aiResponse.text
    const tokensUsed = aiResponse.tokensUsed

    // Async log telemetry (don't await so we don't block the response)
    const costEstimated = (tokensUsed / 1000) * 0.000150; // Gemini 1.5 Flash cost approx $0.15 / 1M tokens
    supabase.from('api_telemetry').insert({
      user_id: user.id,
      endpoint: '/api/chat',
      tokens_used: tokensUsed,
      cost_estimated: costEstimated,
    }).then(({ error }) => {
      if (error) console.error('[Telemetry] Failed to log:', error)
    })

    // 10. Parse tags from response
    const { memories, emotion, topics, schedule, cleanedText } = parseAITags(rawReply)

    // 11. Persist messages (if not a greeting)
    const messagesToInsert = []

    if (!isGreeting && userMessage) {
      messagesToInsert.push({
        user_id: user.id,
        role: 'user',
        content: userMessage,
      })
    }

    messagesToInsert.push({
      user_id: user.id,
      role: 'assistant',
      content: cleanedText,
      metadata: schedule ? { schedule } : {},
    })

    if (messagesToInsert.length > 0) {
      await supabase.from('chat_messages').insert(messagesToInsert)
    }

    // 12. Cap chat history at 50 messages
    const { data: allMessages } = await supabase
      .from('chat_messages')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (allMessages && allMessages.length > MAX_CHAT_HISTORY) {
      const toDelete = allMessages.slice(MAX_CHAT_HISTORY).map((m) => m.id)
      await supabase.from('chat_messages').delete().in('id', toDelete)
    }

    // 13. Update memory from tags
    const memoryUpdates: Partial<{
      soft_memory: Record<string, unknown>
      emotional_memory: Record<string, unknown>
      session_meta: Record<string, unknown>
    }> = {}

    // Update soft_memory notes
    if (memories.length > 0) {
      const currentNotes = soft.notes ?? []
      const updatedNotes = [...currentNotes, ...memories].slice(-50) // cap at 50 notes
      memoryUpdates.soft_memory = {
        ...soft,
        notes: updatedNotes,
      }
    }

    // Update emotional_memory
    if (emotion) {
      const newEntry: EmotionalMemoryEntry = {
        mood: emotion.mood,
        context: emotion.context,
        set_at: new Date().toISOString(),
        is_heavy: emotion.is_heavy,
      }
      const currentEmotional = (memory.emotional_memory ?? {}) as EmotionalMemory
      const history = currentEmotional.history ?? []
      memoryUpdates.emotional_memory = {
        current: newEntry,
        history: [...history.slice(-10), newEntry], // keep last 10
      }
    }

    // Update session_meta
    const currentMeta = (memory.session_meta ?? {}) as SessionMeta
    const currentTopics = currentMeta.last_topics ?? []
    const updatedTopics = topics.length > 0
      ? [...topics, ...currentTopics].slice(0, 5) // keep last 5 topics
      : currentTopics

    memoryUpdates.session_meta = {
      ...currentMeta,
      last_opened_at: new Date().toISOString(),
      last_topics: updatedTopics,
    }

    // Persist memory updates
    if (Object.keys(memoryUpdates).length > 0) {
      await supabase
        .from('user_memory')
        .update(memoryUpdates)
        .eq('user_id', user.id)
    }

    // 14. Save workout schedule if present
    if (schedule) {
      // Deactivate previous schedules
      await supabase
        .from('workout_schedules')
        .update({ active: false })
        .eq('user_id', user.id)

      // Insert new schedule
      await supabase.from('workout_schedules').insert({
        user_id: user.id,
        schedule,
        active: true,
      })
    }

    const response: ChatApiResponse = {
      reply: cleanedText,
      schedule: schedule ?? undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[/api/chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('api_telemetry').insert({
        user_id: user?.id || null,
        endpoint: '/api/chat',
        tokens_used: 0,
        cost_estimated: 0,
        error_message: message
      })
    } catch (telemetryError) {
      console.error('Failed to log telemetry error:', telemetryError)
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
