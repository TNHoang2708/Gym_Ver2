'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, BookHeart, Utensils, User, LogOut, ShieldCheck, Users, ChevronLeft, Menu, Camera, Zap } from 'lucide-react'
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

export function Sidebar({ isCollapsed = false, onToggle }: { isCollapsed?: boolean; onToggle?: () => void }) {
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
  }, [supabase.auth])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside className={`hidden md:flex flex-col border-r border-white/[0.08] bg-[#090A0F]/95 backdrop-blur-xl shrink-0 fixed top-0 left-0 bottom-0 z-50 transition-all duration-300 ease-out ${isCollapsed ? 'w-[76px]' : 'w-64'} shadow-2xl transform-gpu`}>
      {/* Header / Brand */}
      <div className={`h-20 flex items-center border-b border-white/[0.08] ${isCollapsed ? 'justify-center px-0' : 'px-6 justify-between'}`}>
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-3 group shrink-0 min-h-[44px]">
              <ForgeLogo className="w-9 h-9" glowing={true} />
              <div className="flex flex-col">
                <span className="font-heading font-black text-xl tracking-tight text-white uppercase whitespace-nowrap leading-none">
                  FORGE <span className="text-red-500 text-xs font-mono font-bold">PRO AI</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-1">Athletic Intelligence</span>
              </div>
            </Link>
            {onToggle && (
              <button 
                onClick={onToggle} 
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all shrink-0"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <button 
            onClick={onToggle} 
            className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all group"
            title="Expand Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 min-h-0 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-3">
            Platform Navigation
          </div>
        )}
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`relative flex items-center rounded-xl transition-all duration-200 group ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
              } ${
                isActive 
                  ? 'text-white font-semibold bg-gradient-to-r from-red-500/15 via-orange-500/10 to-transparent border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.12)]' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-full shadow-[0_0_10px_#ef4444]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-red-500' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 relative z-10 min-w-0">
                  <span className="text-sm tracking-tight truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Admin Portal Section */}
      {isAdmin && (
        <div className={`pt-2 pb-2 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <Link
            href="/admin"
            className={`relative flex items-center rounded-xl transition-all duration-200 group ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
            } ${
              pathname.startsWith('/admin') 
                ? 'bg-red-500/20 text-red-400 font-semibold border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                : 'text-red-400/80 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20'
            }`}
            title={isCollapsed ? "Admin Portal" : undefined}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-red-500 group-hover:rotate-12 transition-transform" />
            {!isCollapsed && <span className="text-sm font-medium tracking-tight">Admin Portal</span>}
          </Link>
        </div>
      )}

      {/* User Footer / Sign Out */}
      <div className={`border-t border-white/[0.06] ${isCollapsed ? 'p-2' : 'p-3'}`}>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 group ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
          }`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
