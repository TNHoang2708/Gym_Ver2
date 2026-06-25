'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, BookHeart, Utensils, User, Users, Camera } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/ai-coach', icon: Sparkles, label: 'AI Coach' },
  { href: '/diary', icon: BookHeart, label: 'Diary' },
  { href: '/community', icon: Users, label: 'Community' },
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/progress', icon: Camera, label: 'Progress' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden w-full px-4 pt-2 pb-6 bg-gradient-to-t from-background via-background/80 to-transparent">
      <nav className="glass-card flex items-center justify-around h-16 rounded-full px-2 relative mx-auto max-w-sm shadow-[0_10px_40px_rgba(0,0,0,1)] border border-white/10">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-full z-10 transition-all duration-300 transform-gpu hover:scale-105 active:scale-95 ${
                isActive ? 'text-gold-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 bg-gold rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-20" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium mt-1 relative z-20 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
