'use client'

import { useState, useEffect } from 'react'
import { Bot, User as UserIcon, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  id: string
  user_id: string
  email: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function AILogsDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-logs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load AI Logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-400" /> AI Conversation Logs
        </h1>
        <button 
          onClick={loadLogs}
          disabled={loading}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border ${
                msg.role === 'assistant'
                  ? 'bg-purple-500/5 border-purple-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm flex items-center gap-2">
                    {msg.role === 'assistant' ? 'AI Coach' : msg.email}
                    <span className="text-xs font-normal text-muted-foreground bg-black/30 px-2 py-0.5 rounded-full border border-white/5">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="prose prose-invert max-w-none text-sm text-foreground/80 pl-11">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {messages.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  )
}
