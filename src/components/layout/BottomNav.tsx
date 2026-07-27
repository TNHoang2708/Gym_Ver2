'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, Dumbbell, Utensils, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { haptic } from '@/lib/haptics'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/workout', icon: Dumbbell, label: 'Workout' },
  { href: '/ai-coach', icon: Sparkles, label: 'Coach' },
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none pb-safe">
      <nav aria-label="Mobile Navigation" className="pointer-events-auto flex items-center justify-around h-16 rounded-2xl px-2 bg-[#12141F]/95 backdrop-blur-xl border border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.8)] w-full max-w-sm">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              onClick={() => { if (!isActive) haptic.light() }}
              className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl z-10 transition-all duration-200 active:scale-95 ${
                isActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-indicator"
                  className="absolute inset-0 bg-red-600 rounded-xl z-0 shadow-md shadow-red-600/30"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'text-zinc-400'}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-mono tracking-tight relative z-10 transition-opacity mt-0.5 ${isActive ? 'opacity-100 font-bold' : 'opacity-70'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
