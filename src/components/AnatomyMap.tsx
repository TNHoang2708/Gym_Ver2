'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AnatomyMapProps {
  activeMuscles: string[];
}

export default function AnatomyMap({ activeMuscles }: AnatomyMapProps) {
  const isTarget = (muscle: string) => activeMuscles.includes(muscle)
  
  // A simplified conceptual SVG representation.
  // In a full production app, this would be a highly detailed vector graphic.
  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto">
      <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl">
        {/* Head */}
        <circle cx="100" cy="40" r="20" className="fill-white/10 stroke-white/20 stroke-2" />
        
        {/* Shoulders */}
        <motion.path 
          id="shoulders"
          d="M 60 70 Q 100 60 140 70 L 140 90 L 60 90 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('shoulders') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('shoulders') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Chest */}
        <motion.path 
          id="chest"
          d="M 70 90 L 130 90 L 120 130 Q 100 140 80 130 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('chest') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('chest') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Lats */}
        <motion.path 
          id="lats"
          d="M 60 90 L 70 90 L 80 130 L 65 170 Z M 140 90 L 130 90 L 120 130 L 135 170 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('lats') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('lats') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Core/Abs */}
        <motion.path 
          id="core"
          d="M 80 130 L 120 130 L 115 180 Q 100 190 85 180 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('core') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('core') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Biceps */}
        <motion.path 
          id="biceps"
          d="M 50 90 L 60 90 L 55 140 L 45 140 Z M 150 90 L 140 90 L 145 140 L 155 140 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('biceps') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('biceps') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Triceps */}
        <motion.path 
          id="triceps"
          d="M 40 90 L 50 90 L 45 140 L 35 140 Z M 160 90 L 150 90 L 155 140 L 165 140 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('triceps') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('triceps') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Forearms */}
        <motion.path 
          id="forearms"
          d="M 45 140 L 55 140 L 50 190 L 40 190 Z M 155 140 L 145 140 L 150 190 L 160 190 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('forearms') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('forearms') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />

        {/* Quadriceps */}
        <motion.path 
          id="quadriceps"
          d="M 85 180 L 100 190 L 100 280 L 80 280 Z M 115 180 L 100 190 L 100 280 L 120 280 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('quadriceps') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('quadriceps') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Hamstrings/Glutes */}
        <motion.path 
          id="hamstrings"
          d="M 70 180 L 85 180 L 80 280 L 65 280 Z M 130 180 L 115 180 L 120 280 L 135 280 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('hamstrings') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('hamstrings') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        
        {/* Calves */}
        <motion.path 
          id="calves"
          d="M 80 280 L 100 280 L 95 360 L 85 360 Z M 120 280 L 100 280 L 105 360 L 115 360 Z"
          className={`stroke-white/20 stroke-2 transition-colors duration-500 ${isTarget('calves') ? 'fill-gold glow-gold' : 'fill-white/5'}`}
          animate={isTarget('calves') ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </svg>
      
      {/* Overlay legend */}
      {activeMuscles.length > 0 && (
        <div className="absolute top-0 right-0 p-3 glass-card rounded-xl pointer-events-none scale-75 origin-top-right">
          <p className="text-xs font-bold text-gold mb-1 uppercase">Target</p>
          <ul className="text-[10px] space-y-1">
            {activeMuscles.map(m => (
              <li key={m} className="capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" /> {m.replace('_', ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
