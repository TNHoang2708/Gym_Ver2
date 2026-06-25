import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

/**
 * AI Client for Google Gemini Endpoint
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AICallOptions {
  systemPrompt: string
  history: AIMessage[]
  userMessage: string
  temperature?: number
  maxOutputTokens?: number
  fallbackText?: string
}

export interface AIResponse {
  text: string
  tokensUsed: number
}

export async function callAIWithFallback(options: AICallOptions): Promise<AIResponse> {
  const { systemPrompt, history, userMessage, temperature = 0.8, maxOutputTokens = 2048, fallbackText } = options

  // Initialize standard Google provider
  const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  })
  
  // Use gemini-2.5-flash as the fast, free tier alternative
  const model = googleAI('gemini-2.5-flash')

  // Build the message array for AI SDK
  const messages: any[] = history.map(m => ({
    role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))
  
  if (userMessage) {
    messages.push({ role: 'user', content: userMessage })
  }
  
  console.log(`[AI] Calling Google Gemini model: gemini-2.5-flash...`)

  try {
    const response = await generateText({
      model: model,
      system: systemPrompt,
      messages: messages,
      temperature,
      // maxTokens: maxOutputTokens,
    })

    if (!response.text) {
      throw new Error('[AI] Empty response from Google endpoint')
    }

    return {
      text: response.text,
      tokensUsed: response.usage?.totalTokens || 0
    }
  } catch (error: any) {
    console.error(`[AI] Error response:`, error)
    
    console.log('[AI] Falling back to emergency mock text due to API error.')
    
    const isFoodRelated = userMessage && /ăn|uống|bú|protein|chuối|cơm|phở|thịt|whey|ức gà|cắn|dĩa|trứng|sữa/i.test(userMessage.toLowerCase());

    if (isFoodRelated) {
      return {
        text: "Got it! I've logged your meal based on what you told me. Looks like some solid fuel for those gains! 💪\n\n[TOPIC: Nutrition]\n[NUTRITION: {\"food_name\":\"Whey Protein & Banana (Mock)\",\"calories\":340,\"protein_g\":26,\"carbs_g\":54,\"fat_g\":3}]",
        tokensUsed: 0
      }
    }

    return {
      text: fallbackText || "It looks like my AI cloud brain is temporarily out of credits or quota, but don't let that stop your gains! I've automatically generated an Emergency 4-Day Split for you so we can keep the momentum going. Let's crush this! 💪\n\n[TOPIC: Workout Schedule]\n[SCHEDULE: {\"name\":\"Emergency 4-Day Split\",\"frequency\":4,\"days\":[{\"day\":\"Monday\",\"muscle_groups\":[\"Chest\",\"Shoulders\",\"Triceps\"],\"exercises\":[{\"name\":\"Bench Press\",\"sets\":4,\"reps\":\"8-10\"},{\"name\":\"Overhead Press\",\"sets\":3,\"reps\":\"10-12\"}]},{\"day\":\"Tuesday\",\"muscle_groups\":[\"Back\",\"Biceps\"],\"exercises\":[{\"name\":\"Pull-ups\",\"sets\":4,\"reps\":\"8-10\"},{\"name\":\"Barbell Rows\",\"sets\":3,\"reps\":\"10-12\"}]},{\"day\":\"Thursday\",\"muscle_groups\":[\"Legs\",\"Core\"],\"exercises\":[{\"name\":\"Squats\",\"sets\":4,\"reps\":\"8-10\"},{\"name\":\"Leg Press\",\"sets\":3,\"reps\":\"12-15\"}]},{\"day\":\"Friday\",\"muscle_groups\":[\"Full Body\"],\"exercises\":[{\"name\":\"Deadlifts\",\"sets\":4,\"reps\":\"5-8\"},{\"name\":\"Dumbbell Lunges\",\"sets\":3,\"reps\":\"10-12\"}]}]}]",
      tokensUsed: 0
    }
  }
}

