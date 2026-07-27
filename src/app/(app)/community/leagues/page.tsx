'use client'

import { useState } from 'react'
import { Trophy, Flame, Dumbbell, Award, Crown, Sparkles, ChevronRight, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface LeaderboardUser {
  rank: number
  displayName: string
  score: string
  avatar: string
  isCurrentUser?: boolean
  badge?: string
}

export default function CommunityLeaguesPage() {
  const [activeLeague, setActiveLeague] = useState<'IRON_LIFTER' | 'STREAK' | 'BURN'>('IRON_LIFTER')

  const ironLifterUsers: LeaderboardUser[] = [
    { rank: 1, displayName: 'Viking Thunder', score: '14,250 kg', avatar: '⚡', badge: 'LEGENDARY' },
    { rank: 2, displayName: 'Coach Duy Nguyễn', score: '12,800 kg', avatar: '🔥', badge: 'MASTER' },
    { rank: 3, displayName: 'Iron Beast', score: '11,400 kg', avatar: '🏋️‍♂️', badge: 'PRO' },
    { rank: 4, displayName: 'Thành Béo Gym', score: '9,850 kg', avatar: '💪' },
    { rank: 5, displayName: 'You (Athlete)', score: '8,400 kg', avatar: '⭐', isCurrentUser: true },
    { rank: 6, displayName: 'Minh Tuấn Fit', score: '7,900 kg', avatar: '🎯' },
    { rank: 7, displayName: 'Hùng Titan', score: '7,100 kg', avatar: '🛡️' }
  ]

  const streakUsers: LeaderboardUser[] = [
    { rank: 1, displayName: 'Iron Beast', score: '48 ngày', avatar: '🏋️‍♂️', badge: 'UNSTOPPABLE' },
    { rank: 2, displayName: 'You (Athlete)', score: '35 ngày', avatar: '⭐', isCurrentUser: true, badge: 'STREAK KING' },
    { rank: 3, displayName: 'Viking Thunder', score: '32 ngày', avatar: '⚡' },
    { rank: 4, displayName: 'Coach Duy Nguyễn', score: '28 ngày', avatar: '🔥' },
    { rank: 5, displayName: 'Minh Tuấn Fit', score: '21 ngày', avatar: '🎯' }
  ]

  const burnUsers: LeaderboardUser[] = [
    { rank: 1, displayName: 'Coach Duy Nguyễn', score: '42,500 Kcal', avatar: '🔥', badge: 'INFERNO' },
    { rank: 2, displayName: 'Viking Thunder', score: '38,900 Kcal', avatar: '⚡' },
    { rank: 3, displayName: 'Minh Tuấn Fit', score: '31,200 Kcal', avatar: '🎯' },
    { rank: 4, displayName: 'You (Athlete)', score: '28,400 Kcal', avatar: '⭐', isCurrentUser: true }
  ]

  const currentList = 
    activeLeague === 'IRON_LIFTER' ? ironLifterUsers :
    activeLeague === 'STREAK' ? streakUsers : burnUsers

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Holographic Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gold/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-red-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/community" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Return to Community
            </Link>
            <h1 className="text-4xl font-heading font-black tracking-tight uppercase flex items-center gap-3">
              <Trophy className="w-10 h-10 text-gold animate-bounce" />
              Giải Đấu Đua Top Cộng Đồng (Leagues)
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Thi đấu cùng hàng ngàn chiến binh Forge AI. Đua top tháng 7 để rinh Cúp & 1 năm VIP Pro!
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gold/10 border border-gold/30 text-gold text-xs font-black uppercase tracking-widest">
            <Award className="w-4 h-4" /> Season 12 - Live
          </div>
        </div>

        {/* League Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'IRON_LIFTER', name: 'Iron Lifter League', desc: 'Đua tổng khối lượng nâng tạ', icon: Dumbbell, color: 'from-gold to-orange-500' },
            { id: 'STREAK', name: 'Consistency King', desc: 'Đua chuỗi ngày tập liên tục', icon: Trophy, color: 'from-red-500 to-orange-600' },
            { id: 'BURN', name: 'Burn Master', desc: 'Đua tổng Kcal tiêu hao', icon: Flame, color: 'from-amber-500 to-yellow-400' }
          ].map(league => (
            <button
              key={league.id}
              onClick={() => setActiveLeague(league.id as any)}
              className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                activeLeague === league.id 
                  ? 'glass-card border-gold shadow-[0_0_30px_rgba(212,175,106,0.25)]' 
                  : 'glass-card border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${league.color} flex items-center justify-center text-black font-black shadow-lg`}>
                  <league.icon className="w-6 h-6" />
                </div>
                {activeLeague === league.id && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/40">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-heading font-black text-lg text-white uppercase">{league.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{league.desc}</p>
            </button>
          ))}
        </div>

        {/* Podium Top 3 */}
        <div className="grid grid-cols-3 gap-4 pt-4 items-end">
          {/* Rank 2 */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-3xl border-white/10 text-center space-y-2 relative order-1 sm:order-1">
            <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-black text-xl mx-auto shadow-md">
              🥈 2
            </div>
            <div className="text-3xl">{currentList[1]?.avatar}</div>
            <div className="font-heading font-bold text-white text-sm">{currentList[1]?.displayName}</div>
            <div className="font-mono text-xs font-black text-gold">{currentList[1]?.score}</div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-8 rounded-3xl border-gold/50 bg-gold/10 text-center space-y-3 relative order-2 sm:order-2 shadow-[0_0_40px_rgba(212,175,106,0.3)] -translate-y-4">
            <div className="w-14 h-14 rounded-full bg-gradient-gold text-black flex items-center justify-center font-black text-2xl mx-auto shadow-xl">
              👑 1
            </div>
            <div className="text-4xl">{currentList[0]?.avatar}</div>
            <div className="font-heading font-black text-white text-base tracking-wide uppercase">{currentList[0]?.displayName}</div>
            <div className="font-mono text-sm font-black text-gold">{currentList[0]?.score}</div>
            <div className="inline-block px-3 py-1 rounded-full bg-gold/20 text-gold text-[10px] font-black uppercase tracking-widest border border-gold/40">
              CHAMPION
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-3xl border-white/10 text-center space-y-2 relative order-3 sm:order-3">
            <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-black text-xl mx-auto shadow-md">
              🥉 3
            </div>
            <div className="text-3xl">{currentList[2]?.avatar}</div>
            <div className="font-heading font-bold text-white text-sm">{currentList[2]?.displayName}</div>
            <div className="font-mono text-xs font-black text-gold">{currentList[2]?.score}</div>
          </motion.div>
        </div>

        {/* Full Leaderboard Table */}
        <div className="glass-card rounded-3xl overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-heading font-black text-lg uppercase text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" /> Bảng Xếp Hạng Chi Tiết
            </h3>
            <span className="text-xs text-muted-foreground font-bold">Cập nhật mỗi 5 phút</span>
          </div>

          <div className="divide-y divide-white/5 font-medium">
            {currentList.map(user => (
              <div 
                key={user.rank}
                className={`p-4 sm:p-6 flex items-center justify-between transition-all ${
                  user.isCurrentUser 
                    ? 'bg-gold/10 border-l-4 border-l-gold' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                    user.rank === 1 ? 'bg-gold text-black' :
                    user.rank === 2 ? 'bg-slate-300 text-black' :
                    user.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'
                  }`}>
                    #{user.rank}
                  </span>

                  <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-lg">
                    {user.avatar}
                  </div>

                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {user.displayName}
                      {user.isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[9px] font-black uppercase">YOU</span>
                      )}
                    </div>
                    {user.badge && (
                      <span className="text-[10px] font-black text-gold uppercase tracking-widest">{user.badge}</span>
                    )}
                  </div>
                </div>

                <div className="font-mono font-black text-gold text-base">{user.score}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
