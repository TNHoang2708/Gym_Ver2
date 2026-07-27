import type { SupabaseClient } from '@supabase/supabase-js'

export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) {
    console.error('[admin] is_admin RPC failed:', error)
    return false
  }
  return data === true
}
