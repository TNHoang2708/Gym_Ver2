export const dynamic = 'force-dynamic'

import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { Wrench } from 'lucide-react'

import { GlobalAnnouncement } from '@/components/GlobalAnnouncement'
import { OnlineTracker } from '@/components/OnlineTracker'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  // Fetch global settings
  const { data: settings } = await supabase.from('global_settings').select('*')
  const maintenanceMode = settings?.find(s => s.key === 'maintenance_mode')?.value === true
  const globalAnnouncement = settings?.find(s => s.key === 'global_announcement')?.value || ''
  const broadcastVersion = settings?.find(s => s.key === 'broadcast_version')?.value || ''
  
  // If maintenance mode is active, check if user is admin
  let isAdmin = false
  if (maintenanceMode) {
    const { data: { user } } = await supabase.auth.getUser()
    isAdmin = user?.email?.includes('admin') || user?.email === 'admin@gymplanner.ai' || false
  }

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_70%)] rounded-full" />
        </div>
        <div className="relative z-10 glass-card p-8 md:p-12 rounded-[2rem] text-center max-w-lg border border-orange-500/20">
          <Wrench className="w-16 h-16 text-orange-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold mb-4 font-heading text-foreground">System Maintenance</h1>
          <p className="text-muted-foreground mb-8">
            Forge is currently undergoing scheduled maintenance and upgrades. We are working hard to bring you a better experience. Please check back later!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 font-semibold text-sm">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            Engineers at work
          </div>
        </div>
      </div>
    )
  }

  // To ensure the toast updates when broadcastVersion changes, we use it as a key or append it
  const announcementKey = globalAnnouncement ? `${globalAnnouncement}-${broadcastVersion}` : ''

  return (
    <div className="flex flex-col min-h-screen">
      <OnlineTracker />
      {announcementKey && <GlobalAnnouncement key={announcementKey} text={globalAnnouncement} />}
      
      <div className="flex-1 flex flex-col">
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </div>

      {/* Mobile bottom nav - Sticky instead of fixed defeats Safari URL bar overlapping */}
      <div className="sticky bottom-0 z-50 mt-auto w-full">
        <BottomNav />
      </div>

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
