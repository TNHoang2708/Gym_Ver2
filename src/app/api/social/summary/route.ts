import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Allow long requests just in case
export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionLogs, totalVolume } = body

    if (!sessionLogs || sessionLogs.length === 0) {
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

    return NextResponse.json({ summary })
  } catch (error: unknown) {
    console.error('Error generating summary:', error)
    return NextResponse.json({ summary: "Crushed a massive workout and left it all on the gym floor! Another day, another step closer to the goal. 💪🔥" })
  }
}
