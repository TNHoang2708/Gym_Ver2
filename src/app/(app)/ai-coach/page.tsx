'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Sparkles, Loader2, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '@/types'

export default function AICoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadHistory() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setMessages(data as ChatMessage[])
    } else {
      await sendGreeting()
    }
    setInitLoading(false)
  }

  async function sendGreeting() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGreeting: true }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages([{ id: 'greet', role: 'assistant', content: data.reply, created_at: new Date().toISOString(), user_id: 'sys' }])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
      user_id: 'me',
    }
    setMessages(prev => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      
      if (data.reply) {
        const tempAssistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
          user_id: 'sys',
          metadata: data.schedule ? { schedule: data.schedule } : undefined,
        }
        setMessages(prev => [...prev, tempAssistantMsg])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] max-w-4xl mx-auto glass-card rounded-[2rem] overflow-hidden relative">
      
      {/* Header */}
      <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center glow-gold">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="font-heading font-bold">Coach AI</h2>
            <p className="text-[10px] text-gold uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Online
            </p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 pb-24 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
                    isUser 
                      ? 'bg-gold text-gold-foreground rounded-tr-sm' 
                      : 'bg-white/5 border border-white/5 rounded-tl-sm text-foreground'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                
                {/* Schedule Card (if attached) */}
                {msg.metadata?.schedule && (
                  <div className="mt-2 w-full max-w-[85%] md:max-w-[75%] glass-card p-4 rounded-2xl border-gold/20 glow-gold">
                    <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">New Workout Schedule</h4>
                    <p className="text-sm text-foreground font-medium">{msg.metadata.schedule.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.metadata.schedule.days.length} workout days</p>
                  </div>
                )}
              </motion.div>
            )
          })}
          
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start"
            >
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gold typing-dot" />
                <span className="w-2 h-2 rounded-full bg-gold typing-dot" />
                <span className="w-2 h-2 rounded-full bg-gold typing-dot" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <form 
          onSubmit={handleSend}
          className="relative max-w-3xl mx-auto flex items-end gap-2 bg-secondary border border-border rounded-2xl p-2 shadow-2xl focus-within:border-gold/50 transition-colors"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your workout, log a meal, or chat..."
            className="w-full max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-4 text-sm focus:outline-none placeholder:text-muted-foreground/50"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 shrink-0 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  )
}
