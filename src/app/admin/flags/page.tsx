'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flag, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function FeatureFlagsCMS() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFlags()
  }, [])

  async function loadFlags() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('feature_flags').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setFlags(data || [])
    } catch (e) {
      toast.error('Failed to load feature flags')
    }
    setLoading(false)
  }

  async function toggleFlag(id: string, currentVal: boolean) {
    try {
      const { error } = await supabase.from('feature_flags').update({ is_active: !currentVal }).eq('id', id)
      if (error) throw error
      toast.success('Flag updated')
      loadFlags()
    } catch (e) {
      toast.error('Failed to update flag')
    }
  }

  async function updateRule(id: string, field: string, value: string) {
    try {
      const { error } = await supabase.from('feature_flags').update({ [field]: value }).eq('id', id)
      if (error) throw error
      toast.success('Rule updated')
      loadFlags()
    } catch (e) {
      toast.error('Failed to update rule')
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="w-6 h-6 text-red-500" /> Feature Flags Engine
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {flags.map((flag) => (
            <motion.div 
              key={flag.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg font-mono text-red-500 mb-1">{flag.key}</h3>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>
                <button 
                  onClick={() => toggleFlag(flag.id, flag.is_active)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-bold ${
                    flag.is_active ? 'bg-red-500 text-white' : 'bg-white/10 text-muted-foreground hover:bg-white/20'
                  }`}
                >
                  {flag.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {flag.is_active ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Rule Type</label>
                  <Select 
                    value={flag.rule_type}
                    onValueChange={(val) => updateRule(flag.id, 'rule_type', val)}
                  >
                    <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-red-500 outline-none h-[38px] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border border-white/10 text-white rounded-xl shadow-2xl">
                      <SelectItem value="none" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">None (Off for all)</SelectItem>
                      <SelectItem value="all" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">All (On for all)</SelectItem>
                      <SelectItem value="pro" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">Pro Tier Only</SelectItem>
                      <SelectItem value="percent" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2 px-4">Percentage of Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {flag.rule_type === 'percent' && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Percentage (%)</label>
                    <input 
                      type="number"
                      value={flag.rule_value || ''}
                      onBlur={(e) => updateRule(flag.id, 'rule_value', e.target.value)}
                      onChange={() => {}} 
                      placeholder="e.g. 50"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {flags.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No feature flags configured yet. Insert them via database.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
