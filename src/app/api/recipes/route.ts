import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { targetCalories, targetProtein, dietaryLifestyles, allergies } = body

    if (!targetCalories || !targetProtein) {
      return NextResponse.json({ error: 'Missing target macros' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
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

    return NextResponse.json({ recipe: object })
  } catch (error: any) {
    console.error('Error generating recipe:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
