'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Sparkles, Send, RefreshCw, Search, ArrowLeft, Filter, Flame, Gift, Bell } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ChurnUser } from '@/lib/retention-engine'

export default function ChurnRadarPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    highRiskCount: number
    mediumRiskCount: number
    lowRiskCount: number
    users: ChurnUser[]
  }>({ highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, users: [] })

  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<ChurnUser | null>(null)
  const [campaignType, setCampaignType] = useState<'WINBACK_DISCOUNT' | 'MOTIVATION_NUDGE' | 'STREAK_WARNING'>('WINBACK_DISCOUNT')
  const [customMsg, setCustomMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchChurnData()
  }, [])

  async function fetchChurnData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/churn')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error('Failed to load Churn Radar data')
      }
    } catch (err) {
      toast.error('Network error loading churn data')
    } finally {
      setLoading(false)
    }
  }

  async function handleTriggerCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/churn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          actionType: campaignType,
          customMessage: customMsg
        })
      })

      if (res.ok) {
        toast.success(`Win-back campaign launched for ${selectedUser.displayName}! 🔥`)
        setSelectedUser(null)
        setCustomMsg('')
      } else {
        toast.error('Failed to send win-back campaign')
      }
    } catch (err) {
      toast.error('Error triggering campaign')
    } finally {
      setSending(false)
    }
  }

  const filteredUsers = data.users.filter(u => {
    const matchesFilter = filterRisk === 'ALL' || u.riskLevel === filterRisk
    const matchesQuery = u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesQuery
  })

  const totalUsers = data.users.length
  const avgEngagement = totalUsers > 0 
    ? Math.round(data.users.reduce((acc, curr) => acc + curr.engagementScore, 0) / totalUsers)
    : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Holographic Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-gold/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Return to Admin Console
            </Link>
            <h1 className="text-4xl font-heading font-black tracking-tight uppercase flex items-center gap-3">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
              Radar Dự Báo Churn & Retention
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              AI soi Data real-time để dự đoán tỷ lệ rời bỏ app và kích hoạt kịch bản níu chân khách hàng.
            </p>
          </div>

          <button 
            onClick={fetchChurnData}
            disabled={loading}
            className="self-start md:self-auto px-5 py-3 rounded-2xl glass-card border border-white/10 hover:border-gold/50 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gold ${loading ? 'animate-spin' : ''}`} />
            Refresh Radar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-6 rounded-3xl border-red-500/20 bg-red-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-red-400">High Churn Risk</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-4xl font-heading font-black text-red-500">{data.highRiskCount}</div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Inactivity &gt; 5 days or low score</p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Medium Risk</span>
              <Flame className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-4xl font-heading font-black text-yellow-400">{data.mediumRiskCount}</div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Missing logs 3-4 days</p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Active / Low Risk</span>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-4xl font-heading font-black text-emerald-400">{data.lowRiskCount}</div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">High workout & nutrition logs</p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-gold/20 bg-gold/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-gold">Avg Engagement</span>
              <div className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
            </div>
            <div className="text-4xl font-heading font-black text-gold">{avgEngagement}<span className="text-lg">/100</span></div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Server-wide active score</p>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="glass-card p-4 rounded-2xl border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-4 h-4 text-muted-foreground mr-1 shrink-0" />
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilterRisk(level)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filterRisk === level 
                    ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,106,0.4)]'
                    : 'bg-white/5 border border-white/10 text-muted-foreground hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card rounded-3xl overflow-hidden border-white/10 shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Scanning user retention metrics...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No users matching the current filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="p-4 pl-6">User</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4">14d Workouts</th>
                    <th className="p-4">Engagement Score</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredUsers.map(user => (
                    <tr key={user.userId} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-4 text-xs">
                        {user.lastActiveDays === 0 ? (
                          <span className="text-emerald-400 font-bold">Today</span>
                        ) : (
                          <span className={user.lastActiveDays >= 5 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>
                            {user.lastActiveDays} days ago
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-bold text-white">
                        {user.workoutCountLast14Days} sessions
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 w-36">
                          <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                            <div 
                              className={`h-full rounded-full ${
                                user.engagementScore < 40 ? 'bg-red-500' : user.engagementScore < 70 ? 'bg-yellow-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${user.engagementScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-black font-mono">{user.engagementScore}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          user.riskLevel === 'HIGH' 
                            ? 'bg-red-500/10 border-red-500/40 text-red-400' 
                            : user.riskLevel === 'MEDIUM' 
                            ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' 
                            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        }`}>
                          {user.riskLevel}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ml-auto"
                        >
                          <Send className="w-3.5 h-3.5" /> Win-Back
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Win-Back Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg glass-card p-8 rounded-3xl border-white/20 shadow-2xl space-y-6 z-10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-heading font-black uppercase text-white">Kích Hoạt Kịch Bản Retention</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Target: <strong className="text-gold">{selectedUser.displayName}</strong> ({selectedUser.email})</p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                  Risk: {selectedUser.riskLevel}
                </span>
              </div>

              <form onSubmit={handleTriggerCampaign} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Loại Kịch Bản Win-Back</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'WINBACK_DISCOUNT', label: 'Offer 20% Pro', icon: Gift },
                      { id: 'MOTIVATION_NUDGE', label: 'Dọa dẫm AI', icon: Flame },
                      { id: 'STREAK_WARNING', label: 'Cứu Streak', icon: Bell }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setCampaignType(type.id as any)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          campaignType === type.id 
                            ? 'bg-gold/20 border-gold text-gold shadow-[0_0_15px_rgba(212,175,106,0.3)]'
                            : 'bg-black/40 border-white/10 text-muted-foreground hover:text-white'
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tin nhắn tùy chỉnh (Optional)</label>
                  <textarea
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    placeholder="VD: Sếp ơi, lâu rồi không thấy tập! Nhập mã REFORGE20 nhận ngay 20% giảm giá Pro nhé."
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-3 bg-gradient-fire text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 glow-red"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Launch Campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
