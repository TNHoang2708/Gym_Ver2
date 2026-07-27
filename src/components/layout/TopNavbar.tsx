'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, BookHeart, Utensils, User, LogOut, ShieldCheck, Users, Camera, Flame } from 'lucide-react'
import { ForgeLogo } from '@/components/ForgeLogo'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/ai-coach', icon: Sparkles, label: 'AI Coach', badge: 'AI' },
  { href: '/diary', icon: BookHeart, label: 'Diary' },
  { href: '/community', icon: Users, label: 'Community' },
  { href: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { href: '/progress', icon: Camera, label: 'Progress' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function TopNavbar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        if (user.email === 'admin@gymplanner.ai' || user.email?.includes('admin')) {
          setIsAdmin(true)
        }
      }
    }
    checkUser()
  }, [supabase.auth])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090A0F]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <Link 
          href="/dashboard" 
          aria-label="Go to Dashboard"
          className="flex items-center gap-3 group shrink-0 min-h-[44px] px-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <ForgeLogo className="w-8 h-8 transition-transform group-hover:scale-105" glowing={true} />
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-lg tracking-tight text-white uppercase whitespace-nowrap">
              FORGE <span className="text-red-500 font-mono text-xs">PRO AI</span>
            </span>
          </div>
        </Link>

        {/* Center Navigation Links - Ergonomic Pill Bar */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-[#12141F] p-1.5 rounded-xl border border-white/[0.08] shadow-inner">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 min-h-[36px] group ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Actions & Command Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/ai-coach"
            className="hidden lg:flex items-center gap-2 text-xs font-mono text-zinc-300 bg-white/[0.05] border border-white/[0.08] hover:border-white/20 px-3.5 py-2 rounded-lg transition-all min-h-[40px]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Ready</span>
            <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 font-mono">⌘K</kbd>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-red-600/15 text-red-400 border border-red-500/30 hover:bg-red-600/25 transition-all min-h-[40px]"
            >
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            aria-label="Sign Out"
            className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white px-3.5 py-2 rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all min-h-[40px] min-w-[40px] justify-center"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  )
}
