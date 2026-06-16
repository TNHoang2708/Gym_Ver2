export const dynamic = 'force-dynamic'

import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toaster } from '@/components/ui/sonner'


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content — offset by sidebar on desktop */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Toast notifications */}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: 'oklch(0.1 0 0)',
            border: '1px solid oklch(0.18 0 0)',
            color: 'oklch(0.96 0 0)',
          },
        }}
      />
    </div>
  )
}
