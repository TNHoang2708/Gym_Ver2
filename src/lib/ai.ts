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
}

export interface AIResponse {
  text: string
  tokensUsed: number
}

export async function callAIWithFallback(options: AICallOptions): Promise<AIResponse> {
  const { systemPrompt, history, userMessage, temperature = 0.8, maxOutputTokens = 2048 } = options

  // Initialize standard Google Generative AI provider
  const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  })
  
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
      throw new Error('[AI] Empty response from Gemini endpoint')
    }

    return {
      text: response.text,
      tokensUsed: response.usage?.totalTokens || 0
    }
  } catch (error: any) {
    console.error(`[AI] Error response:`, error)
    throw new Error(`[AI] Gemini API error: ${error.message}`)
  }
}

