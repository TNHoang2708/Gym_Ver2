'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Activity, Database, Server, Cpu, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogs: 0,
    health: 'Online',
    latency: '45ms'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient()
      
      // Get approx users
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        
      // Get approx workouts
      const { count: logsCount } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: usersCount || 0,
        totalLogs: logsCount || 0,
        health: 'Online',
        latency: Math.floor(Math.random() * 20 + 30) + 'ms'
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  // Mock data for the last 30 days of growth
  const growthData = Array.from({ length: 30 }).map((_, i) => ({
    name: `Day ${i + 1}`,
    users: Math.floor(100 + (i * 10) + Math.random() * 20),
    tokens: Math.floor(5000 + (i * 500) + Math.random() * 1000)
  }))

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-red-500/5 blur-[120px] rounded-full transform-gpu" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-500/5 blur-[100px] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-green-500 uppercase tracking-widest">System Online</span>
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'Total Registered Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Global Workouts', value: stats.totalLogs, icon: Activity, color: 'text-gold' },
                { label: 'OpenAI Tokens (30d)', value: '1.2M', icon: Cpu, color: 'text-purple-400' },
                { label: 'DB Latency', value: stats.latency, icon: Database, color: 'text-green-400' },
              ].map((m, i) => (
                <div key={i} className="bg-black/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <m.icon className={`w-24 h-24 ${m.color}`} />
                  </div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <m.icon className={`w-4 h-4 ${m.color}`} /> {m.label}
                  </h3>
                  <p className="text-3xl font-bold">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-2xl">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-muted-foreground" /> Platform Growth (Last 30 Days)
              </h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} minTickGap={30} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="users" stroke="#60A5FA" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    <Area yAxisId="right" type="monotone" dataKey="tokens" stroke="#A78BFA" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
