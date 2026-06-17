'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AnatomyMapProps {
  activeMuscles?: string[]
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export default function AnatomyMap({ activeMuscles = [], className = '' }: AnatomyMapProps) {
  const isTarget = (muscle: string) => activeMuscles.includes(muscle)
  
  // Helper to determine the fill color for a muscle
  const getFill = (muscle: string) => {
    return isTarget(muscle) ? '#EAB308' : '#334155' // Gold for active, slate-700 for inactive
  }
  
  // Glow effect variants for framer-motion
  const pulseVariant: any = {
    initial: { opacity: 0.8 },
    animate: { 
      opacity: [0.8, 1, 0.8],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
    }
  }

  return (
    <div className={`relative flex items-center justify-center w-full max-w-sm mx-auto aspect-[3/4] ${className}`}>
      {/* A stylized, simplified vector representation of human anatomy */}
      <svg 
        viewBox="0 0 200 400" 
        className="w-full h-full drop-shadow-2xl"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- FRONT VIEW --- */}
        
        {/* Head & Neck (Inactive Base) */}
        <path d="M100 20 C85 20, 85 45, 100 50 C115 45, 115 20, 100 20 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
        <path d="M92 50 L108 50 L110 65 L90 65 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />

        {/* Shoulders / Deltoids */}
        <motion.path 
          d="M65 80 C50 80, 45 100, 55 110 C65 100, 75 90, 80 80 Z" 
          fill={getFill('shoulders')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('shoulders') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('shoulders') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M135 80 C150 80, 155 100, 145 110 C135 100, 125 90, 120 80 Z" 
          fill={getFill('shoulders')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('shoulders') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('shoulders') ? 'url(#glow)' : ''}
        />

        {/* Chest / Pectorals */}
        <motion.path 
          d="M100 65 C85 65, 75 75, 70 90 C85 100, 100 95, 100 95 Z" 
          fill={getFill('chest')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('chest') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('chest') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M100 65 C115 65, 125 75, 130 90 C115 100, 100 95, 100 95 Z" 
          fill={getFill('chest')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('chest') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('chest') ? 'url(#glow)' : ''}
        />

        {/* Core / Abs */}
        <motion.path 
          d="M85 100 C75 120, 80 150, 85 160 C100 165, 115 160, 115 160 C120 150, 125 120, 115 100 C100 105, 85 100, 85 100 Z" 
          fill={getFill('core')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('core') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('core') ? 'url(#glow)' : ''}
        />

        {/* Biceps */}
        <motion.path 
          d="M55 110 C45 130, 48 145, 55 155 C62 145, 65 130, 55 110 Z" 
          fill={getFill('biceps')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('biceps') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('biceps') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M145 110 C155 130, 152 145, 145 155 C138 145, 135 130, 145 110 Z" 
          fill={getFill('biceps')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('biceps') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('biceps') ? 'url(#glow)' : ''}
        />

        {/* Forearms */}
        <motion.path 
          d="M55 155 C45 180, 45 200, 50 210 C58 200, 62 180, 55 155 Z" 
          fill={getFill('forearms')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('forearms') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('forearms') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M145 155 C155 180, 155 200, 150 210 C142 200, 138 180, 145 155 Z" 
          fill={getFill('forearms')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('forearms') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('forearms') ? 'url(#glow)' : ''}
        />

        {/* Quads / Thighs */}
        <motion.path 
          d="M85 165 C70 200, 75 250, 85 260 C95 250, 95 200, 95 165 C90 168, 85 165, 85 165 Z" 
          fill={getFill('quads')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('quads') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('quads') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M115 165 C130 200, 125 250, 115 260 C105 250, 105 200, 105 165 C110 168, 115 165, 115 165 Z" 
          fill={getFill('quads')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('quads') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('quads') ? 'url(#glow)' : ''}
        />

        {/* Calves */}
        <motion.path 
          d="M85 265 C75 290, 80 340, 85 350 C92 340, 92 290, 90 265 C88 268, 85 265, 85 265 Z" 
          fill={getFill('calves')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('calves') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('calves') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M115 265 C125 290, 120 340, 115 350 C108 340, 108 290, 110 265 C112 268, 115 265, 115 265 Z" 
          fill={getFill('calves')} stroke="#0F172A" strokeWidth="2"
          variants={isTarget('calves') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('calves') ? 'url(#glow)' : ''}
        />

        {/* Lats & Back (Represented slightly on the sides for front view or generic back) */}
        <motion.path 
          d="M70 90 C60 110, 65 140, 85 100 Z" 
          fill={getFill('lats')} stroke="#0F172A" strokeWidth="1"
          variants={isTarget('lats') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('lats') ? 'url(#glow)' : ''}
        />
        <motion.path 
          d="M130 90 C140 110, 135 140, 115 100 Z" 
          fill={getFill('lats')} stroke="#0F172A" strokeWidth="1"
          variants={isTarget('lats') ? pulseVariant : {}}
          initial="initial" animate="animate" filter={isTarget('lats') ? 'url(#glow)' : ''}
        />

      </svg>
      
      {/* Floating Labels for Active Muscles */}
      {activeMuscles.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {activeMuscles.map(m => (
            <span key={m} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold text-gold-foreground rounded-full shadow-lg">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
