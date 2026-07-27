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
        text: "Got it! Unfortunately, my AI cloud brain is temporarily out of credits or quota, so I'm running in offline mode. I can't log this real meal to your database right now, but keep up the great nutrition! 💪",
        tokensUsed: 0
      }
    }

    return {
      text: fallbackText || "It looks like my AI cloud brain is temporarily out of credits or quota, but don't let that stop your gains! I'm running in offline mode so I can't generate a real schedule for you to save, but here's an Emergency 4-Day Split for you to follow manually. Let's crush this! 💪\n\n- Monday: Chest, Shoulders, Triceps\n- Tuesday: Back, Biceps\n- Thursday: Legs, Core\n- Friday: Full Body",
      tokensUsed: 0
    }
  }
}

