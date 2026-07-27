'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  hue: number
  origin: 'left' | 'right'
  isChunk: boolean
}

export function ForgeEmbers() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const sparksRef = useRef<Spark[]>([])
  const lastTimeRef = useRef<number>(0)

  // Removed early return here to avoid React hooks error

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const MAX_SPARKS = 100 // Reduced for performance

    function spawnStrike(origin: 'left' | 'right') {
      const sparkCount = 15 + Math.random() * 25 // Reduced for performance
      const chatArea = document.getElementById('chat-area')
      
      let strikeY = 0
      if (!chatArea) {
        // Strike near the middle edge if not on AI Coach page
        strikeY = canvas!.height * 0.4 + Math.random() * (canvas!.height * 0.3)
      }
      
      for (let i = 0; i < sparkCount; i++) {
        if (sparksRef.current.length >= MAX_SPARKS) break
        
        let spawnX: number
        let spawnY: number
        let dirX: number
        let dirY: number

        if (chatArea) {
          const rect = chatArea.getBoundingClientRect()
          // Spawn near the top of the chat area (top 10-30%)
          spawnY = rect.top + 60 + Math.random() * (rect.height * 0.2)
          
          const speed = 10 + Math.random() * 25
          if (origin === 'left') {
            spawnX = rect.left + (Math.random() - 0.5) * 5
            dirX = (0.2 + Math.random() * 0.8) * speed // Shoot right
          } else {
            spawnX = rect.right + (Math.random() - 0.5) * 5
            dirX = -(0.2 + Math.random() * 0.8) * speed // Shoot left
          }
          dirY = (Math.random() - 0.3) * speed // Mostly down, slightly up
        } else {
          // Forge strike physics: Extremely fast horizontal spread
          const speed = 15 + Math.random() * 35 
          dirX = origin === 'left' ? speed : -speed
          const angleY = (Math.random() - 0.4) * 1.5 
          dirY = speed * angleY
          spawnX = origin === 'left' ? -10 : canvas!.width + 10
          spawnY = strikeY + (Math.random() - 0.5) * 20
        }

        const isChunk = Math.random() < 0.08 // Heavy, slow chunks of hot iron

        sparksRef.current.push({
          x: spawnX,
          y: spawnY,
          vx: dirX * (isChunk ? 0.4 : 1),
          vy: dirY,
          size: isChunk ? 2 + Math.random() * 3 : 0.5 + Math.random() * 2,
          life: 0,
          maxLife: isChunk ? 60 + Math.random() * 50 : 120 + Math.random() * 120, // Increased life so they fall longer
          hue: 15 + Math.random() * 15, // "Máu lửa" - deeper red/orange, no bright yellow
          origin,
          isChunk
        })
      }
    }

    const strikeInterval = setInterval(() => {
      const side = Math.random() > 0.5 ? 'left' : 'right'
      spawnStrike(side)
      
      // Heavy consecutive blows
      if (Math.random() > 0.6) {
        setTimeout(() => spawnStrike(side), 120 + Math.random() * 100)
        if (Math.random() > 0.5) {
          setTimeout(() => spawnStrike(side), 300 + Math.random() * 100)
        }
      }
    }, 1500)

    function animate(timestamp: number) {
      if (!ctx || !canvas) return
      
      const delta = timestamp - lastTimeRef.current
      if (delta < 16) {
        animRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimeRef.current = timestamp

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const sparks = sparksRef.current

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life++

        if (s.life >= s.maxLife || s.y > canvas.height + 20 || s.x < -100 || s.x > canvas.width + 100) {
          sparks.splice(i, 1)
          continue
        }

        s.x += s.vx
        s.y += s.vy
        
        // Very heavy air drag horizontally for sparks, causing them to whip out then fall
        s.vx *= s.isChunk ? 0.98 : 0.92
        s.vy *= 0.98
        
        // Heavy gravity, metal is heavy
        s.vy += s.isChunk ? 0.8 : 0.4

        const progress = s.life / s.maxLife

        // Cool down to deep blood red
        const currentHue = s.hue - (progress * 15)
        const lightness = s.isChunk ? 40 - (progress * 30) : 70 - (progress * 50)
        
        // Fast fade at the end
        let alpha = 1
        if (progress > 0.7) {
          alpha = 1 - ((progress - 0.7) * 3.33)
        }

        ctx.save()
        
        // Sharp motion blur line (longer for fine sparks, shorter for heavy chunks)
        const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
        const stretch = s.isChunk ? speed * 0.2 : Math.max(0, speed * 0.8)
        
        const angle = Math.atan2(s.vy, s.vx)
        ctx.translate(s.x, s.y)
        ctx.rotate(angle)

        ctx.globalAlpha = alpha

        ctx.fillStyle = `hsl(${currentHue}, 100%, ${lightness}%)`
        ctx.beginPath()
        
        if (s.isChunk) {
          // Chunks are irregular
          ctx.rect(-s.size, -s.size, s.size * 2 + stretch, s.size * 2)
        } else {
          // Sparks are sharp needles
          ctx.ellipse(0, 0, s.size + stretch, s.size * 0.8, 0, 0, Math.PI * 2)
        }
        ctx.fill()

        ctx.restore()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      clearInterval(strikeInterval)
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Hide embers on the admin portal
  if (pathname?.startsWith('/admin')) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  )
}
