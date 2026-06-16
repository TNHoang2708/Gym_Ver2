'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Trophy, Medal, ArrowUpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_volume_kg: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<{rank: number, entry: LeaderboardEntry} | null>(null)

  useEffect(() => {
    async function loadLeaderboard() {
      const supabase = createClient()
      
      const { data: userResponse } = await supabase.auth.getUser()
      const currentUser = userResponse.user
      
      // Fetch from the view
      const { data, error } = await supabase
        .from('global_leaderboard_view')
        .select('*')
        .order('total_volume_kg', { ascending: false })
        .limit(50)
        
      if (!error && data) {
        setLeaders(data as LeaderboardEntry[])
        
        if (currentUser) {
          const rankIndex = data.findIndex(d => d.user_id === currentUser.id)
          if (rankIndex !== -1) {
            setMyRank({ rank: rankIndex + 1, entry: data[rankIndex] as LeaderboardEntry })
          }
        }
      }
      setLoading(false)
    }
    
    loadLeaderboard()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]'
    if (index === 1) return 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]'
    if (index === 2) return 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]'
    return 'text-gold/50'
  }

  return (
    <div className="min-h-screen pb-24 pt-8 px-4 max-w-3xl mx-auto relative">
      {/* Ambient Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-gold/5 blur-[120px] rounded-full transform-gpu pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-20%] w-[40vw] h-[40vw] bg-gold/5 blur-[100px] rounded-full transform-gpu pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4 border border-gold/20">
          <Trophy className="w-8 h-8 text-gold" />
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground">Global <span className="text-gradient-gold">Leaderboard</span></h1>
        <p className="text-muted-foreground mt-2">Ranked by Total Volume Lifted (kg)</p>
      </motion.div>

      {/* Leaderboard List */}
      <div className="space-y-3 relative z-10 mb-8">
        {leaders.map((leader, index) => (
          <motion.div 
            key={leader.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-card p-5 rounded-2xl flex items-center justify-between ${
              myRank?.rank === index + 1 ? 'ring-1 ring-gold bg-gold/5' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {index < 3 ? (
                  <Medal className={`w-7 h-7 ${getMedalColor(index)}`} />
                ) : (
                  <span className="font-bold text-muted-foreground">#{index + 1}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  {leader.display_name} 
                  {myRank?.rank === index + 1 && <span className="text-[10px] uppercase bg-gold text-gold-foreground px-2 py-0.5 rounded-full font-bold">You</span>}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gold text-xl">{leader.total_volume_kg.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">KG</p>
            </div>
          </motion.div>
        ))}
        
        {leaders.length === 0 && (
          <div className="text-center p-12 glass-card rounded-[2rem]">
            <p className="text-muted-foreground">No workouts logged yet. Be the first to lift!</p>
          </div>
        )}
      </div>

      {/* Floating Personal Rank */}
      {myRank && myRank.rank > 5 && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20"
        >
          <div className="glass-card p-4 rounded-full border-gold/30 glow-gold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-6 h-6 text-gold" />
              <span className="font-bold">Your Rank: #{myRank.rank}</span>
            </div>
            <div className="font-bold text-gold">
              {myRank.entry.total_volume_kg.toLocaleString()} KG
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
