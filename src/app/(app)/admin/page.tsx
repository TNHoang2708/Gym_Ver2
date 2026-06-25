'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Shield, Clock, Activity, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface OnlineUser {
  user_id: string
  email: string
  online_at: string
}

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Check if user_roles exists and if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleError || roleData?.role !== 'admin') {
        toast.error('Unauthorized access. Admins only.')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)

      // Fetch all users (Admins have RLS bypass in 015_admin_dashboard.sql)
      const { data: users, error: usersError } = await supabase
        .from('user_memory')
        .select('user_id, display_name, created_at, session_meta')
        .order('created_at', { ascending: false })

      if (!usersError && users) {
        setAllUsers(users)
      }

      // Track online users via Realtime
      const channel = supabase.channel('online-users')
      
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const online: OnlineUser[] = []
        for (const id in state) {
          // @ts-ignore
          online.push(...state[id])
        }
        setOnlineUsers(online)
      })
      
      channel.subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load admin panel')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-[100dvh] pb-24 pt-6 px-4 max-w-4xl mx-auto relative overflow-x-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.1)_0%,transparent_70%)] pointer-events-none z-0" />
      
      <div className="relative z-10 mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to App
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center border border-gold/30">
            <Shield className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">Admin Headquarters</h1>
            <p className="text-muted-foreground">Real-time oversight and user management.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="glass-card p-4 rounded-2xl border-white/5 bg-black/40 backdrop-blur-md">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Total Users</p>
          <p className="text-3xl font-black text-white">{allUsers.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border-gold/30 bg-gold/5 backdrop-blur-md glow-gold-sm">
          <p className="text-xs text-gold uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online Now
          </p>
          <p className="text-3xl font-black text-gold">{onlineUsers.length}</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-black/40 backdrop-blur-md">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" /> Live Activity Feed
          </h3>
          
          {onlineUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm italic py-4 text-center">No users are currently online.</p>
          ) : (
            <div className="space-y-3">
              {onlineUsers.map(ou => {
                const userMemory = allUsers.find(u => u.user_id === ou.user_id)
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={ou.user_id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10">
                          {userMemory?.display_name ? userMemory.display_name.charAt(0).toUpperCase() : <Users className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{userMemory?.display_name || ou.email || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Joined {new Date(ou.online_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">Active</div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-black/40 backdrop-blur-md">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" /> All Registered Users
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Name</th>
                  <th className="px-4 py-3">Registered At</th>
                  <th className="px-4 py-3 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUsers.map(user => {
                  const isOnline = onlineUsers.some(ou => ou.user_id === user.user_id)
                  return (
                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-bold text-white">{user.display_name || 'Boss'}</td>
                      <td className="px-4 py-4 text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        {isOnline ? (
                          <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Offline</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
