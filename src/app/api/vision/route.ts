import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

// Allow large image payloads
export const maxDuration = 30
export const runtime = 'nodejs'

const schema = z.object({
  foodName: z.string().describe('The name of the meal or food item identified in the image.'),
  calories: z.number().describe('Estimated total calories for the portion shown.'),
  protein_g: z.number().describe('Estimated protein in grams.'),
  carbs_g: z.number().describe('Estimated carbohydrates in grams.'),
  fat_g: z.number().describe('Estimated fat in grams.')
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messages: any = [
  {
    role: 'system',
    content: 'You are an expert AI nutritionist. Analyze the provided image of food. Identify the dish, estimate the portion size from the context of the image, and provide a highly accurate estimation of the macronutrients (calories, protein, carbs, fat). If multiple foods are present, aggregate them into a single meal estimate. If the image does NOT contain food, return foodName as "Not a food item" and 0 for all macros.'
  }
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { image } = body
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log("== VISION API HIT ==")
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userMessage: any = {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this image and return the macronutrients. Ensure strict adherence to the requested JSON schema.' },
        { type: 'image', image: image }
      ]
    }

    // Primary Attempt: Gemini
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    })
    const { object, usage } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [...messages, userMessage] as any
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
            endpoint: '/api/vision',
            tokens_used: tokensUsed,
            cost_estimated: costEstimated,
          })
        }
      }).catch(console.error)
    }

    return NextResponse.json({ result: object })

  } catch (error: unknown) {
    console.error('Vision API Error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process image' }, { status: 500 })
  }
}
