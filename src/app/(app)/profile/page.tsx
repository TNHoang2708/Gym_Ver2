'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, Shield, Bell, Key, LogOut, ChevronRight, Loader2, Camera, X, Save, Trash2, MessageSquare, Award, Flame, Utensils as UtensilsIcon, Share2, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { UserMemory } from '@/types'

import Cookies from 'js-cookie'

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string>('')
  const [memory, setMemory] = useState<UserMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [password, setPassword] = useState('')
  const [notifications, setNotifications] = useState({ push: true, email: false })
  const [photoUrl, setPhotoUrl] = useState('')
  const [memoryNotes, setMemoryNotes] = useState<string>('')
  const [hardMemory, setHardMemory] = useState({ height: '', weight: '' })
  const [displayName, setDisplayName] = useState('')
  const [dietaryLifestyles, setDietaryLifestyles] = useState<string[]>([])
  const [allergiesText, setAllergiesText] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      let activeUserId = user.id
      let displayEmail = user.email || ''

      const impersonateId = Cookies.get('impersonate_user_id')
      const impersonateEmail = Cookies.get('impersonate_user_email')
      if (impersonateId) {
        activeUserId = impersonateId
        displayEmail = impersonateEmail || impersonateId
      }

      setUserEmail(displayEmail)
      
      const { data: memData } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', activeUserId)
        .single()
        
      if (memData?.is_admin === true && !impersonateId) {
        setIsAdmin(true)
      } else if (impersonateId) {
        // If impersonating, you are inherently an admin viewing this
        setIsAdmin(true)
      }
        
      if (memData) {
        setMemory(memData as UserMemory)
        setMemoryNotes(memData.soft_memory?.notes?.join('\n') || '')
        setHardMemory({
          height: memData.hard_memory?.height_cm?.toString() || '',
          weight: memData.hard_memory?.weight_kg?.toString() || ''
        })
        setDisplayName(memData.display_name || '')
        setPhotoUrl(memData.hard_memory?.avatar_url || '')
        setDietaryLifestyles(memData.hard_memory?.dietary_lifestyles || [])
        setAllergiesText(memData.hard_memory?.allergies?.join(', ') || '')
      }
    }
    setLoading(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      setActiveModal(null)
      setPassword('')
    }
    setIsSubmitting(false)
  }

  async function updateMemory(e: React.FormEvent) {
    e.preventDefault()
    if (!memory) return
    setIsSubmitting(true)
    
    const notesArray = memoryNotes.split('\n').map(n => n.trim()).filter(n => n.length > 0)
    
    const updatedSoft = {
      ...memory.soft_memory,
      notes: notesArray
    }
    
    const supabase = createClient()
    const { error } = await supabase
      .from('user_memory')
      .update({ soft_memory: updatedSoft })
      .eq('user_id', memory.user_id)
      
    if (error) {
      toast.error('Failed to update AI memory')
    } else {
      toast.success('AI Memory updated')
      setMemory({ ...memory, soft_memory: updatedSoft })
      setActiveModal(null)
    }
    setIsSubmitting(false)
  }

  async function updatePersonalInfo(e: React.FormEvent) {
    e.preventDefault()
    if (!memory) return
    setIsSubmitting(true)
    
    const updatedHard = {
      ...memory.hard_memory,
      height_cm: parseInt(hardMemory.height) || memory.hard_memory.height_cm,
      weight_kg: parseInt(hardMemory.weight) || memory.hard_memory.weight_kg
    }
    
    const supabase = createClient()
    const { error } = await supabase
      .from('user_memory')
      .update({ hard_memory: updatedHard, display_name: displayName })
      .eq('user_id', memory.user_id)
      
    if (error) {
      toast.error('Failed to update information')
    } else {
      toast.success('Information updated')
      setMemory({ ...memory, hard_memory: updatedHard })
      setActiveModal(null)
    }
    setIsSubmitting(false)
  }

  async function updateDietary(e: React.FormEvent) {
    e.preventDefault()
    if (!memory) return
    setIsSubmitting(true)
    
    const allergiesArray = allergiesText.split(',').map(a => a.trim()).filter(a => a.length > 0)
    
    const updatedHard = {
      ...memory.hard_memory,
      dietary_lifestyles: dietaryLifestyles,
      allergies: allergiesArray
    }
    
    const supabase = createClient()
    const { error } = await supabase
      .from('user_memory')
      .update({ hard_memory: updatedHard })
      .eq('user_id', memory.user_id)
      
    if (error) {
      toast.error('Failed to update dietary info')
    } else {
      toast.success('Dietary restrictions updated')
      setMemory({ ...memory, hard_memory: updatedHard })
      setActiveModal(null)
    }
    setIsSubmitting(false)
  }

  const [uploadingImage, setUploadingImage] = useState(false)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !memory) return
    
    // Quick validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be less than 2MB')
      return
    }

    setUploadingImage(true)
    const supabase = createClient()
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${memory.user_id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)
        
      if (uploadError) {
        if (uploadError.message.includes('bucket')) {
          toast.error("Vui lòng vào Supabase Dashboard tạo bucket 'avatars' trước nhé sếp!")
          throw uploadError
        }
        throw uploadError
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
        
      setPhotoUrl(publicUrl)
      
      // Auto save after upload
      const updatedHard = {
        ...memory.hard_memory,
        avatar_url: publicUrl
      }
      
      const { error: updateError } = await supabase
        .from('user_memory')
        .update({ hard_memory: updatedHard })
        .eq('user_id', memory.user_id)
        
      if (updateError) throw updateError
      
      toast.success('Profile photo updated!')
      setMemory({ ...memory, hard_memory: updatedHard })
      setActiveModal(null)
    } catch (error: any) {
      console.error(error)
      if (!error.message?.includes('bucket')) {
        toast.error(error.message || 'Error uploading image')
      }
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleDeleteAccount() {
    // Note: Supabase requires admin privileges to completely delete a user via client.
    // For now, this is a mock implementation that signs the user out.
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.error("Account deletion requires contacting support in this version.")
      setActiveModal(null)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen px-4 pt-8">
        <div className="max-w-screen-xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-white/5 rounded-lg mx-auto lg:mx-0"></div>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="h-96 bg-white/5 rounded-[2.5rem]"></div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              <div className="h-64 bg-white/5 rounded-[2rem]"></div>
              <div className="h-64 bg-white/5 rounded-[2rem]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, label: 'Personal Information', value: displayName || 'Set Name', action: () => setActiveModal('personal') },
        { icon: UtensilsIcon, label: 'Dietary Restrictions', value: dietaryLifestyles.length > 0 ? `${dietaryLifestyles.length} selected` : 'None', action: () => setActiveModal('dietary') },
        { icon: Shield, label: 'Change Password', action: () => setActiveModal('password') },
        { icon: Bell, label: 'Notifications', value: notifications.push ? 'On' : 'Off', action: () => setActiveModal('notifications') },
      ]
    },
    {
      title: 'App Preferences & Rewards',
      items: [
        { icon: Gift, label: 'Refer a Friend & Earn VIP', value: '20% OFF', action: () => setActiveModal('referral') },
        { icon: Settings, label: 'Theme & Appearance', value: 'Forge Ember 🔥', action: () => toast.success('Forge Ember theme is locked in. 🔥') },
        { icon: Key, label: 'AI Memory Settings', value: `${memory?.soft_memory?.notes?.length || 0} notes`, action: () => setActiveModal('memory') },
        { icon: MessageSquare, label: 'Submit Feedback', action: () => window.location.href = '/feedback' },
      ]
    }
  ]

  if (isAdmin) {
    sections.push({
      title: 'Administration',
      items: [
        { icon: Shield, label: 'Admin Dashboard', value: 'Live Users', action: () => window.location.href = '/admin' }
      ]
    })
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient Premium Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[600px] bg-red-600/5 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[400px] bg-gold/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tight uppercase mb-2">Profile</h1>
          <p className="text-muted-foreground font-medium">Manage your Forge identity and settings.</p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ── CỘT TRÁI (Sticky User Card - 5/12) ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              <motion.div 
                className="relative p-8 rounded-[3rem] flex flex-col items-center text-center overflow-hidden group/card shadow-2xl border border-white/10 glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Animated Glow Background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-transparent opacity-50 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative group cursor-pointer mb-6" onClick={() => setActiveModal('photo')}>
                  {/* Spinning Aura */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-gold via-orange-500 to-gold rounded-full opacity-30 group-hover:opacity-70 blur-md transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />
                  
                  <div className="w-40 h-40 rounded-full bg-black border-2 border-gold/50 flex items-center justify-center shrink-0 relative z-10 overflow-hidden shadow-[0_0_40px_rgba(212,175,106,0.3)]">
                    {photoUrl ? (
                       <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       <User className="w-20 h-20 text-gold/50" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 backdrop-blur-sm">
                     <Camera className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* VIP Badge */}
                  <div className="absolute bottom-2 right-0 bg-gradient-to-r from-gold to-orange-500 text-black text-[12px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-black z-30 shadow-[0_0_15px_rgba(212,175,106,0.6)] transform-gpu rotate-[-10deg]">
                    VIP
                  </div>
                </div>
                
                <div className="relative z-10 w-full">
                  <h2 className="text-3xl font-heading font-black text-white tracking-tight uppercase mb-1">{displayName || 'Athlete'}</h2>
                  <p className="text-muted-foreground font-medium text-sm tracking-wide mb-6">{userEmail}</p>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-2xl font-black text-white">{hardMemory.weight || '--'}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Weight (kg)</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-2xl font-black text-white">{hardMemory.height || '--'}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Height (cm)</span>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/10 border border-gold/30 shadow-[0_0_15px_rgba(212,175,106,0.15)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(212,175,106,0.8)]" />
                    <span className="text-xs font-black text-gold uppercase tracking-widest">Forge Pro Member</span>
                  </div>
                </div>
              </motion.div>

              <div className="glass-card p-6 rounded-[2rem] border-white/10 shadow-2xl flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleSignOut}
                  className="flex-1 p-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" /> Sign Out
                </button>
                <button 
                  onClick={() => setActiveModal('delete')}
                  className="flex-1 p-4 rounded-xl flex items-center justify-center gap-2 text-red-400 font-bold bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* ── CỘT PHẢI (Settings Sections - 7/12) ── */}
          <div className="lg:col-span-7 space-y-8">
            {sections.map((section, i) => (
              <motion.div 
                key={i}
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
              >
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                  {section.title}
                </h3>
                <div className="glass-card rounded-[2rem] overflow-hidden border-white/10 shadow-xl">
                  {section.items.map((item, j) => (
                    <button 
                      key={j} 
                      onClick={item.action}
                      className={`w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group ${
                        j !== section.items.length - 1 ? 'border-b border-white/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:border-gold/30 group-hover:bg-gold/10 transition-all">
                          <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors" />
                        </div>
                        <span className="font-bold text-white text-base">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {item.value && <span className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors">{item.value}</span>}
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-gold transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* Modals overlay */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
            />
            
            <motion.div 
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Password Modal */}
              {activeModal === 'password' && (
                <form onSubmit={updatePassword} className="space-y-6 pt-2">
                  <div className="mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 glow-gold">
                      <Shield className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">Change Password</h3>
                    <p className="text-sm font-medium text-muted-foreground">Enter a new secure password for your account.</p>
                  </div>
                  <input
                    type="password"
                    required minLength={6}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-gold/50 focus:shadow-[0_0_20px_rgba(212,175,106,0.15)] transition-all"
                  />
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-fire text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center glow-red border-t border-white/20">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                  </button>
                </form>
              )}

              {/* AI Memory Modal */}
              {activeModal === 'memory' && (
                <form onSubmit={updateMemory} className="space-y-6 pt-2">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 glow-gold">
                      <Key className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">AI Memory Notes</h3>
                    <p className="text-sm font-medium text-muted-foreground">Edit what the AI Coach remembers about you. One note per line.</p>
                  </div>
                  <textarea
                    value={memoryNotes} onChange={(e) => setMemoryNotes(e.target.value)}
                    placeholder="e.g. I hate running on treadmills."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-gold/50 focus:shadow-[0_0_20px_rgba(212,175,106,0.15)] transition-all min-h-[160px] text-sm leading-relaxed resize-none"
                  />
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-fire text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center glow-red border-t border-white/20">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Memory'}
                  </button>
                </form>
              )}

              {/* Personal Info Modal */}
              {activeModal === 'personal' && (
                <form onSubmit={updatePersonalInfo} className="space-y-6 pt-2">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 glow-gold">
                      <User className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">Personal Info</h3>
                    <p className="text-sm font-medium text-muted-foreground">Update your core physical metrics.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Display Name</label>
                      <input
                        type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Public Username"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-gold/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Height (cm)</label>
                      <input
                        type="number" value={hardMemory.height} onChange={(e) => setHardMemory({...hardMemory, height: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-gold/50 transition-all text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Weight (kg)</label>
                      <input
                        type="number" value={hardMemory.weight} onChange={(e) => setHardMemory({...hardMemory, weight: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-gold/50 transition-all text-center"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-fire text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center glow-red border-t border-white/20 mt-4">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Details'}
                  </button>
                </form>
              )}

              {/* Dietary Modal */}
              {activeModal === 'dietary' && (
                <form onSubmit={updateDietary} className="space-y-6 pt-2">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 glow-gold">
                      <Flame className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">Dietary Setup</h3>
                    <p className="text-sm font-medium text-muted-foreground">Tailor the AI's recipe recommendations.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Lifestyles</label>
                    <div className="flex flex-wrap gap-2.5 mb-6">
                      {['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Halal', 'Pescatarian'].map(diet => (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => {
                            if (dietaryLifestyles.includes(diet)) {
                              setDietaryLifestyles(dietaryLifestyles.filter(d => d !== diet))
                            } else {
                              setDietaryLifestyles([...dietaryLifestyles, diet])
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                            dietaryLifestyles.includes(diet) ? 'bg-gold/20 border-gold text-gold shadow-[0_0_15px_rgba(212,175,106,0.3)]' : 'bg-black/40 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Allergies</label>
                    <input
                      type="text" value={allergiesText} onChange={(e) => setAllergiesText(e.target.value)}
                      placeholder="e.g. Peanuts, Shellfish, Dairy"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-gold/50 transition-all"
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-fire text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center glow-red border-t border-white/20 mt-4">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Dietary Info'}
                  </button>
                </form>
              )}

              {/* Notifications Modal */}
              {activeModal === 'notifications' && (
                <div className="space-y-6 pt-2">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 glow-gold">
                      <Bell className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">Notifications</h3>
                    <p className="text-sm font-medium text-muted-foreground">Manage your alerts and reminders.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-black/40 border border-white/10 rounded-2xl">
                      <div>
                        <p className="font-bold text-white mb-0.5">Push Notifications</p>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Daily reminders & alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({...notifications, push: e.target.checked})} className="sr-only peer" />
                        <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold transition-colors"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-black/40 border border-white/10 rounded-2xl">
                      <div>
                        <p className="font-bold text-white mb-0.5">Email Updates</p>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Weekly progress reports</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="sr-only peer" />
                        <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold transition-colors"></div>
                      </label>
                    </div>
                  </div>
                  <button onClick={() => {toast.success('Preferences saved'); setActiveModal(null)}} className="w-full py-4 mt-6 bg-gradient-fire text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center glow-red border-t border-white/20">
                    Save Preferences
                  </button>
                </div>
              )}

              {/* Photo Upload Modal */}
              {activeModal === 'photo' && (
                <div className="space-y-6 pt-2 text-center">
                  <div className="mb-6">
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">Profile Photo</h3>
                    <p className="text-sm font-medium text-muted-foreground mb-4">Choose an image (max 2MB)</p>
                  </div>
                  
                  <div className="relative w-40 h-40 mx-auto mb-8">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-gold/50 shadow-[0_0_30px_rgba(212,175,106,0.3)]" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center border-4 border-white/10">
                        <User className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-gold animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="relative w-full">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                    />
                    <button className="w-full py-4 bg-gradient-fire text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 glow-red border-t border-white/20">
                      <Camera className="w-5 h-5" />
                      {uploadingImage ? 'Uploading...' : 'Upload New Photo'}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Account Modal */}
              {activeModal === 'delete' && (
                <div className="space-y-6 pt-2 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <Trash2 className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="mb-8">
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-3">Delete Account?</h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">This action is permanent. All your workout logs, memories, and progress data will be incinerated.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={handleDeleteAccount} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors border-t border-red-400 glow-red">Delete</button>
                  </div>
                </div>
              )}

              {/* Referral & Rewards Modal */}
              {activeModal === 'referral' && (
                <div className="space-y-6 pt-2 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4 glow-gold">
                    <Gift className="w-10 h-10 text-gold" />
                  </div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">Giới Thiệu Bạn Bè</h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                      Mời đồng đội tham gia Forge AI. Bạn bè nhận ngay <strong className="text-gold">20% OFF gói Pro</strong>, bạn nhận 1 tháng VIP Pro miễn phí!
                    </p>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Mã Giới Thiệu Của Bạn</span>
                    <div className="text-xl font-mono font-black text-gold">FORGE-{displayName.toUpperCase() || 'ATHLETE'}</div>
                  </div>

                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}/register?ref=FORGE-${displayName.toUpperCase() || 'ATHLETE'}`
                      navigator.clipboard.writeText(link)
                      toast.success('Đã copy link giới thiệu bạn bè!')
                    }}
                    className="w-full py-4 bg-gradient-gold text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,106,0.3)]"
                  >
                    <Share2 className="w-5 h-5" /> Copy Link Giới Thiệu
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
