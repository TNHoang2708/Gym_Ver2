/**
 * AI Client for OpenAI-compatible endpoint
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

  const messages: AIMessage[] = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push(...history)
  
  if (userMessage) {
    messages.push({ role: 'user', content: userMessage })
  }

  const modelName = 'cx/gpt-5.4-mini'
  const endpoint = 'https://apikey.maivangia.com/v1/chat/completions'
  const apiKey = process.env.CUSTOM_OPENAI_API_KEY || 'sk-bb8321890b1d3627-7e7dy0-ce9c37a4'

  console.log(`[AI] Calling ${endpoint} with model ${modelName}...`)

  const payload = {
    model: modelName,
    messages: messages,
    temperature,
    max_tokens: maxOutputTokens,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`[AI] Error response:`, text)
    throw new Error(`[AI] HTTP error ${response.status}: ${text}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('[AI] Empty response from endpoint')
  }

  return text
}
