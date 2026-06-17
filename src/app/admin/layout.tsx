import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  return <>{children}</>
}
