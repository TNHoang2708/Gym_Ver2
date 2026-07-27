'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Activity, DollarSign, Server, Cpu, Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalLogs: 0, totalCost: 0 })
  const [loading, setLoading] = useState(true)
  const [chartTokens, setChartTokens] = useState<any[]>([])
  const [dauData, setDauData] = useState<any[]>([])
  const [topExercises, setTopExercises] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setChartTokens(statsData.chartTokens)
        setDauData(statsData.dauData)
        setTopExercises(statsData.topExercises || [])
      }
    } catch (error) {
      console.error('Failed to load analytics', error)
      toast.error('Failed to load Analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground animate-pulse">Gathering intelligence...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Activity className="w-6 h-6 text-red-500" /> Analytics Overview
      </h1>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Metric Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'Total Registered', value: stats.totalUsers, icon: Users, color: 'text-red-500' },
            { label: 'Total Workouts', value: stats.totalLogs, icon: Activity, color: 'text-red-500' },
            { label: 'Total API Cost', value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, color: 'text-red-500' },
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
          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
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
          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
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
                  No telemetry data yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Exercises */}
        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-red-500" /> Trending Exercises (Top 5)
          </h2>
          <div className="h-[250px] w-full">
            {topExercises.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topExercises} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontSize: 12 }} width={120} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                  <Bar dataKey="count" fill="#4ADE80" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No exercises logged yet.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
