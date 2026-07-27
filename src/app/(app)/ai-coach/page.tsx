'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, Info, Trash2, Plus, MessageSquare, Menu, X, Utensils, Dumbbell, Activity, Flame } from 'lucide-react'
import { ForgeLogo } from '@/components/ForgeLogo'
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
    if (!confirm('Delete this conversation thread?')) return
    
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
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] md:h-[100dvh] w-full overflow-hidden relative bg-[#090A0F]">
      
      {/* Sidebar History */}
      <div className={`w-full md:w-[280px] border-r border-white/10 bg-[#12141F]/80 backdrop-blur-xl shrink-0 flex flex-col ${showHistoryOnMobile ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button 
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-mono font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-300 text-xs border border-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span className="drop-shadow-md">New Chat</span>
          </button>
          {showHistoryOnMobile && (
            <button onClick={() => setShowHistoryOnMobile(false)} className="ml-2 md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            CONVERSATION HISTORY
          </div>
          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-xs font-mono text-zinc-500 italic text-center">
              No previous threads
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  activeSessionId === session.id 
                    ? 'bg-gradient-to-r from-red-600/20 to-amber-500/10 border-red-500/40 text-white font-medium shadow-inner' 
                    : 'bg-transparent border-transparent hover:bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeSessionId === session.id ? 'text-red-500' : 'text-zinc-400'}`} />
                  <span className="text-xs truncate font-mono">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity shrink-0"
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
        
        {/* Header Terminal Bar */}
        <div className="h-14 shrink-0 px-6 flex items-center justify-between bg-[#12141F]/90 border-b border-white/10 backdrop-blur-md z-10 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistoryOnMobile(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors mr-1"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>
            <ForgeLogo className="w-6 h-6" glowing={true} />
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-red-400 uppercase text-sm tracking-tight">COACH AI</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <button 
                onClick={(e) => deleteSession(e, activeSessionId)}
                title="Delete this conversation"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600/20 hover:text-red-400 transition-colors hidden md:flex"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages / Hero Welcome */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative flex flex-col justify-center">
          {!activeSessionId && messages.length === 0 ? (
            <div className="w-full max-w-md mx-auto py-6 px-4 text-center space-y-5 relative z-10">
              
              {/* Borderless App Logo Centerpiece */}
              <div className="flex items-center justify-center mx-auto">
                <ForgeLogo className="w-16 h-16" glowing={true} />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-red-400 uppercase tracking-tight">
                COACH AI
              </h3>

              {/* 4 Ultra-Clean Minimal Prompts */}
              <div className="grid grid-cols-2 gap-3 w-full text-left pt-1">
                <button 
                  onClick={() => setInput("Lên cho tôi lịch tập Push Pull Legs 4 buổi/tuần.")} 
                  className="p-3.5 rounded-xl border border-white/10 bg-[#12141F] hover:border-red-500/40 hover:bg-red-500/5 transition-all flex items-center gap-2.5 group"
                >
                  <Dumbbell className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-xs font-mono font-bold text-white uppercase group-hover:text-red-400 transition-colors">Workout Plan</span>
                </button>

                <button 
                  onClick={() => setInput("Tôi vừa ăn 200g ức gà, 1 chén cơm trắng. Ghi lại dinh dưỡng.")} 
                  className="p-3.5 rounded-xl border border-white/10 bg-[#12141F] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all flex items-center gap-2.5 group"
                >
                  <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-white uppercase group-hover:text-amber-400 transition-colors">Log Meal</span>
                </button>

                <button 
                  onClick={() => setInput("Đánh giá độ sẵn sàng tập nặng hôm nay.")} 
                  className="p-3.5 rounded-xl border border-white/10 bg-[#12141F] hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex items-center gap-2.5 group"
                >
                  <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-white uppercase group-hover:text-purple-400 transition-colors">Recovery</span>
                </button>

                <button 
                  onClick={() => setInput("Hướng dẫn cách tăng tạ Progressive Overload.")} 
                  className="p-3.5 rounded-xl border border-white/10 bg-[#12141F] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all flex items-center gap-2.5 group"
                >
                  <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-white uppercase group-hover:text-emerald-400 transition-colors">Progression</span>
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] md:max-w-[75%] p-4 md:p-5 rounded-2xl ${
                        isUser 
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-tr-xs shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                          : 'bg-[#12141F] border border-white/10 rounded-tl-xs text-zinc-100 shadow-xl'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    
                    {msg.metadata?.schedule && (
                      <ScheduleCard schedule={msg.metadata.schedule} />
                    )}
                    
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
                  <div className="bg-[#12141F] border border-white/10 p-4 rounded-2xl rounded-tl-xs flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    <span className="text-xs font-mono text-zinc-400">AI Coach is analyzing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Terminal Dock */}
        <div className="shrink-0 p-4 md:p-6 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/90 to-transparent z-10">
          <form 
            onSubmit={handleSend}
            className="relative max-w-4xl mx-auto flex items-center gap-2 bg-[#12141F] border border-white/10 rounded-2xl p-2.5 shadow-2xl focus-within:border-red-500/50 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Coach AI about workout schedules, log meals, or strength tips..."
              className="w-full max-h-32 min-h-[44px] bg-transparent border-none resize-none py-2 px-3 text-sm focus:outline-none text-white placeholder:text-zinc-500 font-mono"
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
              className="w-11 h-11 shrink-0 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:scale-100 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <Send className="w-4 h-4" />
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
    <div className="mt-3 w-full max-w-[95%] md:max-w-[85%] bg-[#12141F] p-5 rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">NEW WORKOUT SCHEDULE</span>
          <h4 className="text-base font-heading font-black text-white uppercase mt-0.5">{schedule.name}</h4>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">{schedule.days?.length || 0} Workout Days</p>
        </div>
        {expanded ? <X className="w-5 h-5 text-zinc-400" /> : <Dumbbell className="w-5 h-5 text-red-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-white/10 space-y-4"
          >
            {schedule.days?.map((day, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-bold text-white">{day.day}</p>
                    {day.muscle_groups?.length > 0 && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 mt-1 inline-block">
                        {day.muscle_groups.join(', ')}
                      </span>
                    )}
                  </div>
                  {day.exercises?.length > 0 && (
                    <button 
                      onClick={() => router.push(`/workout/active?dayIndex=${i}`)}
                      className="text-xs font-mono font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-500 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                    >
                      Start Workout
                    </button>
                  )}
                </div>
                {day.exercises?.length > 0 ? (
                  <ul className="space-y-2">
                    {day.exercises.map((ex, j) => (
                      <li key={j} className="text-xs bg-black/30 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-white">{ex.name}</span>
                          <span className="text-red-400 font-mono font-bold whitespace-nowrap ml-2">{ex.sets} x {ex.reps}</span>
                        </div>
                        {(ex.notes || ex.rest_seconds) && (
                          <div className="text-zinc-400 text-[10px] font-mono flex justify-between">
                            <span>{ex.notes}</span>
                            {ex.rest_seconds && <span>Rest: {ex.rest_seconds}s</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-mono text-zinc-500 italic">Rest day or active recovery.</p>
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
  return (
    <div className="mt-3 w-full max-w-[95%] md:max-w-[85%] bg-[#12141F] p-5 rounded-2xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl shrink-0">
          <Utensils className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">MEAL LOGGED</span>
            <span className="text-xs font-mono font-black text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">{nutrition.calories} kcal</span>
          </div>
          <p className="text-sm font-mono font-bold text-white mb-3">{nutrition.food_name}</p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/30 p-2 rounded-xl text-center border border-white/5">
              <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest mb-0.5">Protein</p>
              <p className="text-xs font-mono font-bold text-red-400">{nutrition.protein_g}g</p>
            </div>
            <div className="bg-black/30 p-2 rounded-xl text-center border border-white/5">
              <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest mb-0.5">Carbs</p>
              <p className="text-xs font-mono font-bold text-amber-400">{nutrition.carbs_g}g</p>
            </div>
            <div className="bg-black/30 p-2 rounded-xl text-center border border-white/5">
              <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest mb-0.5">Fat</p>
              <p className="text-xs font-mono font-bold text-purple-400">{nutrition.fat_g}g</p>
            </div>
          </div>

          <Link 
            href="/nutrition"
            className="w-full mt-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
          >
            <span>View Nutrition Diary</span>
            <span className="text-sm">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
