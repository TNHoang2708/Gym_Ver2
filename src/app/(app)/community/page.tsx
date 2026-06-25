'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Heart, MessageCircle, Flame, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import PullToRefresh from '@/components/PullToRefresh'

export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          ai_summary,
          volume_lifted,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to load community feed')
    } finally {
      setLoading(false)
    }
  }

  const handleFistBump = async (postId: string) => {
    toast.success('Fist bump sent!', { icon: '👊' })
    // In a real app, you would insert into post_likes here
    // and update the optimistic UI state
  }

  return (
    <PullToRefresh onRefresh={fetchPosts}>
      <div className="min-h-screen pb-24 pt-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-gold" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Global Feed & Challenges</p>
        </div>
      </div>

      {/* Global Challenge Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 mb-8 border-gold/30 glow-gold relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] pointer-events-none rounded-full" />
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gold/10">
            <Flame className="w-5 h-5 text-gold" />
          </div>
          <h3 className="font-bold text-lg">Global Weekly Challenge</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          The community goal is to collectively lift <span className="font-mono text-gold font-bold">1,000,000 lbs</span> this week. Let's get it!
        </p>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '45%' }}
            className="h-full bg-gold rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs mt-2 text-muted-foreground font-mono">
          <span>450,320 lbs</span>
          <span>1M lbs</span>
        </div>
      </motion.div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-10 glass-card rounded-3xl">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">It's quiet in here... go crush a workout and share it!</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-3xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold to-orange-500 flex items-center justify-center text-black font-bold font-heading">
                    {post.user_id.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Forge Athlete</h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-1.5">
                  <Dumbbell className="w-3 h-3 text-gold" />
                  <span className="text-xs font-mono font-bold text-gold">{post.volume_lifted.toLocaleString()} lbs</span>
                </div>
              </div>
              
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-4">
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{post.ai_summary}"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleFistBump(post.id)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5"
                >
                  <span className="text-lg">👊</span> 
                  <span className="text-xs font-bold text-muted-foreground">Fist Bump</span>
                </button>
                <button className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground">Comment</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      </div>
    </PullToRefresh>
  )
}
