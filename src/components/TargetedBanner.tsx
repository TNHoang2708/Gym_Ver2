'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Flame, ShieldAlert, ArrowRight, X, Gift, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface TargetedBannerProps {
  userRole?: string
  proteinDeficit?: boolean
  workoutStreak?: number
}

export default function TargetedBanner({ userRole = 'free', proteinDeficit = false, workoutStreak = 0 }: TargetedBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Determine banner offer based on user signals
  let title = '🔥 Nâng Cấp VIP Pro - Giảm ngay 20%'
  let description = 'Mở khóa HLV AI cá nhân hóa 24/7, phân tích Dinh dưỡng chuyên sâu và Lịch tập tối ưu.'
  let badge = 'ƯU ĐÃI ĐẶC BIỆT'
  let code = 'FORGE20'

  if (proteinDeficit) {
    title = '🥩 Thiếu Dạng Đạm Hôm Nay? Mở Khóa Thực Đơn Gợi Ý AI'
    description = 'AI phát hiện khẩu phần Protein của bạn đang thiếu. Gói Pro sẽ tự động đề xuất công thức nấu ăn khớp 100% Macro.'
    badge = 'GỢI Ý THÔNG MINH'
    code = 'PROTEIN20'
  } else if (workoutStreak >= 3) {
    title = `🏆 Chuỗi ${workoutStreak} Ngày Tập Liên Tục! Thưởng Ngay Mã Pro`
    description = 'Bạn đang tập luyện rất chăm chỉ. Nhận thưởng mã giảm giá VIP Pro để tiếp tục bứt phá giới hạn!'
    badge = 'PHẦN THƯỞNG STREAK'
    code = 'STREAKPRO'
  }

  const handleClaim = () => {
    navigator.clipboard.writeText(code)
    toast.success(`Đã copy mã ưu đãi: ${code}! Vui lòng nâng cấp tài khoản trong phần Profile.`)
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative overflow-hidden rounded-3xl glass-card border border-gold/30 p-6 md:p-8 shadow-[0_0_30px_rgba(212,175,106,0.15)] group"
      >
        {/* Animated Background Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-red-600/10 to-gold/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-gold/20 rounded-full blur-[80px] pointer-events-none" />

        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors border border-white/10 z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-[10px] font-black uppercase tracking-widest text-gold">
              <Sparkles className="w-3 h-3 text-gold" />
              {badge}
            </div>
            <h3 className="text-xl md:text-2xl font-heading font-black text-white uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 font-mono font-black text-gold text-xs text-center">
              MÃ: <span className="underline decoration-gold">{code}</span>
            </div>
            <button 
              onClick={handleClaim}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-gold text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,106,0.3)] flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Gift className="w-4 h-4" /> Nhận Ưu Đãi
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
