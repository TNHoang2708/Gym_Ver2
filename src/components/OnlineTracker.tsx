'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function OnlineTracker() {
  useEffect(() => {
    let presenceChannel: any = null

    async function trackPresence() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return // Don't track anonymous users

      // Remove existing channel if it exists to prevent "cannot add callbacks after subscribe" in React Strict Mode
      const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:online-users')
      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      presenceChannel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id,
          },
        },
      })

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          // Do nothing on client, this is just to broadcast state
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              email: user.email,
              online_at: new Date().toISOString(),
            })
          }
        })
    }

    trackPresence()

    return () => {
      if (presenceChannel) {
        // Use removeChannel instead of just unsubscribe to clear it from the client's cache
        const supabase = createClient()
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [])

  return null // Invisible component
}
