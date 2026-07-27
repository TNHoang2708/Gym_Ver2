import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: memory } = await supabase
    .from('user_memory')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!memory || memory.is_admin !== true) {
    // Forcefully redirect non-admins back to dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 bg-black/40 flex flex-col p-4 hidden md:flex h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
            <span className="text-red-500 font-bold">G</span>
          </div>
          <h2 className="font-heading font-bold text-lg text-white">God Mode</h2>
        </div>
        
        <AdminSidebarNav />

        <div className="mt-auto">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to App
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
