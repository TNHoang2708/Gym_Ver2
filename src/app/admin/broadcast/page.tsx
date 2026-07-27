'use client'

import { useState } from 'react'
import { Megaphone, Send, Users, Crown, User, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function BroadcastDashboard() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [imageUrl, setImageUrl] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!title || !message) {
      toast.error('Title and Message are required')
      return
    }

    setSending(true)
    
    // Simulate sending broadcast
    await new Promise(r => setTimeout(r, 1500))
    
    toast.success('Broadcast sent successfully!')
    setSending(false)
    setTitle('')
    setMessage('')
    setImageUrl('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 md:p-12 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gold/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      
      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <Megaphone className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tight">Hệ Thống Phát Loa</h1>
            <p className="text-muted-foreground mt-2">Bắn thông báo (Push Notification) đến toàn bộ server hoặc nhóm người dùng cụ thể.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Composer Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-3xl border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
              
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: Cập nhật tính năng mới!"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none"
                  />
                </div>

                {/* Optional Image */}
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    URL Hình ảnh (Tùy chọn) <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                  </label>
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar Config & Preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            
            {/* Audience Selector */}
            <div className="glass-card p-6 rounded-3xl border-white/10 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Đối Tượng Nhận</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setAudience('all')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${audience === 'all' ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${audience === 'all' ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-muted-foreground'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold ${audience === 'all' ? 'text-red-500' : 'text-white'}`}>Tất cả User</p>
                    <p className="text-xs text-muted-foreground">Gửi đến toàn bộ hệ thống</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => setAudience('vip')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${audience === 'vip' ? 'bg-gold/10 border-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${audience === 'vip' ? 'bg-gold/20 text-gold' : 'bg-white/10 text-muted-foreground'}`}>
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold ${audience === 'vip' ? 'text-gold' : 'text-white'}`}>VIP (Pro / God)</p>
                    <p className="text-xs text-muted-foreground">Chỉ dành riêng cho VIP</p>
                  </div>
                </button>

                <button 
                  onClick={() => setAudience('free')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${audience === 'free' ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${audience === 'free' ? 'bg-blue-500/20 text-blue-500' : 'bg-white/10 text-muted-foreground'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold ${audience === 'free' ? 'text-blue-500' : 'text-white'}`}>Free User</p>
                    <p className="text-xs text-muted-foreground">Khuyến mãi nâng cấp</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleSend}
              disabled={sending || !title || !message}
              className="w-full bg-gradient-fire text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.3)] glow-red relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl" />
              <span className="relative z-10 flex items-center gap-2">
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang Phát Sóng...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Bắn Thông Báo
                  </>
                )}
              </span>
            </button>
            
          </motion.div>
        </div>
      </div>
    </div>
  )
}
