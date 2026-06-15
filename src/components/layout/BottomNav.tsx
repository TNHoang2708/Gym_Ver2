'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Brain, Salad, BookOpen, LayoutDashboard, User } from 'lucide-react'

const navItems = [
  { href: '/ai-coach', icon: Brain, label: 'Coach' },
  { href: '/nutrition', icon: Salad, label: 'Nutrition' },
  { href: '/diary', icon: BookOpen, label: 'Diary' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-150 min-w-[52px]',
                isActive ? 'text-crimson' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-all duration-150',
                  isActive && 'drop-shadow-[0_0_6px_rgba(225,29,72,0.6)]'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium transition-all',
                isActive ? 'text-crimson' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
