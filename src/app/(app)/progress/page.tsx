'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Plus, Loader2, ChevronLeft, ChevronRight, Scale, Activity, Trash2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { format } from 'date-fns'

interface ProgressLog {
  id: string
  log_date: string
  weight_kg: number
  photo_url: string | null
  body_fat_percent: number | null
}

export default function ProgressGalleryPage() {
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [logDate, setLogDate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compare Mode State
  const [compareMode, setCompareMode] = useState(false)
  const [beforeLog, setBeforeLog] = useState<ProgressLog | null>(null)
  const [afterLog, setAfterLog] = useState<ProgressLog | null>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLogDate(new Date().toISOString().split('T')[0])
    loadProgressLogs()
  }, [])

  async function loadProgressLogs() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .not('photo_url', 'is', null)
      .order('log_date', { ascending: false })

    if (error) {
      toast.error('Failed to load progress gallery')
    } else {
      setLogs(data as ProgressLog[])
      if (data && data.length >= 2) {
        setAfterLog(data[0]) // newest
        setBeforeLog(data[data.length - 1]) // oldest
      }
    }
    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Please select a photo')
      return
    }
    if (!weight) {
      toast.error('Please enter your weight')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('progress_photos')
        .upload(fileName, selectedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('progress_photos')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('weight_logs')
        .upsert({
          user_id: user.id,
          log_date: logDate,
          weight_kg: parseFloat(weight),
          body_fat_percent: bodyFat ? parseFloat(bodyFat) : null,
          photo_url: publicUrl
        }, { onConflict: 'user_id,log_date' })

      if (dbError) throw dbError

      toast.success('Progress saved! 🔥')
      setShowUploadModal(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setWeight('')
      setBodyFat('')
      loadProgressLogs()
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (logId: string) => {
    if (!confirm('Remove this photo from gallery? (Weight log will remain)')) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('weight_logs')
        .update({ photo_url: null })
        .eq('id', logId)

      if (error) throw error
      toast.success('Photo removed')
      setLogs(prev => prev.filter(l => l.id !== logId))
    } catch (err: any) {
      toast.error('Failed to delete photo')
    }
  }

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    let clientX = 0
    if ('touches' in e) {
      clientX = e.touches[0].clientX
    } else {
      clientX = (e as React.MouseEvent).clientX
    }
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100))
    setSliderPosition(percent)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 max-w-5xl mx-auto relative overflow-x-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] pointer-events-none z-0" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Body Transformation</h1>
          <p className="text-muted-foreground">Track your physical changes over time.</p>
        </div>
        <div className="flex items-center gap-3">
          {logs.length >= 2 && (
            <button 
              onClick={() => setCompareMode(!compareMode)}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${compareMode ? 'bg-gold text-gold-foreground glow-gold' : 'glass-card hover:bg-white/10'}`}
            >
              <Maximize2 className="w-4 h-4" />
              {compareMode ? 'Gallery View' : 'Compare View'}
            </button>
          )}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-gold text-gold-foreground rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform transform-gpu shadow-lg glow-gold"
          >
            <Camera className="w-5 h-5" />
            Add Photo
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] mt-10">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mb-6">
            <Camera className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Photos Yet</h2>
          <p className="text-muted-foreground mb-8 max-w-md">The mirror lies, but photos don't. Start taking weekly progress photos to visually track your transformation.</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-gold text-gold-foreground px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" /> First Photo
          </button>
        </div>
      ) : compareMode && beforeLog && afterLog ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Compare Controls */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-4 rounded-2xl border-white/5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 block">Before</label>
              <select 
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:border-gold outline-none"
                value={beforeLog.id}
                onChange={(e) => setBeforeLog(logs.find(l => l.id === e.target.value) || beforeLog)}
              >
                {logs.map(l => (
                  <option key={`before-${l.id}`} value={l.id}>{format(new Date(l.log_date), 'MMM d, yyyy')} ({l.weight_kg}kg)</option>
                ))}
              </select>
            </div>
            <div className="glass-card p-4 rounded-2xl border-white/5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gold mb-2 block">After</label>
              <select 
                className="w-full bg-black/40 border border-gold/30 rounded-lg p-2 text-sm focus:border-gold outline-none"
                value={afterLog.id}
                onChange={(e) => setAfterLog(logs.find(l => l.id === e.target.value) || afterLog)}
              >
                {logs.map(l => (
                  <option key={`after-${l.id}`} value={l.id}>{format(new Date(l.log_date), 'MMM d, yyyy')} ({l.weight_kg}kg)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Slider */}
          <div 
            ref={sliderRef}
            className="relative w-full aspect-[3/4] md:aspect-[4/3] rounded-[2rem] overflow-hidden select-none cursor-ew-resize border border-white/10 shadow-2xl touch-pan-y"
            onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
            onTouchMove={handleSliderMove}
            onMouseDown={handleSliderMove}
          >
            {afterLog.photo_url && (
              <Image src={afterLog.photo_url} alt="After" fill className="object-cover" draggable={false} />
            )}
            
            {beforeLog.photo_url && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                <div className="relative w-full h-full" style={{ width: sliderRef.current ? sliderRef.current.offsetWidth : '100vw' }}>
                  <Image src={beforeLog.photo_url} alt="Before" fill className="object-cover" draggable={false} />
                </div>
              </div>
            )}
            
            <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20" style={{ left: `calc(${sliderPosition}% - 2px)` }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200">
                <div className="flex gap-0.5"><ChevronLeft className="w-4 h-4 text-black" /><ChevronRight className="w-4 h-4 text-black -ml-2" /></div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none z-30 drop-shadow-md">
              <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/20">Before: {beforeLog.weight_kg}kg</span>
              <span className="bg-gold/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-black border border-gold/50">After: {afterLog.weight_kg}kg</span>
            </div>
          </div>
          
          {/* Stats difference */}
          <div className="mt-6 glass-card p-6 rounded-[2rem] flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Time Diff</p>
              <p className="text-2xl font-bold">{Math.abs(Math.round((new Date(afterLog.log_date).getTime() - new Date(beforeLog.log_date).getTime()) / (1000 * 60 * 60 * 24)))} days</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Weight Change</p>
              <p className={`text-2xl font-bold ${afterLog.weight_kg > beforeLog.weight_kg ? 'text-blue-400' : 'text-green-400'}`}>
                {(afterLog.weight_kg - beforeLog.weight_kg) > 0 ? '+' : ''}{(afterLog.weight_kg - beforeLog.weight_kg).toFixed(1)} kg
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 relative z-10"
        >
          {logs.map((log, index) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="break-inside-avoid glass-card rounded-2xl overflow-hidden group relative border border-white/5 shadow-lg"
            >
              {log.photo_url && (
                <div className="relative w-full aspect-[3/4]">
                  <Image src={log.photo_url} alt={`Progress`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <p className="text-xs text-gold font-bold mb-1">{format(new Date(log.log_date), 'MMM d, yyyy')}</p>
                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-1.5 text-white">
                        <Scale className="w-4 h-4" />
                        <span className="font-bold">{log.weight_kg}kg</span>
                      </div>
                      {log.body_fat_percent && (
                        <div className="flex items-center gap-1.5 text-white/80">
                          <Activity className="w-3 h-3" />
                          <span className="text-xs font-medium">{log.body_fat_percent}% BF</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button onClick={() => deletePhoto(log.id)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all z-20">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !uploading && setShowUploadModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Log Progress</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div 
                  className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 bg-black/20 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-gold/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <>
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-black/60 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Upload className="w-4 h-4" /> Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                        <Camera className="w-8 h-8" />
                      </div>
                      <p className="font-medium text-foreground">Tap to upload photo</p>
                      <p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 5MB</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Weight (kg)*</label>
                    <input type="number" step="0.1" required value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors" placeholder="e.g. 75.5" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Body Fat %</label>
                    <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors" placeholder="Optional" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Date</label>
                  <input type="date" required value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white [color-scheme:dark]" />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors" disabled={uploading}>Cancel</button>
                  <button type="submit" disabled={uploading} className="flex-1 py-4 bg-gold text-gold-foreground rounded-xl font-bold glow-gold disabled:opacity-50 flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading ? 'Saving...' : 'Save Progress'}
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
