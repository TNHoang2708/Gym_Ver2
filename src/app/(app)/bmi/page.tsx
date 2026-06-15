import type { Metadata } from 'next'
import { Activity } from 'lucide-react'

export const metadata: Metadata = { title: 'BMI & Weight' }

export default function BMIPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8 text-crimson" />
        </div>
        <h1 className="text-2xl font-bold">BMI & Weight</h1>
        <p className="text-muted-foreground">Coming in Phase 3…</p>
      </div>
    </div>
  )
}
