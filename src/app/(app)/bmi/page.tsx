'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Target, Upload, Image as ImageIcon, Loader2, Camera, Ruler, ArrowRight, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { WeightLog, HardMemory } from '@/types'

type CalcMode = 'BMI' | 'BodyFat'

export default function BMIPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  
  // Calculator mode
  const [calcMode, setCalcMode] = useState<CalcMode>('BMI')

  // Form State
  const [height, setHeight] = useState('175')
  const [weight, setWeight] = useState('75')
  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hips, setHips] = useState('') // For females
  const [chest, setChest] = useState('')
  const [arms, setArms] = useState('')
  
  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load user memory for gender, height, weight
    const { data: memData } = await supabase
      .from('user_memory')
      .select('hard_memory')
      .eq('user_id', user.id)
      .single()

    if (memData?.hard_memory) {
      const hm = memData.hard_memory as HardMemory
      if (hm.gender) setGender(hm.gender)
      if (hm.height_cm) setHeight(String(hm.height_cm))
      if (hm.weight_kg) setWeight(String(hm.weight_kg))
    }

    // Load weight logs
    const { data: weightData } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: true })

    if (weightData) {
      setLogs(weightData)
      const lastLog = weightData[weightData.length - 1]
      if (lastLog) {
        setWeight(String(lastLog.weight_kg))
        if (lastLog.waist_cm) setWaist(String(lastLog.waist_cm))
        if (lastLog.neck_cm) setNeck(String(lastLog.neck_cm))
        if (lastLog.hips_cm) setHips(String(lastLog.hips_cm))
        if (lastLog.chest_cm) setChest(String(lastLog.chest_cm))
        if (lastLog.arms_cm) setArms(String(lastLog.arms_cm))
      }
    }
    setLoading(false)
  }

  // --- Calculations ---

  const bmi = height && weight ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1) : '0.0'

  function getBMICategory(bmiVal: number) {
    if (bmiVal === 0) return { label: '-', color: 'text-muted-foreground' }
    if (bmiVal < 18.5) return { label: 'Underweight', color: 'text-blue-400' }
    if (bmiVal < 25) return { label: 'Healthy Weight', color: 'text-green-400' }
    if (bmiVal < 30) return { label: 'Overweight', color: 'text-gold' }
    return { label: 'Obese', color: 'text-destructive' }
  }

  function calculateNavyBodyFat() {
    const h = Number(height)
    const w = Number(waist)
    const n = Number(neck)
    const hip = Number(hips)

    if (!h || !w || !n) return 0
    if (gender === 'female' && !hip) return 0

    let bf = 0
    if (gender === 'female') {
      // Female formula
      bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.22100 * Math.log10(h)) - 450
    } else {
      // Male formula
      bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450
    }
    return Math.max(0, Math.min(100, bf))
  }

  const estimatedBF = calculateNavyBodyFat()
  const category = getBMICategory(Number(bmi))

  // --- Actions ---

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveLog = async () => {
    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const log_date = new Date().toISOString().split('T')[0]
    let photo_url = undefined

    // Upload photo if selected
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${user.id}/${log_date}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('progress_photos')
        .upload(fileName, photoFile)
        
      if (!uploadError) {
        const { data } = supabase.storage.from('progress_photos').getPublicUrl(fileName)
        photo_url = data.publicUrl
      } else {
        toast.error('Failed to upload photo. Are storage policies set?')
      }
    }

    const payload = {
      user_id: user.id,
      log_date,
      weight_kg: Number(weight),
      body_fat_percent: estimatedBF > 0 ? Number(estimatedBF.toFixed(1)) : null,
      waist_cm: waist ? Number(waist) : null,
      neck_cm: neck ? Number(neck) : null,
      hips_cm: hips ? Number(hips) : null,
      chest_cm: chest ? Number(chest) : null,
      arms_cm: arms ? Number(arms) : null,
      photo_url: photo_url || undefined
    }

    const { error } = await supabase
      .from('weight_logs')
      .upsert(payload, { onConflict: 'user_id, log_date' })

    if (error) {
      toast.error('Failed to save log')
      console.error(error)
    } else {
      toast.success('Metrics saved successfully!')
      setPhotoFile(null)
      loadData()
    }
    setIsSubmitting(false)
  }

  // --- Derived Data ---
  
  const chartData = logs.map(l => {
    const d = new Date(l.log_date)
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      weight: l.weight_kg,
      bf: l.body_fat_percent
    }
  })

  const weightDiff = logs.length >= 2 
    ? (logs[logs.length - 1].weight_kg - logs[0].weight_kg).toFixed(1)
    : '0.0'

  const photos = logs.filter(l => l.photo_url).sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading body metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-8 pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground">Body Metrics</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Track weight, measurements, and progress photos.</p>
          </div>
          <button 
            onClick={handleSaveLog}
            disabled={isSubmitting}
            className="hidden md:flex px-6 py-3 bg-gold text-gold-foreground rounded-xl font-semibold hover:bg-gold/90 transition-all items-center gap-2 glow-gold disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Today's Log
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Input Form & Calculator */}
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            
            <div className="glass-card p-6 md:p-8 rounded-[2rem]">
              <div className="flex items-center gap-2 mb-6 bg-black/20 p-1 rounded-xl">
                <button 
                  onClick={() => setCalcMode('BMI')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${calcMode === 'BMI' ? 'bg-gold text-gold-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                >
                  BMI
                </button>
                <button 
                  onClick={() => setCalcMode('BodyFat')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${calcMode === 'BodyFat' ? 'bg-gold text-gold-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                >
                  Body Fat %
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weight (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Height (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {calcMode === 'BodyFat' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2 overflow-hidden">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Waist (cm)</label>
                          <input type="number" value={waist} onChange={e => setWaist(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Neck (cm)</label>
                          <input type="number" value={neck} onChange={e => setNeck(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                        </div>
                        {gender === 'female' && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hips (cm)</label>
                            <input type="number" value={hips} onChange={e => setHips(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chest (cm) <span className="opacity-50">Opt</span></label>
                          <input type="number" value={chest} onChange={e => setChest(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Arms (cm) <span className="opacity-50">Opt</span></label>
                          <input type="number" value={arms} onChange={e => setArms(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-medium focus:ring-1 focus:ring-gold outline-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-6 border-t border-white/5 text-center mt-6">
                  {calcMode === 'BMI' ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">Your BMI is</p>
                      <p className="text-6xl font-heading font-bold text-gradient-gold mb-2">{bmi}</p>
                      <p className={`text-sm font-semibold uppercase tracking-wider ${category.color}`}>
                        {category.label}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">Est. Body Fat (Navy Method)</p>
                      <p className="text-6xl font-heading font-bold text-gradient-gold mb-2">
                        {estimatedBF > 0 ? estimatedBF.toFixed(1) : '--'}
                        <span className="text-3xl text-gold/50">%</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Based on measurements</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-[2rem]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold flex items-center gap-2"><Camera className="w-4 h-4 text-gold" /> Progress Photo</h3>
              </div>
              
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
              
              {photoPreview ? (
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20">Change Photo</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-gold/50 hover:bg-gold/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-gold"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">Upload Today's Photo</span>
                </button>
              )}
            </div>
            
            <button 
              onClick={handleSaveLog}
              disabled={isSubmitting}
              className="w-full md:hidden py-4 bg-gold text-gold-foreground rounded-2xl font-bold flex justify-center items-center gap-2 glow-gold disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Metrics
            </button>

          </motion.div>

          {/* Right Column: Charts & Gallery */}
          <motion.div className="lg:col-span-2 space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            
            {/* Chart */}
            <div className="glass-card p-6 md:p-8 rounded-[2rem] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-bold">Weight Trajectory</h2>
                    <p className="text-xs text-muted-foreground">Historical weight data</p>
                  </div>
                </div>
                {chartData.length >= 2 && (
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${Number(weightDiff) <= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {Number(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(212,175,106,0.2)', borderRadius: '1rem', color: '#fff' }}
                        itemStyle={{ color: '#D4AF6A', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        name="Weight (kg)"
                        stroke="#D4AF6A" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#111', stroke: '#D4AF6A', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#D4AF6A' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/5 rounded-2xl">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No historical data.</p>
                    <p className="text-xs opacity-50">Save your first log today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="glass-card p-6 md:p-8 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="w-5 h-5 text-gold" />
                <h2 className="text-xl font-heading font-bold">Progress Gallery</h2>
              </div>

              {photos.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {photos.map(p => (
                    <div key={p.id} className="relative shrink-0 w-48 aspect-[3/4] rounded-2xl overflow-hidden snap-start group border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.photo_url} alt={`Progress on ${p.log_date}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-xs font-bold text-white">{new Date(p.log_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-[10px] text-gold">{p.weight_kg} kg {p.body_fat_percent ? `• ${p.body_fat_percent}% BF` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-[21/9] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/5 rounded-2xl bg-black/10">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No photos uploaded yet.</p>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
