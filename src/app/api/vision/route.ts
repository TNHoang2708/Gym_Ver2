import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Allow large image payloads
export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // Call GPT-4o Vision to analyze the image
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        foodName: z.string().describe('The name of the meal or food item identified in the image.'),
        calories: z.number().describe('Estimated total calories for the portion shown.'),
        protein_g: z.number().describe('Estimated protein in grams.'),
        carbs_g: z.number().describe('Estimated carbohydrates in grams.'),
        fat_g: z.number().describe('Estimated fat in grams.')
      }),
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI nutritionist. Analyze the provided image of food. Identify the dish, estimate the portion size from the context of the image, and provide a highly accurate estimation of the macronutrients (calories, protein, carbs, fat). If multiple foods are present, aggregate them into a single meal estimate.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this meal and return the macronutrients.' },
            { type: 'image', image: image }
          ]
        }
      ]
    })

    return NextResponse.json({ result: object })
  } catch (error: any) {
    console.error('Vision API Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 })
  }
}
