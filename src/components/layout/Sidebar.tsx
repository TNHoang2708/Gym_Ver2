'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Dumbbell, Home, Sparkles, BookHeart, Utensils, User, LogOut, ShieldCheck, Users, ChevronLeft, ChevronRight, Menu, Camera } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/ai-coach', icon: Sparkles, label: 'AI Coach' },
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
    <aside className={`hidden md:flex flex-col border-r border-white/5 bg-[#0A0D14]/90 shrink-0 fixed top-0 left-0 bottom-0 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-64'} transform-gpu`}>
      <div className={`h-20 flex items-center border-b border-white/5 ${isCollapsed ? 'justify-center px-0' : 'px-6 justify-between'}`}>
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-black border border-gold/20 flex items-center justify-center overflow-hidden transition-colors shrink-0 relative">
                <Image src="/logo.png" alt="Forge Logo" fill sizes="40px" className="object-cover" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-foreground uppercase whitespace-nowrap">
                Forge
              </span>
            </Link>
            {onToggle && (
              <button 
                onClick={onToggle} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-white/5 transition-colors shrink-0"
                title="Collapse Menu"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <button 
            onClick={onToggle} 
            className="p-3 rounded-xl text-muted-foreground hover:text-gold hover:bg-white/5 transition-colors group"
            title="Expand Menu"
          >
            <Menu className="w-6 h-6 group-hover:text-gold transition-colors" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 min-h-0 py-8 space-y-2 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
            Menu
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
              className={`relative flex items-center rounded-xl transition-all duration-300 group ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                isActive ? 'text-gold-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-gold rounded-xl z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 shrink-0 ${isActive ? '' : 'group-hover:text-gold transition-colors'}`} strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Admin Quick Link */}
      {isAdmin && (
        <div className={`pb-4 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <Link
            href="/admin"
            className={`relative flex items-center rounded-xl transition-all duration-300 group ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
            } ${
              pathname.startsWith('/admin') ? 'bg-red-500/20 text-red-500 font-medium' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
            }`}
            title={isCollapsed ? "Admin Portal" : undefined}
          >
            <ShieldCheck className="w-5 h-5 relative z-10 shrink-0" />
            {!isCollapsed && <span className="relative z-10 whitespace-nowrap">Admin Portal</span>}
          </Link>
        </div>
      )}

      {/* Footer Area */}
      <div className={`border-t border-white/5 space-y-2 ${isCollapsed ? 'p-3' : 'p-4'}`}>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
          }`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
