import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const QuickLogSchema = z.object({
  actionType: z.enum(['food', 'weight', 'workout', 'unknown']),
  foodData: z.object({
    name: z.string().describe('Name of the food, e.g., Phở bò, 2 eggs'),
    calories: z.number().describe('Estimated calories'),
    protein_g: z.number().describe('Estimated protein in grams'),
    carbs_g: z.number().describe('Estimated carbs in grams'),
    fat_g: z.number().describe('Estimated fat in grams')
  }).optional(),
  weightData: z.object({
    weight_kg: z.number().describe('Weight in kg')
  }).optional(),
  workoutData: z.object({
    trained: z.boolean().describe('True if they completed a workout, false if rest day'),
    notes: z.string().describe('Any specific workout notes')
  }).optional(),
  replyMessage: z.string().describe('A friendly, encouraging response to the user acknowledging the log. Keep it short (1-2 sentences) and in the same language they used.')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Call OpenAI to parse the natural language
    const openaiAI = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })

    const { object } = await generateObject({
      model: openaiAI('gpt-4o-mini'),
      schema: QuickLogSchema,
      prompt: `You are an AI Fitness Coach. The user just logged a quick activity: "${text}". 
      Analyze this input and extract the relevant structured data. 
      If it's food, estimate the macros and calories reasonably accurately. 
      Provide a short, motivating replyMessage acknowledging their input.`
    })

    const today = new Date().toISOString().split('T')[0]

    // Save to DB based on action type
    if (object.actionType === 'food' && object.foodData) {
      await supabase.from('food_logs').insert({
        user_id: user.id,
        log_date: today,
        name: object.foodData.name,
        calories: object.foodData.calories,
        protein_g: object.foodData.protein_g,
        carbs_g: object.foodData.carbs_g,
        fat_g: object.foodData.fat_g
      }).throwOnError()
    } else if (object.actionType === 'weight' && object.weightData) {
      // Upsert weight for today
      const { data: existingWeight } = await supabase.from('weight_logs')
        .select('id').eq('user_id', user.id).eq('log_date', today).single()
        
      if (existingWeight) {
        await supabase.from('weight_logs').update({ weight_kg: object.weightData.weight_kg }).eq('id', existingWeight.id).throwOnError()
      } else {
        await supabase.from('weight_logs').insert({
          user_id: user.id,
          log_date: today,
          weight_kg: object.weightData.weight_kg
        }).throwOnError()
      }
    } else if (object.actionType === 'workout' && object.workoutData) {
      // Upsert workout log for today
      const { data: existingWorkout } = await supabase.from('workout_logs')
        .select('id').eq('user_id', user.id).eq('log_date', today).single()
        
      if (existingWorkout) {
        await supabase.from('workout_logs').update({ trained: object.workoutData.trained, notes: object.workoutData.notes }).eq('id', existingWorkout.id).throwOnError()
      } else {
        await supabase.from('workout_logs').insert({
          user_id: user.id,
          log_date: today,
          trained: object.workoutData.trained,
          notes: object.workoutData.notes
        }).throwOnError()
      }
    }

    return NextResponse.json({
      success: true,
      action: object.actionType,
      message: object.replyMessage,
      data: object
    })

  } catch (error) {
    console.error('[/api/ai/quick-log] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
