'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Brain, Dumbbell, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ChatApiResponse, WorkoutSchedule } from '@/types'

// =====================================================
// TYPES
// =====================================================
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  schedule?: WorkoutSchedule
  timestamp: Date
}

// =====================================================
// WORKOUT SCHEDULE CARD
// =====================================================
function WorkoutScheduleCard({ schedule }: { schedule: WorkoutSchedule }) {
  return (
    <div className="mt-3 border border-crimson/20 bg-crimson/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-crimson/10 border-b border-crimson/20">
        <Dumbbell className="w-4 h-4 text-crimson" strokeWidth={2.5} />
        <span className="font-bold text-sm text-crimson">{schedule.name}</span>
        <span className="ml-auto text-xs text-crimson/70 font-medium">{schedule.frequency}x / week</span>
      </div>

      {/* Days */}
      <div className="divide-y divide-border/40">
        {schedule.days.map((day, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">{day.day}</span>
              <span className="text-xs text-muted-foreground">{day.muscle_groups?.join(', ')}</span>
            </div>
            {day.exercises && day.exercises.length > 0 ? (
              <div className="space-y-1.5">
                {day.exercises.map((ex, j) => (
                  <div key={j} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-crimson flex-shrink-0" />
                    <span className="flex-1 font-medium text-foreground/80">{ex.name}</span>
                    <span className="text-muted-foreground">
                      {ex.sets} × {ex.reps}
                      {ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Rest day</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// TYPING INDICATOR
// =====================================================
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in-up">
      <div className="w-7 h-7 rounded-full bg-crimson/10 border border-crimson/20 flex items-center justify-center flex-shrink-0">
        <Brain className="w-3.5 h-3.5 text-crimson" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

// =====================================================
// QUICK REPLY BUTTONS
// =====================================================
const QUICK_REPLIES = [
  "Create a workout plan for me",
  "How many calories do I have left today?",
  "I need some motivation",
  "What should I eat for more protein?",
  "I'm feeling tired today",
]

// =====================================================
// MAIN CHAT PAGE
// =====================================================
export default function AICoachPage() {
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showQuickReplies, setShowQuickReplies] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Load existing chat history or generate greeting
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load existing messages
        const { data: chatHistory } = await supabase
          .from('chat_messages')
          .select('id, role, content, metadata, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(50)

        if (chatHistory && chatHistory.length > 0) {
          const loadedMessages: Message[] = chatHistory
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              schedule: m.metadata?.schedule,
              timestamp: new Date(m.created_at),
            }))
          setMessages(loadedMessages)
          setShowQuickReplies(false)
        } else {
          // First visit — generate dynamic greeting
          await generateGreeting()
        }
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateGreeting = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', isGreeting: true }),
      })
      const data: ChatApiResponse = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get greeting')

      const greetingMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }
      setMessages([greetingMsg])
    } catch (err) {
      console.error('Greeting error:', err)
      // Fallback greeting if API fails
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Hey! Welcome to your AI Coach. I'm here to help you train smarter, eat better, and keep you motivated. What's on your mind today?",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function sendMessage(messageText: string) {
    if (!messageText.trim() || isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setShowQuickReplies(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText.trim() }),
      })
      const data: ChatApiResponse = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get response')

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        schedule: data.schedule,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      toast.error('Failed to send message. Please try again.')
      console.error(err)
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
      setInput(messageText)
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleReset() {
    setMessages([])
    setShowQuickReplies(true)
    generateGreeting()
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center mx-auto animate-pulse-glow">
            <Brain className="w-6 h-6 text-crimson" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your coach…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen lg:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border bg-background/80 backdrop-blur-xl flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center animate-pulse-glow">
          <Brain className="w-5 h-5 text-crimson" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-bold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            AI Coach
          </h1>
          <p className="text-xs text-muted-foreground">Remembers everything about you</p>
        </div>
        <button
          onClick={handleReset}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
          title="New conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2 animate-fade-in-up',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-crimson/10 border border-crimson/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="w-3.5 h-3.5 text-crimson" />
              </div>
            )}

            {/* Bubble */}
            <div className={cn(
              'max-w-[85%] sm:max-w-[75%]',
              msg.role === 'user' ? 'items-end' : 'items-start',
              'flex flex-col'
            )}>
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-crimson text-white rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm'
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Workout schedule card */}
              {msg.schedule && <WorkoutScheduleCard schedule={msg.schedule} />}

              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Quick replies */}
        {showQuickReplies && !isLoading && messages.length <= 1 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-3 px-1">Quick starts:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="text-xs bg-secondary hover:bg-secondary/80 border border-border hover:border-border/60 text-muted-foreground hover:text-foreground px-3 py-2 rounded-full transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-background">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message your coach…"
              rows={1}
              disabled={isLoading}
              className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson/30 resize-none overflow-hidden transition-all disabled:opacity-50 min-h-[46px] max-h-[120px]"
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
              input.trim() && !isLoading
                ? 'bg-crimson hover:bg-crimson/90 text-white glow-crimson'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
