'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  glareColor?: string
}

export function TiltCard({ children, className = '', glareColor = 'rgba(255, 255, 255, 0.1)' }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring configuration for smooth returning
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 })

  // Map mouse position to rotation (max 10 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg'])
  
  // Glare effect movement
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    
    const width = rect.width
    const height = rect.height
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const xPct = (mouseX / width) - 0.5
    const yPct = (mouseY / height) - 0.5
    
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`group relative perspective-1000 ${className}`}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none z-40 rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"
        style={{
          background: useTransform(
            () => `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, ${glareColor}, transparent 60%)`
          ),
          borderRadius: 'inherit'
        }}
      />
      
      {/* Content wrapper with a slight Z translation for 3D depth */}
      <div className="w-full h-full" style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </motion.div>
  )
}
