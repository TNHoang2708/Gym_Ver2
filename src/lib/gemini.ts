/**
 * Gemini AI Client
 * - Model fallback: gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash-latest
 * - Retry on 429/503 with exponential backoff per model
 * - Falls back to next model after retries exhausted
 */

import { GoogleGenerativeAI, type GenerateContentRequest } from '@google/generative-ai'

const MODEL_LIST = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
]

const MAX_RETRIES_PER_MODEL = 3
const BASE_DELAY_MS = 1000

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('503') ||
      msg.includes('429') ||
      msg.includes('overloaded') ||
      msg.includes('rate limit') ||
      msg.includes('quota')
    )
  }
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

export interface GeminiCallOptions {
  systemPrompt: string
  history: GeminiMessage[]
  userMessage: string
  temperature?: number
  maxOutputTokens?: number
}

export async function callGeminiWithFallback(
  options: GeminiCallOptions
): Promise<string> {
  const { systemPrompt, history, userMessage, temperature = 0.8, maxOutputTokens = 2048 } = options

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  let lastError: Error | null = null

  for (const modelName of MODEL_LIST) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    })

    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const chat = model.startChat({ history })
        const result = await chat.sendMessage(userMessage)
        const text = result.response.text()

        if (!text) {
          throw new Error('Empty response from Gemini')
        }

        return text
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (isRetryableError(error)) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt)
          console.warn(
            `[Gemini] ${modelName} attempt ${attempt + 1} failed (${lastError.message}). Retrying in ${delay}ms…`
          )
          await sleep(delay)
        } else {
          // Non-retryable error — skip to next model
          console.warn(`[Gemini] ${modelName} non-retryable error: ${lastError.message}`)
          break
        }
      }
    }

    console.warn(`[Gemini] All retries exhausted for ${modelName}, trying next model…`)
  }

  throw new Error(
    `[Gemini] All models failed. Last error: ${lastError?.message ?? 'Unknown'}`
  )
}
