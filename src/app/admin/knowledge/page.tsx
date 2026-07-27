'use client'

import { useState, useEffect } from 'react'
import { Brain, Plus, ArrowLeft, BookOpen, Sparkles, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface KnowledgeItem {
  id: string
  title: string
  category: string
  content: string
  created_at: string
}

export default function KnowledgeAdminPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('WORKOUT_SCIENCE')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchKnowledge()
  }, [])

  async function fetchKnowledge() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/knowledge')
      if (res.ok) {
        const json = await res.json()
        setItems(json.items || [])
      }
    } catch (err) {
      toast.error('Failed to load knowledge base')
    } finally {
      setLoading(false)
    }
  }

  async function handleInjectKnowledge(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !content) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, content })
      })

      if (res.ok) {
        toast.success('Đã nạp kiến thức mới vào não AI Coach thành công! 🧠')
        setShowModal(false)
        setTitle('')
        setContent('')
        fetchKnowledge()
      } else {
        toast.error('Lỗi khi nạp kiến thức')
      }
    } catch (err) {
      toast.error('Lỗi mạng')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Holographic Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gold/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-red-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Return to Admin Console
            </Link>
            <h1 className="text-4xl font-heading font-black tracking-tight uppercase flex items-center gap-3">
              <Brain className="w-10 h-10 text-gold" />
              Bơm Não AI Knowledge Injection
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Nạp thêm sách giáo khoa, nghiên cứu y học fitness và quy tắc riêng vào bộ nhớ AI Coach.
            </p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto px-6 py-3.5 rounded-2xl bg-gradient-gold text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_25px_rgba(212,175,106,0.4)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Nạp Kiến Thức Mới
          </button>
        </div>

        {/* Knowledge Base Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Đang tải tri thức AI...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => (
              <div key={item.id} className="glass-card p-6 rounded-3xl border-white/10 shadow-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/40">
                    {item.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-heading font-black uppercase text-white">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5 line-clamp-4">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Inject Knowledge */}
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
              className="relative w-full max-w-lg glass-card p-8 rounded-3xl border-white/20 shadow-2xl space-y-6 z-10"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-2xl font-heading font-black uppercase text-white">Nạp Dữ Liệu Kiến Thức AI</h3>
                <p className="text-xs text-muted-foreground mt-1">Dữ liệu này sẽ được tiêm trực tiếp vào não của AI Coach.</p>
              </div>

              <form onSubmit={handleInjectKnowledge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tiêu Đề Dữ Liệu</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: Nguyên lý Progressive Overload 2026"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Danh Mục</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="WORKOUT_SCIENCE">Nghiên Cứu Tập Luyện</option>
                    <option value="NUTRITION">Dinh Dưỡng & Macro</option>
                    <option value="SUPPLEMENTS">Thực Phẩm Bổ Sung</option>
                    <option value="RULES">Quy Tắc Server</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Nội Dung Chi Tiết</label>
                  <textarea
                    required
                    rows={5}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Dán nội dung sách, bài viết nghiên cứu hoặc quy tắc tại đây..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-gold/50 resize-none"
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
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-gradient-gold text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Injecting...' : 'Nạp Vào Não AI'}
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
