'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Activity, DollarSign, Power, ShieldCheck, Server, Cpu, Trash2, Ban, CheckCircle, Search, Radio } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'

interface UserRecord {
  id: string
  created_at: string
  email?: string
  last_sign_in_at?: string
  banned_until?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalLogs: 0, totalCost: 0 })
  const [killSwitch, setKillSwitch] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [chartTokens, setChartTokens] = useState<any[]>([])
  const [dauData, setDauData] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    loadData()

    const supabase = createClient()
    const presenceChannel = supabase.channel('online-users')

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setOnlineUsers(state)
      })
      .subscribe()

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // 1. Fetch Stats from Secure API
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setChartTokens(statsData.chartTokens)
        setDauData(statsData.dauData)
      }

      // 2. Fetch Users from Secure API
      const usersRes = await fetch('/api/admin/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      // 3. Fetch Advanced Settings (AI Prompt, Announcement)
      const settingsRes = await fetch('/api/admin/settings')
      if (settingsRes.ok) {
        const sData = await settingsRes.json()
        setCustomPrompt(sData.customPrompt || '')
        setAnnouncement(sData.announcement || '')
      }

      // 4. Load Global Settings (Kill Switch & Maintenance)
      const supabase = createClient()
      const { data: settings } = await supabase.from('global_settings').select('*')
      
      if (settings) {
        const ks = settings.find(s => s.key === 'ai_kill_switch')?.value
        const mm = settings.find(s => s.key === 'maintenance_mode')?.value
        setKillSwitch(ks === true || ks === 'true')
        setMaintenanceMode(mm === true || mm === 'true')
      }
    } catch (error) {
      console.error('Failed to load admin data', error)
      toast.error('Failed to load God Mode data')
    } finally {
      setLoading(false)
    }
  }

  async function toggleSetting(key: string, currentValue: boolean, setter: (v: boolean) => void) {
    const newValue = !currentValue
    setter(newValue)
    const supabase = createClient()
    const { error } = await supabase
      .from('global_settings')
      .update({ value: newValue })
      .eq('key', key)

    if (error) {
      toast.error(`Failed to toggle ${key}`)
      setter(currentValue)
    } else {
      toast.success(`${key.replace(/_/g, ' ').toUpperCase()} is now ${newValue ? 'ON' : 'OFF'}`)
    }
  }

  async function handleUserAction(userId: string, action: 'suspend' | 'unsuspend' | 'delete') {
    if (action === 'delete') {
      const confirmDelete = window.confirm('Are you sure you want to permanently delete this user? This cannot be undone.')
      if (!confirmDelete) return
    }

    setProcessingId(userId)
    try {
      const endpoint = '/api/admin/users'
      const method = action === 'delete' ? 'DELETE' : 'PUT'
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })

      if (!res.ok) throw new Error('Action failed')
      
      toast.success(`User ${action}d successfully.`)
      loadData() // Refresh list
    } catch (error) {
      console.error(error)
      toast.error(`Failed to ${action} user.`)
    } finally {
      setProcessingId(null)
    }
  }

  async function saveAdvancedSettings(type: 'prompt' | 'announcement') {
    setSavingSettings(true)
    try {
      const payload: any = {}
      if (type === 'prompt') payload.customPrompt = customPrompt
      if (type === 'announcement') {
        payload.announcement = announcement
        payload.triggerBroadcast = true
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to save settings')
      
      toast.success(`${type === 'prompt' ? 'AI Personality' : 'Global Announcement'} updated!`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.includes(searchQuery)
  )

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(239,68,68,0.05)_0%,transparent_70%)] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(168,85,247,0.05)_0%,transparent_70%)] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-red-500" />
                God Mode Console
              </h1>
              <p className="text-sm text-muted-foreground">Global Telemetry & Administration</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => toggleSetting('maintenance_mode', maintenanceMode, setMaintenanceMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors border ${maintenanceMode ? 'bg-orange-500/20 text-orange-500 border-orange-500' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
            >
              Maintenance Mode: {maintenanceMode ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => toggleSetting('ai_kill_switch', killSwitch, setKillSwitch)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${killSwitch ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-muted-foreground hover:bg-white/20'}`}
            >
              <Power className="w-4 h-4" />
              {killSwitch ? 'AI KILL SWITCH ACTIVE' : 'Enable AI Kill Switch'}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Metric Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'Live Users Online', value: Object.keys(onlineUsers).length, icon: Radio, color: 'text-green-500' },
                { label: 'Total Registered', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Total Workouts', value: stats.totalLogs, icon: Activity, color: 'text-gold' },
                { label: 'Total API Cost', value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, color: 'text-purple-400' },
              ].map((m, i) => (
                <div key={i} className="bg-black/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <m.icon className={`w-24 h-24 ${m.color}`} />
                  </div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <m.icon className={`w-4 h-4 ${m.color}`} /> {m.label}
                  </h3>
                  <p className="text-3xl font-bold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* DAU Line Chart */}
              <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-2xl">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Server className="w-5 h-5 text-muted-foreground" /> Daily Active Users (DAU)
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dauData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                      <Area type="monotone" dataKey="users" stroke="#60A5FA" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* API Token Bar Chart */}
              <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-2xl">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" /> Daily AI Tokens Used
                </h2>
                <div className="h-[300px] w-full">
                  {chartTokens.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartTokens} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                        <Bar dataKey="tokens" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No telemetry data yet. Test the AI chat to generate data!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Control & Announcements Section */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* AI Personality Control */}
              <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-2xl flex flex-col">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" /> AI Personality Control
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Inject custom system instructions to override default AI behavior. Leave blank for default.
                </p>
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. You are an extremely aggressive military drill instructor. Always yell at the user."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold resize-none mb-4"
                />
                <div className="mt-auto flex justify-end">
                  <button
                    disabled={savingSettings}
                    onClick={() => saveAdvancedSettings('prompt')}
                    className="px-6 py-2 bg-gold text-black font-bold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Inject Prompt'}
                  </button>
                </div>
              </div>

              {/* Server Announcement */}
              <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-2xl flex flex-col">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" /> Global Announcement
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Broadcast an urgent message to all active users immediately.
                </p>
                <textarea 
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="e.g. Forge Servers will be undergoing maintenance at 2AM UTC."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none mb-4"
                />
                <div className="mt-auto flex justify-end">
                  <button
                    disabled={savingSettings}
                    onClick={() => saveAdvancedSettings('announcement')}
                    className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSettings ? 'Broadcasting...' : 'Broadcast'}
                  </button>
                </div>
              </div>
            </div>

            {/* User Management Data Table */}
            <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" /> User Management
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by email or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-separate" style={{ borderSpacing: '0 8px' }}>
                  <thead className="text-muted-foreground uppercase tracking-wider text-xs">
                    <tr>
                      <th className="pb-2 pl-5 pr-4 font-semibold">Email</th>
                      <th className="pb-2 pr-4 font-semibold">Status</th>
                      <th className="pb-2 pr-4 font-semibold">Joined / Last Active</th>
                      <th className="pb-2 pr-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredUsers.map(user => {
                        const isBanned = user.banned_until ? new Date(user.banned_until).getTime() > Date.now() : false
                        const isProcessing = processingId === user.id

                        return (
                          <motion.tr 
                            key={user.id} 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="group bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <td className="py-4 pl-5 pr-4 rounded-l-2xl border-y border-l border-white/5 group-hover:border-white/10 group-hover:border-l-gold/30">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground group-hover:text-gold transition-colors">{user.email}</p>
                                {onlineUsers[user.id] && (
                                  <span className="relative flex h-2.5 w-2.5" title="Online now">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[10px] text-muted-foreground/50 mt-0.5">{user.id}</p>
                            </td>
                            <td className="py-4 pr-4 border-y border-white/5 group-hover:border-white/10">
                              {isBanned ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                  <Ban className="w-3 h-3" /> Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                  <CheckCircle className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                            <td className="py-4 pr-4 border-y border-white/5 group-hover:border-white/10">
                              <p className="text-xs text-muted-foreground font-medium">Joined: <span className="text-foreground/80">{new Date(user.created_at).toLocaleDateString()}</span></p>
                              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Last seen: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</p>
                            </td>
                            <td className="py-4 pr-5 text-right space-x-2 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/10">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleUserAction(user.id, isBanned ? 'unsuspend' : 'suspend')}
                                className={`p-2 rounded-xl transition-all ${
                                  isBanned ? 'bg-white/5 hover:bg-white/10 text-foreground' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'
                                }`}
                                title={isBanned ? "Unsuspend User" : "Suspend User"}
                              >
                                {isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                              <button
                                disabled={isProcessing}
                                onClick={() => handleUserAction(user.id, 'delete')}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all disabled:opacity-50"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-muted-foreground bg-white/[0.01] rounded-2xl border border-white/5">
                          {users.length === 0 ? 'No users registered yet.' : 'No users match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}
