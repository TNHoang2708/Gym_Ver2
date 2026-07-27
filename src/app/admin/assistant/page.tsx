'use client'

import { useState } from 'react'
import { Bot, Send, ArrowLeft, Terminal, ShieldCheck, Sparkles, Loader2, Command } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Message {
  role: 'admin' | 'assistant'
  text: string
  action?: string
  timestamp: string
}

export default function AdminAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Chào sếp! Tôi là Trợ Lý God Mode Server. Sếp có thể ra lệnh bằng tiếng Việt tự nhiên (VD: "Bật bảo trì", "Xem thống kê hôm nay", "Cấp VIP cho test@gmail.com").',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userCmd = input.trim()
    setInput('')

    const newMsg: Message = {
      role: 'admin',
      text: userCmd,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, newMsg])
    setSending(true)

    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userCmd })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: data.replyText || 'Đã thực thi câu lệnh thành công.',
            action: data.actionExecuted,
            timestamp: new Date().toLocaleTimeString()
          }
        ])
      } else {
        toast.error('Lỗi khi gửi câu lệnh đến server')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    } finally {
      setSending(false)
    }
  }

  const quickCmds = [
    'Thống kê người dùng hôm nay',
    'Bật công tắc ngắt AI khẩn cấp',
    'Tắt công tắc ngắt AI',
    'Cấp VIP Pro 1 tháng cho test@gmail.com'
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden flex flex-col">
      {/* Background Holographic Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-gold/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Return to Admin Console
            </Link>
            <h1 className="text-4xl font-heading font-black tracking-tight uppercase flex items-center gap-3">
              <Bot className="w-10 h-10 text-gold" />
              Trợ Lý Chat-to-Manage Server
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Điều khiển toàn bộ Server và cơ sở dữ liệu bằng ngôn ngữ tự nhiên.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gold/10 border border-gold/30 text-gold text-xs font-black uppercase tracking-widest">
            <Terminal className="w-4 h-4" /> God Mode Protocol
          </div>
        </div>

        {/* Quick Commands Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest shrink-0 flex items-center gap-1">
            <Command className="w-3.5 h-3.5" /> Gợi ý:
          </span>
          {quickCmds.map((cmd, i) => (
            <button
              key={i}
              onClick={() => setInput(cmd)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white/80 whitespace-nowrap transition-all"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="flex-1 glass-card rounded-3xl p-6 border-white/10 shadow-2xl overflow-y-auto space-y-4 max-h-[550px] min-h-[400px]">
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'admin' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                <span>{m.role === 'admin' ? 'Sếp (Admin)' : 'Trợ Lý God Mode'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`max-w-2xl p-5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'admin'
                    ? 'bg-gradient-fire text-white rounded-tr-none font-medium shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : 'bg-black/60 border border-white/10 text-white rounded-tl-none font-medium shadow-xl'
                }`}
              >
                {m.action && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-2 border border-gold/30">
                    <Sparkles className="w-3 h-3" /> Action: {m.action}
                  </div>
                )}
                <p>{m.text}</p>
              </div>
            </motion.div>
          ))}

          {sending && (
            <div className="flex items-center gap-3 text-xs text-gold font-bold animate-pulse p-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Trợ lý đang phân tích lệnh và thực thi DB...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Nhập câu lệnh điều khiển Server (VD: Bật công tắc ngắt AI khẩn cấp)..."
            className="w-full bg-black/60 border border-white/20 rounded-2xl pl-6 pr-36 py-5 text-sm text-white focus:outline-none focus:border-gold/50 shadow-2xl"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 rounded-xl bg-gradient-gold text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,106,0.3)] flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Gửi Lệnh
          </button>
        </form>

      </div>
    </div>
  )
}
