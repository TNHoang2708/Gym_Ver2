'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, XCircle, AlertCircle, Trash2, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Feedback {
  id: string
  user_id: string
  email: string
  rating: number
  message: string
  status: 'open' | 'resolved' | 'ignored'
  type: 'bug' | 'feature' | 'other'
  created_at: string
}

export default function FeedbackInbox() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open')

  useEffect(() => {
    loadFeedbacks()
  }, [])

  async function loadFeedbacks() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feedback')
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data.feedbacks || [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: 'resolved' | 'ignored' | 'open') {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (!res.ok) throw new Error('Failed to update status')

      toast.success(`Marked as ${status}`)
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    } catch (error) {
      console.error(error)
      toast.error('Failed to update status')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-400" /> Feedback Inbox
        </h1>
        
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {(['open', 'resolved', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-white/10 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredFeedbacks.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-2xl border transition-colors ${
                  f.status === 'resolved' 
                    ? 'bg-green-500/5 border-green-500/10' 
                    : f.status === 'ignored'
                    ? 'bg-white/5 border-white/5 opacity-50'
                    : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{f.email}</span>
                      <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
                      {f.type === 'bug' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30">Bug</span>}
                      {f.type === 'feature' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Feature</span>}
                      {f.type === 'other' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-muted-foreground border border-white/20">Other</span>}
                      
                      <div className="flex text-red-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < f.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{f.message}</p>
                  </div>

                  <div className="flex items-center gap-2 md:flex-col md:w-32shrink-0">
                    {f.status !== 'resolved' && (
                      <button 
                        disabled={processingId === f.id}
                        onClick={() => updateStatus(f.id, 'resolved')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl transition-colors border border-green-500/20 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Resolve
                      </button>
                    )}
                    {f.status !== 'ignored' && f.status !== 'resolved' && (
                      <button 
                        disabled={processingId === f.id}
                        onClick={() => updateStatus(f.id, 'ignored')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-muted-foreground rounded-xl transition-colors border border-white/10 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Ignore
                      </button>
                    )}
                    {f.status !== 'open' && (
                      <button 
                        disabled={processingId === f.id}
                        onClick={() => updateStatus(f.id, 'open')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl transition-colors border border-orange-500/20 disabled:opacity-50"
                      >
                        <AlertCircle className="w-4 h-4" /> Re-open
                      </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors border border-blue-500/20">
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredFeedbacks.length === 0 && (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No {filter} feedback found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
