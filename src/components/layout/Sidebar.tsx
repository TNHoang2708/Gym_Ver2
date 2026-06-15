'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Brain,
  Salad,
  BookOpen,
  Activity,
  LayoutDashboard,
  User,
  MessageSquare,
  Dumbbell,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Coach',
    items: [
      { href: '/ai-coach', icon: Brain, label: 'AI Coach' },
      { href: '/nutrition', icon: Salad, label: 'Nutrition' },
    ],
  },
  {
    label: 'Track',
    items: [
      { href: '/diary', icon: BookOpen, label: 'Diary' },
      { href: '/bmi', icon: Activity, label: 'BMI' },
    ],
  },
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', icon: User, label: 'Profile' },
      { href: '/feedback', icon: MessageSquare, label: 'Feedback' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center flex-shrink-0 glow-crimson">
          <Dumbbell className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Gym Planner
          </span>
          <span className="text-[10px] text-crimson font-semibold uppercase tracking-widest">
            AI v2
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-crimson/10 text-crimson border border-crimson/20'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-crimson' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {item.label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-crimson" />
                      )}
                    </Link>
                  )
                })}
              </div>
              {groupIndex < navGroups.length - 1 && (
                <div className="mt-4 border-t border-sidebar-border/60" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground/40 text-center">
          Powered by Gemini AI
        </p>
      </div>
    </aside>
  )
}
