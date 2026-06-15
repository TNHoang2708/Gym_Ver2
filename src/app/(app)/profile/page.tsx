import type { Metadata } from 'next'
import { User } from 'lucide-react'

export const metadata: Metadata = { title: 'Profile' }

export default function ProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-crimson" />
        </div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Coming in Phase 5…</p>
      </div>
    </div>
  )
}
