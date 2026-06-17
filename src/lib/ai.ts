import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

/**
 * AI Client for Custom OpenAI Endpoint
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

export async function callAIWithFallback(options: AICallOptions): Promise<string> {
  const { systemPrompt, history, userMessage, temperature = 0.8, maxOutputTokens = 2048 } = options

  // Initialize custom OpenAI provider
  const customOpenAI = createOpenAI({
    baseURL: 'https://apikey.maivangia.com/v1',
    apiKey: process.env.MAIVANGIA_API_KEY || 'sk-bb8321890b1d3627-7e7dy0-ce9c37a4',
  })
  
  const model = customOpenAI('cx/gpt-5.4-mini')

  // Build the message array for AI SDK
  const messages: any[] = history.map(m => ({
    role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))
  
  if (userMessage) {
    messages.push({ role: 'user', content: userMessage })
  }
  
  console.log(`[AI] Calling Anthropic model: claude-sonnet-4-5 via custom endpoint...`)

  try {
    const { text } = await generateText({
      model: model,
      system: systemPrompt,
      messages: messages,
      temperature,
      // maxTokens: maxOutputTokens,
    })

    if (!text) {
      throw new Error('[AI] Empty response from Anthropic endpoint')
    }

    return text
  } catch (error: any) {
    console.error(`[AI] Error response:`, error)
    throw new Error(`[AI] Anthropic API error: ${error.message}`)
  }
}
