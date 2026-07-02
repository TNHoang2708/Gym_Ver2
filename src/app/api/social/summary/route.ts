import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Allow long requests just in case
export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Strict Input Validation
    const payloadSchema = z.object({
      totalVolume: z.number().min(0),
      sessionLogs: z.array(z.object({
        exercise_name: z.string(),
        set_number: z.number().positive()
      })).optional().default([])
    })

    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 })
    }

    const { sessionLogs, totalVolume } = parsed.data

    if (sessionLogs.length === 0) {
      return NextResponse.json({ summary: "Just crushed an invisible workout. No logs, all gains! 💪🔥" })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ summary: `Just moved ${totalVolume}kg of pure iron! Feeling like an absolute beast today! 🦍🔥` })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Write a short, hype, 2-sentence summary of this workout for a social feed. 
The user moved a total volume of ${totalVolume}kg.
Here are the exercises they did:
${sessionLogs.map((l: { exercise_name: string, set_number: number }) => `- ${l.exercise_name}: ${l.set_number} sets`).join('\n')}

Make it sound like a fitness influencer on Instagram. Use 1 or 2 emojis.`

    const result = await model.generateContent(prompt)
    const summary = result.response.text().trim()

    // Estimate tokens since generateContent doesn't return usage directly in this simple call
    // Or we can just log a fixed amount or fetch from response if available
    const usageMetadata = result.response.usageMetadata;
    if (usageMetadata) {
      const tokensUsed = usageMetadata.totalTokenCount || 0
      const costEstimated = (tokensUsed / 1000) * 0.000150
      supabase.from('api_telemetry').insert({
        user_id: user.id,
        endpoint: '/api/social/summary',
        tokens_used: tokensUsed,
        cost_estimated: costEstimated,
      }).then(({ error }) => {
        if (error) console.error('[Telemetry] Failed to log:', error)
      })
    }

    return NextResponse.json({ summary })
  } catch (error: unknown) {
    console.error('Error generating summary:', error)
    return NextResponse.json({ summary: "Crushed a massive workout and left it all on the gym floor! Another day, another step closer to the goal. 💪🔥" })
  }
}
