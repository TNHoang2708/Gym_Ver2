import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'

export default function AIQuickLogger() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { mutate } = useSWRConfig()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/quick-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to parse log')

      toast.success(data.message || 'Log saved successfully!', {
        icon: '🤖'
      })
      
      setText('')
      
      // Refresh dashboard data instantly
      mutate('/api/dashboard')

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto group">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <div className="relative flex items-center bg-[#1A1E29]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl">
        <div className="pl-4 pr-2 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          )}
        </div>
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
          placeholder="Log anything (e.g. 'Ate 2 eggs', 'Weigh 75kg')..."
          className="w-full bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/50 text-sm md:text-base py-3"
        />
        
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="p-3 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
