'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

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
    // Defer setting mounted to next tick to avoid cascading render warning
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  function toggleCollapse() {
    const newState = !isManualCollapsed
    setIsManualCollapsed(newState)
    localStorage.setItem('sidebar_collapsed', String(newState))
  }
  
  // Always collapse on AI Coach, OR use global toggle state
  const isAutoCollapsed = pathname?.startsWith('/ai-coach')
  const isCollapsed = mounted ? (isManualCollapsed || isAutoCollapsed) : isAutoCollapsed

  return (
    <>
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleCollapse} />
      <main className={`${isCollapsed ? 'md:ml-[80px]' : 'md:ml-64'} min-h-screen pb-20 md:pb-0 transition-all duration-300 ease-in-out`}>
        {children}
      </main>
    </>
  )
}
