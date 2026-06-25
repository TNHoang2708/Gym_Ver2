'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Megaphone } from 'lucide-react'

export function GlobalAnnouncement({ text }: { text: string }) {
  useEffect(() => {
    if (!text) return

    // Show the toast after a short delay so it doesn't get buried on initial render
    const timer = setTimeout(() => {
      toast(
        <div className="flex items-start gap-3 w-full">
          <div className="p-2 bg-blue-500/20 rounded-full shrink-0">
            <Megaphone className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">Global Announcement</h4>
            <p className="text-sm text-muted-foreground mt-1">{text}</p>
          </div>
        </div>,
        {
          duration: 10000,
          position: 'top-center',
        }
      )
    }, 1000)

    return () => clearTimeout(timer)
  }, [text])

  return null
}
