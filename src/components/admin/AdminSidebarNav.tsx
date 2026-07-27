'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LineChart, Mail, Bot, Dumbbell, Flag, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSidebarNav() {
  const pathname = usePathname()

  const links = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
    { href: '/admin/feedback', label: 'Feedback Inbox', icon: Mail },
    { href: '/admin/ai-logs', label: 'AI Logs', icon: Bot },
    { href: '/admin/exercises', label: 'Exercises CMS', icon: Dumbbell },
    { href: '/admin/flags', label: 'Feature Flags', icon: Flag },
    { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
  ]

  return (
    <nav className="flex-1 space-y-2">
      {links.map((link) => {
        const isActive = pathname === link.href
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              isActive 
                ? "bg-red-500/10 text-red-500 font-bold border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                : "hover:bg-white/5 text-muted-foreground hover:text-white"
            )}
          >
            <Icon className="w-5 h-5" /> {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
