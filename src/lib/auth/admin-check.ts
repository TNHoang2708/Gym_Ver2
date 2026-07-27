import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface AdminAuthResult {
  isAdmin: boolean
  user: any | null
  errorResponse?: NextResponse
}

/**
 * Single Source of Truth for Admin Authorization.
 * Authenticates user via auth.getUser() and strictly checks public.user_roles.
 */
export async function checkAdminAuthorization(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        isAdmin: false,
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required.' },
          { status: 401 }
        ),
      }
    }

    // Single source of truth check on public.user_roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || roleData?.role !== 'admin') {
      return {
        isAdmin: false,
        user,
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Admin role privileges required.' },
          { status: 403 }
        ),
      }
    }

    return {
      isAdmin: true,
      user,
    }
  } catch (err: any) {
    return {
      isAdmin: false,
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Internal Server Error', message: err.message || 'Authorization failure' },
        { status: 500 }
      ),
    }
  }
}
