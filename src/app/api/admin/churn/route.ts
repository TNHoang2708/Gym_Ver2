import { NextResponse } from 'next/server'
import { getChurnRiskRadarData, triggerRetentionCampaign } from '@/lib/retention-engine'

export async function GET() {
  try {
    const data = await getChurnRiskRadarData()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching churn risk data:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch churn data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, actionType, customMessage } = body

    if (!userId || !actionType) {
      return NextResponse.json({ error: 'userId and actionType are required' }, { status: 400 })
    }

    const result = await triggerRetentionCampaign({ userId, actionType, customMessage })
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error triggering retention campaign:', error)
    return NextResponse.json({ error: error.message || 'Failed to trigger campaign' }, { status: 500 })
  }
}
