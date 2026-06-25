'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { haptic } from '@/lib/haptics'

export default function PullToRefresh({ children, onRefresh }: { children: ReactNode, onRefresh?: () => Promise<void> }) {
  const [startY, setStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const MAX_PULL = 100
  const THRESHOLD = 60

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return
    const currentY = e.touches[0].clientY
    const distance = currentY - startY
    
    if (distance > 0 && window.scrollY === 0) {
      const newDistance = Math.min(distance * 0.4, MAX_PULL) // Add resistance
      
      // Vibrate slightly when crossing threshold
      if (pullDistance < THRESHOLD && newDistance >= THRESHOLD) {
        haptic.light()
      }
      
      setPullDistance(newDistance)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      haptic.medium()
      
      if (onRefresh) {
        await onRefresh()
      } else {
        // Fallback: reload page
        window.location.reload()
      }
      
      setPullDistance(0)
      setIsRefreshing(false)
      haptic.success()
    } else {
      setPullDistance(0)
    }
    setStartY(0)
  }

  return (
    <div 
      className="relative w-full min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: Math.min(pullDistance / THRESHOLD, 1), 
              y: isRefreshing ? 20 : Math.min(pullDistance - 20, 20) 
            }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 w-full flex justify-center z-50 pointer-events-none pt-4"
          >
            <div className="bg-black/80 backdrop-blur-md p-3 rounded-full border border-gold/30 shadow-[0_0_15px_rgba(212,175,106,0.3)]">
              <Loader2 
                className={`w-6 h-6 text-gold ${isRefreshing ? 'animate-spin' : ''}`} 
                style={{ transform: !isRefreshing ? `rotate(${pullDistance * 2}deg)` : 'none' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        animate={{ y: isRefreshing ? 60 : pullDistance }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  )
}
