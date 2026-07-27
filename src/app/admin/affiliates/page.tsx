'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Share2, Plus, Users, TrendingUp, Gift, ArrowLeft, Copy, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface AffiliateCode {
  id: string
  code: string
  owner: string
  discount_pct: number
  uses_count: number
  revenue_generated: number
  commission_earned: number
}

export default function AffiliateAdminPage() {
  const [affiliates, setAffiliates] = useState<AffiliateCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form states
  const [newCode, setNewCode] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [discountPct, setDiscountPct] = useState('20')
  const [creating, setCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchAffiliates()
  }, [])

  async function fetchAffiliates() {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliates')
      if (res.ok) {
        const json = await res.json()
        setAffiliates(json.affiliates || [])
      }
    } catch (err) {
      toast.error('Failed to load affiliate codes')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode || !newOwner) return

    setCreating(true)
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          owner: newOwner,
          discount_pct: parseInt(discountPct) || 20
        })
      })

      if (res.ok) {
        toast.success(`Affiliate Code ${newCode.toUpperCase()} Created! 🚀`)
        setShowModal(false)
        setNewCode('')
        setNewOwner('')
        fetchAffiliates()
      } else {
        toast.error('Failed to create affiliate code')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setCreating(false)
    }
  }

  function handleCopyLink(code: string) {
    const link = `${window.location.origin}/register?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopiedCode(code)
    toast.success(`Referral link copied: ${link}`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const totalRevenue = affiliates.reduce((acc, a) => acc + (a.revenue_generated || 0), 0)
  const totalUses = affiliates.reduce((acc, a) => acc + (a.uses_count || 0), 0)
  const totalCommission = affiliates.reduce((acc, a) => acc + (a.commission_earned || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gold/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-red-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Return to Admin Console
            </Link>
            <h1 className="text-4xl font-heading font-black tracking-tight uppercase flex items-center gap-3">
              <DollarSign className="w-10 h-10 text-gold" />
              Hệ Thống Đa Cấp & Affiliate Hub
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Quản lý mã giới thiệu KOL, theo dõi chuyển đổi doanh thu và chia hoa hồng bán gói VIP Pro.
            </p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto px-6 py-3.5 rounded-2xl bg-gradient-gold text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_25px_rgba(212,175,106,0.4)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Tạo Mã Affiliate Mới
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-card p-6 rounded-3xl border-gold/20 bg-gold/5 relative overflow-hidden">
            <span className="text-xs font-black uppercase tracking-widest text-gold block mb-1">Total Revenue Generated</span>
            <div className="text-4xl font-heading font-black text-white">${totalRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">From referral conversion upgrades</p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-white/10 relative overflow-hidden">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1">Total Uses / Conversions</span>
            <div className="text-4xl font-heading font-black text-gold">{totalUses}</div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Successful VIP registrations</p>
          </div>

          <div className="glass-card p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">Total Payouts / Commission</span>
            <div className="text-4xl font-heading font-black text-emerald-400">${totalCommission.toLocaleString()}</div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Earned by KOLs & Partners</p>
          </div>
        </div>

        {/* Affiliate Codes Table */}
        <div className="glass-card rounded-3xl overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-heading font-black uppercase text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-gold" /> Danh Sách Mã Affiliate Đang Chạy
            </h3>
            <span className="text-xs text-muted-foreground font-bold">{affiliates.length} active codes</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading affiliate codes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="p-4 pl-6">Mã Coupon</th>
                    <th className="p-4">Chủ Sở Hữu / KOL</th>
                    <th className="p-4">Giảm Giá</th>
                    <th className="p-4">Lượt Dùng</th>
                    <th className="p-4">Doanh Thu</th>
                    <th className="p-4">Hoa Hồng (20%)</th>
                    <th className="p-4 text-right pr-6">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {affiliates.map(aff => (
                    <tr key={aff.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6">
                        <span className="font-mono font-black text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-xl text-xs">
                          {aff.code}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white">{aff.owner}</td>
                      <td className="p-4 text-xs font-bold text-emerald-400">-{aff.discount_pct}% OFF</td>
                      <td className="p-4 text-xs font-bold text-white">{aff.uses_count} uses</td>
                      <td className="p-4 font-bold text-white">${aff.revenue_generated || 0}</td>
                      <td className="p-4 font-bold text-gold">${aff.commission_earned || 0}</td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => handleCopyLink(aff.code)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all inline-flex items-center gap-1.5"
                        >
                          {copiedCode === aff.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Link
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

      {/* Modal create affiliate code */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md glass-card p-8 rounded-3xl border-white/20 shadow-2xl space-y-6 z-10"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-2xl font-heading font-black uppercase text-white">Tạo Mã Affiliate Mới</h3>
                <p className="text-xs text-muted-foreground mt-1">Cấp mã giảm giá riêng cho KOL hoặc đối tác tiếp thị.</p>
              </div>

              <form onSubmit={handleCreateCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tên Mã Code (VD: GYMGOD20)</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="FORGE20"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono uppercase focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Chủ Sở Hữu / Tên KOL</label>
                  <input
                    type="text"
                    required
                    value={newOwner}
                    onChange={e => setNewOwner(e.target.value)}
                    placeholder="VD: Coach Duy Nguyễn"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">% Giảm Giá Cho Khách</label>
                  <input
                    type="number"
                    value={discountPct}
                    onChange={e => setDiscountPct(e.target.value)}
                    placeholder="20"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white font-bold text-center focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3.5 bg-gradient-gold text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    {creating ? 'Creating...' : 'Tạo Mã Ngay'}
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
