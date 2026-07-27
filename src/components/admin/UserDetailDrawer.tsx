'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Crown, Zap, Ghost } from 'lucide-react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserDetailDrawerProps {
  user: any
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function UserDetailDrawer({ user, isOpen, onClose, onRefresh }: UserDetailDrawerProps) {
  const [xp, setXp] = useState<number | null>(null)
  const [streak, setStreak] = useState<number | null>(null)
  const [tier, setTier] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentXp = xp ?? user?.xp_points ?? 0
  const currentStreak = streak ?? user?.streak_days ?? 0
  const currentTier = tier ?? user?.subscription_tier ?? 'free'

  async function handleUpdate(action: string, value: any) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/gamification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, value })
      })

      if (!res.ok) throw new Error('Failed to update')
      
      toast.success('User updated successfully')
      onRefresh()
    } catch (e) {
      toast.error('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  function handleImpersonate() {
    if (!window.confirm(`Are you sure you want to impersonate ${user.email}?`)) return
    
    // Set cookie for 1 hour
    Cookies.set('impersonate_user_id', user.id, { expires: 1/24 })
    Cookies.set('impersonate_user_email', user.email, { expires: 1/24 })
    toast.success(`Now impersonating ${user.email}`)
    
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }

  return (
    <AnimatePresence>
      {isOpen && user && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold font-heading">Thao Túng User</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8">
              <p className="text-muted-foreground text-sm">User Email</p>
              <p className="font-bold text-red-500">{user.email}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{user.id}</p>
            </div>

            {/* Impersonation */}
            <div className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
              <h3 className="font-bold text-red-500 flex items-center gap-2 mb-2">
                <Ghost className="w-5 h-5" /> Nhập Hồn (Impersonate)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Đăng nhập vào hệ thống dưới thân phận của user này để kiểm tra lỗi.
              </p>
              <button 
                onClick={handleImpersonate}
                className="w-full py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Ghost className="w-4 h-4" /> Bắt Đầu Nhập Hồn
              </button>
            </div>

            {/* VIP Status */}
            <div className="mb-8 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-red-500" /> Cấp VIP Thủ Công
              </h3>
              <div className="flex gap-2">
                <Select value={tier} onValueChange={(val) => val && setTier(val as string)}>
                  <SelectTrigger className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-red-500 outline-none h-[38px] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border border-white/10 text-white rounded-xl shadow-2xl">
                    <SelectItem value="free" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">Free</SelectItem>
                    <SelectItem value="pro" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">Pro Tier</SelectItem>
                    <SelectItem value="god" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">God Tier</SelectItem>
                  </SelectContent>
                </Select>
                <button 
                  disabled={loading}
                  onClick={() => handleUpdate('set_vip', tier)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gamification */}
            <div className="space-y-6">
              <h3 className="font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-500" /> Bàn Tay Chúa
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">XP Points</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={xp === null ? '' : xp}
                    onChange={e => setXp(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button 
                    disabled={loading}
                    onClick={() => handleUpdate('update_xp', xp || 0)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Streak Days</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={streak === null ? '' : streak}
                    onChange={e => setStreak(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button 
                    disabled={loading}
                    onClick={() => handleUpdate('update_streak', streak || 0)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
