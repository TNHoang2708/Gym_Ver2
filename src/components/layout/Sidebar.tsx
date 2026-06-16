'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Home, Sparkles, BookHeart, Utensils, User, LogOut, ShieldCheck, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/ai-coach', icon: Sparkles, label: 'AI Coach' },
  { href: '/diary', icon: BookHeart, label: 'Diary' },
  { href: '/community', icon: Users, label: 'Community' },
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && (user.email === 'admin@gymplanner.ai' || user.email?.includes('admin'))) {
        setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar/50 backdrop-blur-xl shrink-0 h-screen fixed top-0 left-0 z-50">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-8 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
            <Dumbbell className="w-5 h-5 text-gold" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">
            Gym<span className="text-gold">AI</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
          Menu
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive ? 'text-gold-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-gold rounded-xl z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? '' : 'group-hover:text-gold transition-colors'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Admin Quick Link */}
      {isAdmin && (
        <div className="px-4 pb-4">
          <Link
            href="/admin"
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              pathname.startsWith('/admin') ? 'bg-red-500/20 text-red-500 font-medium' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
            }`}
          >
            <ShieldCheck className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Admin Portal</span>
          </Link>
        </div>
      )}

      {/* Footer Area */}
      <div className="p-4 border-t border-border/50">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
