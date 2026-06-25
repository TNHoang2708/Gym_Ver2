import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

// Force Node.js runtime for API routes
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetCalories, targetProtein, dietaryLifestyles, allergies } = body

    if (!targetCalories || !targetProtein) {
      return NextResponse.json({ error: 'Missing target macros' }, { status: 400 })
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    const { object, usage } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        mealName: z.string().describe('The name of the recipe'),
        macros: z.object({
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fat: z.number()
        }),
        ingredients: z.array(z.string()).describe('List of ingredients with precise measurements'),
        instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
        prepTimeMinutes: z.number().describe('Estimated preparation and cooking time in minutes')
      }),
      prompt: `You are a Michelin-star sports nutritionist.
Create a single meal recipe that exactly hits these macro targets (± 5% tolerance):
- Calories: ${targetCalories} kcal
- Protein: ${targetProtein} g

The user has the following dietary lifestyles: ${dietaryLifestyles?.length ? dietaryLifestyles.join(', ') : 'None'}
The user has the following allergies: ${allergies?.length ? allergies.join(', ') : 'None'}

Ensure the recipe respects their allergies and lifestyles strictly. Provide ingredients with exact measurements so the macros match exactly. Keep instructions simple and prep time realistic.`
    })

    // Log telemetry
    if (usage) {
      import('@/lib/supabase/server').then(async ({ createClient }) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const tokensUsed = usage.totalTokens || 0
          const costEstimated = (tokensUsed / 1000) * 0.000150
          await supabase.from('api_telemetry').insert({
            user_id: user.id,
            endpoint: '/api/recipes',
            tokens_used: tokensUsed,
            cost_estimated: costEstimated,
          })
        }
      }).catch(console.error)
    }

    return NextResponse.json({ recipe: object })
  } catch (error: any) {
    console.error('Error generating recipe:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
