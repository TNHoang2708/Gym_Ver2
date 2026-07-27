'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { ForgeEmbers } from '../ForgeEmbers'

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isManualCollapsed, setIsManualCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    }
    return false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  function toggleCollapse() {
    const newState = !isManualCollapsed
    setIsManualCollapsed(newState)
    localStorage.setItem('sidebar_collapsed', String(newState))
  }
  
  const isAutoCollapsed = pathname?.startsWith('/ai-coach')
  const isCollapsed = mounted ? (isManualCollapsed || isAutoCollapsed) : isAutoCollapsed

  return (
    <div className="relative min-h-screen bg-[#07080E] text-zinc-100 overflow-x-hidden">
      {/* Dynamic Forge Fire Embers / Sparks Canvas */}
      <ForgeEmbers />

      {/* Subtle Ambient Red Glow Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-[#090A10] to-[#040508]" />

      <div className="relative z-10">
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleCollapse} />
        <main className={`${isCollapsed ? 'md:ml-[80px]' : 'md:ml-64'} min-h-screen pb-20 md:pb-0 transition-all duration-300 ease-in-out`}>
          {children}
        </main>
      </div>
    </div>
  )
}
