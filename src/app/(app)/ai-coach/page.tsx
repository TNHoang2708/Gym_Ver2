'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Send, Sparkles, Loader2, Info, ChevronDown, ChevronUp, Trash2, Plus, MessageSquare, Menu, X, Utensils, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { mutate } from 'swr'
import type { ChatMessage, WorkoutSchedule, ChatSession } from '@/types'

export default function AICoachPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  
  const [showHistoryOnMobile, setShowHistoryOnMobile] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadSessions() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (data) {
      setSessions(data as ChatSession[])
    }
    setInitLoading(false)
  }

  async function loadMessagesForSession(sessionId: string) {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as ChatMessage[])
    } else {
      setMessages([])
    }
    setLoading(false)
  }

  function startNewChat() {
    setActiveSessionId(null)
    setMessages([])
    setShowHistoryOnMobile(false)
  }

  function selectSession(sessionId: string) {
    setActiveSessionId(sessionId)
    loadMessagesForSession(sessionId)
    setShowHistoryOnMobile(false)
  }

  async function deleteSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    
    const supabase = createClient()
    await supabase.from('chat_sessions').delete().eq('id', sessionId)
    
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      startNewChat()
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      session_id: activeSessionId || 'temp',
      user_id: 'me',
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId: activeSessionId }),
      })
      const data = await res.json()
      
      if (data.sessionId && data.sessionId !== activeSessionId) {
        setActiveSessionId(data.sessionId)
        // Add new session to top of list
        const newSession = {
          id: data.sessionId,
          user_id: 'me',
          title: userMsg.length > 40 ? userMsg.substring(0, 40) + '...' : userMsg,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setSessions(prev => [newSession, ...prev])
      }
      
      if (data.reply) {
        const tempAssistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          session_id: data.sessionId || activeSessionId || 'temp',
          user_id: 'sys',
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
          metadata: {
            ...(data.schedule ? { schedule: data.schedule } : {}),
            ...(data.nutrition ? { nutrition: data.nutrition } : {})
          },
        }
        setMessages(prev => [...prev, tempAssistantMsg])

        // Trigger global SWR refetch so other tabs (Nutrition/Dashboard) update instantly
        if (data.nutrition) {
          mutate('nutritionData')
          mutate('dashboardData')
        }
        if (data.schedule) {
          mutate('dashboardData')
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] items-center justify-center max-w-5xl mx-auto">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] md:h-[100dvh] w-full overflow-hidden relative">
      
      {/* Sidebar History */}
      <div className={`w-full md:w-[280px] border-r border-white/5 bg-black/20 shrink-0 flex flex-col ${showHistoryOnMobile ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button 
            onClick={startNewChat}
            className="flex-1 flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm border border-white/5"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
          {showHistoryOnMobile && (
            <button onClick={() => setShowHistoryOnMobile(false)} className="ml-2 md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            History
          </div>
          {sessions.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground italic text-center">
              No previous conversations
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-muted-foreground hover:text-white'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate font-medium">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 md:group-hover:opacity-100 p-1 hover:text-red-500 transition-all shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-transparent ${showHistoryOnMobile ? 'hidden' : 'flex'}`}>
        
        {/* Header */}
        <div className="h-16 shrink-0 px-6 flex items-center justify-between bg-black/60 z-10 relative transform-gpu">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistoryOnMobile(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors mr-1"
            >
              <Menu className="w-5 h-5" />
            </button>
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
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <button 
                onClick={(e) => deleteSession(e, activeSessionId)}
                title="Delete this conversation"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors hidden md:flex"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Info className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative">
          {!activeSessionId && messages.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-gold/10 flex items-center justify-center glow-gold mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-bold font-heading mb-2">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground mb-8">Start a new conversation about your workout, nutrition, or anything else.</p>
                
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => setInput("Can you generate a 4-day workout split for me?")} className="p-3 text-sm text-left border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                    <span className="block font-medium text-white mb-0.5">Workout Split</span>
                    <span className="text-muted-foreground text-xs">Generate a 4-day workout plan</span>
                  </button>
                  <button onClick={() => setInput("I ate a chicken breast, 1 cup of rice, and broccoli.")} className="p-3 text-sm text-left border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                    <span className="block font-medium text-white mb-0.5">Log Meal</span>
                    <span className="text-muted-foreground text-xs">Chicken breast, rice, broccoli</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                      <ScheduleCard schedule={msg.metadata.schedule} />
                    )}
                    
                    {/* Nutrition Card (if attached) */}
                    {msg.metadata?.nutrition && (
                      <NutritionCard nutrition={msg.metadata.nutrition} />
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
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/80 to-transparent z-10">
          <form 
            onSubmit={handleSend}
            className="relative max-w-3xl mx-auto flex items-end gap-2 bg-black/80 border border-white/10 rounded-[1.5rem] p-2 shadow-2xl focus-within:border-gold/50 transition-colors transform-gpu"
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

    </div>
  )
}

function ScheduleCard({ schedule }: { schedule: WorkoutSchedule }) {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  
  return (
    <div className="mt-2 w-full max-w-[95%] md:max-w-[85%] glass-card p-4 rounded-2xl border-gold/20 glow-gold overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">New Workout Schedule</h4>
          <p className="text-sm text-foreground font-medium">{schedule.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{schedule.days?.length || 0} workout days</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gold" /> : <ChevronDown className="w-5 h-5 text-gold" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-white/5 space-y-4"
          >
            {schedule.days?.map((day, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{day.day}</p>
                    {day.muscle_groups?.length > 0 && (
                      <span className="text-[10px] uppercase tracking-wider text-gold px-2 py-0.5 rounded-full bg-gold/10 mt-1 inline-block">
                        {day.muscle_groups.join(', ')}
                      </span>
                    )}
                  </div>
                  {day.exercises?.length > 0 && (
                    <button 
                      onClick={() => router.push(`/workout/active?dayIndex=${i}`)}
                      className="text-xs font-bold bg-gold text-gold-foreground px-3 py-1.5 rounded-lg hover:bg-gold/90 transition-colors"
                    >
                      Start Workout
                    </button>
                  )}
                </div>
                {day.exercises?.length > 0 ? (
                  <ul className="space-y-2">
                    {day.exercises.map((ex, j) => (
                      <li key={j} className="text-xs bg-black/20 p-2 rounded-lg flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-white">{ex.name}</span>
                          <span className="text-gold whitespace-nowrap ml-2">{ex.sets} x {ex.reps}</span>
                        </div>
                        {(ex.notes || ex.rest_seconds) && (
                          <div className="text-muted-foreground flex justify-between">
                            <span>{ex.notes}</span>
                            {ex.rest_seconds && <span>Rest: {ex.rest_seconds}s</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Rest day or active recovery.</p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NutritionCard({ nutrition }: { nutrition: { food_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number } }) {
  const router = useRouter()
  return (
    <div className="mt-2 w-full max-w-[95%] md:max-w-[85%] glass-card p-4 rounded-2xl border-green-500/20 overflow-hidden shadow-lg relative group">
      <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 bg-green-500/10 rounded-xl shrink-0 mt-1">
          <Utensils className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider">Meal Logged</h4>
            <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{nutrition.calories} kcal</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-3">{nutrition.food_name}</p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/20 p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Protein</p>
              <p className="text-sm font-bold text-white">{nutrition.protein_g}g</p>
            </div>
            <div className="bg-black/20 p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Carbs</p>
              <p className="text-sm font-bold text-white">{nutrition.carbs_g}g</p>
            </div>
            <div className="bg-black/20 p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Fat</p>
              <p className="text-sm font-bold text-white">{nutrition.fat_g}g</p>
            </div>
          </div>

          <Link 
            href="/nutrition"
            prefetch={true}
            className="w-full mt-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View in Nutrition <span className="text-lg leading-none">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
