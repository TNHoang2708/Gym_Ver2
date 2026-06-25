'use client'

import { useCallback } from 'react'

export function useSound() {
  const playSuccess = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = 'sine'
      // A pleasant high-pitched chime (E6)
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime)
      
      // Volume envelope for a sharp attack and smooth decay
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
      
      // Clean up to prevent memory leaks
      setTimeout(() => {
        ctx.close()
      }, 600)
    } catch (e) {
      console.error('Audio playback failed', e)
    }
  }, [])

  return { playSuccess }
}
