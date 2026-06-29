'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, Shield, Bell, Key, LogOut, ChevronRight, Loader2, Camera, X, Save, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { UserMemory } from '@/types'

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
      setUserEmail(user.email || '')
      
      const { data: memData } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', user.id)
        .single()
        
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
        
      if (roleData?.role === 'admin') {
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
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
  }

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, label: 'Personal Information', value: displayName || 'Set Name', action: () => setActiveModal('personal') },
        { icon: User, label: 'Dietary Restrictions', value: dietaryLifestyles.length > 0 ? `${dietaryLifestyles.length} selected` : 'None', action: () => setActiveModal('dietary') },
        { icon: Shield, label: 'Change Password', action: () => setActiveModal('password') },
        { icon: Bell, label: 'Notifications', value: notifications.push ? 'On' : 'Off', action: () => setActiveModal('notifications') },
      ]
    },
    {
      title: 'App Preferences',
      items: [
        { icon: Settings, label: 'Theme & Appearance', value: 'Dark Gold', action: () => toast.success('Dark Gold theme is locked.') },
        { icon: Key, label: 'AI Memory Settings', value: `${memory?.soft_memory?.notes?.length || 0} notes`, action: () => setActiveModal('memory') },
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
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[20%] left-[-20%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-8 pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage your account and preferences.</p>
        </motion.div>

        {/* Premium User Card */}
        <motion.div 
          className="relative p-8 rounded-[2rem] flex flex-col sm:flex-row items-center gap-8 overflow-hidden group/card shadow-2xl border border-gold/30 bg-black/40 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Animated Glow Background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent opacity-50 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative group cursor-pointer" onClick={() => setActiveModal('photo')}>
            {/* Spinning Aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-gold via-yellow-200 to-gold rounded-full opacity-20 group-hover:opacity-50 blur-md transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />
            
            <div className="w-28 h-28 rounded-full bg-black border-2 border-gold/50 flex items-center justify-center shrink-0 relative z-10 overflow-hidden shadow-[0_0_30px_rgba(212,175,106,0.2)]">
              {photoUrl ? (
                 <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                 <User className="w-12 h-12 text-gold" />
              )}
            </div>
            
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 backdrop-blur-sm">
               <Camera className="w-8 h-8 text-white" />
            </div>
            
            {/* VIP Badge */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-gold to-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-black z-30 shadow-lg transform-gpu -rotate-12">
              VIP
            </div>
          </div>
          
          <div className="text-center sm:text-left relative z-10">
            <h2 className="text-3xl font-heading font-black text-white tracking-tight drop-shadow-md">{displayName || 'Athlete'}</h2>
            <p className="text-gold/80 font-medium mt-1 text-sm tracking-wide">{userEmail}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 shadow-[0_0_15px_rgba(212,175,106,0.1)]">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_8px_#D4AF37]" />
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Forge Pro Member</span>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div 
              key={i}
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-4">{section.title}</h3>
              <div className="glass-card rounded-[2rem] overflow-hidden">
                {section.items.map((item, j) => (
                  <button 
                    key={j} 
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group ${
                      j !== section.items.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center group-hover:border-gold/30 group-hover:text-gold transition-colors">
                        <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors" />
                      </div>
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-gold transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logout & Delete */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button 
            onClick={handleSignOut}
            className="w-full glass-card p-5 rounded-[2rem] flex items-center justify-center gap-2 text-foreground font-semibold hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
          
          <button 
            onClick={() => setActiveModal('delete')}
            className="w-full bg-transparent p-5 rounded-[2rem] flex items-center justify-center gap-2 text-destructive/70 text-sm font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </motion.div>
      </div>

      {/* Modals overlay */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
            />
            
            <motion.div 
              className="relative w-full max-w-md glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Password Modal */}
              {activeModal === 'password' && (
                <form onSubmit={updatePassword} className="space-y-6 pt-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Enter a new secure password for your account.</p>
                  </div>
                  <input
                    type="password"
                    required minLength={6}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gold text-gold-foreground rounded-xl font-bold hover:bg-gold/90 transition-colors flex justify-center glow-gold">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                  </button>
                </form>
              )}

              {/* AI Memory Modal */}
              {activeModal === 'memory' && (
                <form onSubmit={updateMemory} className="space-y-6 pt-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">AI Memory Notes</h3>
                    <p className="text-sm text-muted-foreground">Edit what the AI Coach remembers about you. One note per line.</p>
                  </div>
                  <textarea
                    value={memoryNotes} onChange={(e) => setMemoryNotes(e.target.value)}
                    placeholder="e.g. I hate running on treadmills."
                    className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold min-h-[150px] text-sm leading-relaxed"
                  />
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gold text-gold-foreground rounded-xl font-bold hover:bg-gold/90 transition-colors flex justify-center glow-gold">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Memory'}
                  </button>
                </form>
              )}

              {/* Personal Info Modal */}
              {activeModal === 'personal' && (
                <form onSubmit={updatePersonalInfo} className="space-y-6 pt-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Personal Info</h3>
                    <p className="text-sm text-muted-foreground">Update your core physical metrics.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Display Name</label>
                      <input
                        type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Public Username"
                        className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Height (cm)</label>
                      <input
                        type="number" value={hardMemory.height} onChange={(e) => setHardMemory({...hardMemory, height: e.target.value})}
                        className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Weight (kg)</label>
                      <input
                        type="number" value={hardMemory.weight} onChange={(e) => setHardMemory({...hardMemory, weight: e.target.value})}
                        className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gold text-gold-foreground rounded-xl font-bold hover:bg-gold/90 transition-colors flex justify-center glow-gold">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Details'}
                  </button>
                </form>
              )}

              {/* Dietary Modal */}
              {activeModal === 'dietary' && (
                <form onSubmit={updateDietary} className="space-y-6 pt-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Dietary Restrictions</h3>
                    <p className="text-sm text-muted-foreground">This helps the AI tailor your recipes.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Lifestyles</label>
                    <div className="flex flex-wrap gap-2 mb-4">
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
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                            dietaryLifestyles.includes(diet) ? 'bg-gold text-black glow-gold' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Allergies</label>
                    <input
                      type="text" value={allergiesText} onChange={(e) => setAllergiesText(e.target.value)}
                      placeholder="e.g. Peanuts, Shellfish, Dairy (comma separated)"
                      className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gold text-gold-foreground rounded-xl font-bold hover:bg-gold/90 transition-colors flex justify-center glow-gold">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Dietary Info'}
                  </button>
                </form>
              )}

              {/* Notifications Modal */}
              {activeModal === 'notifications' && (
                <div className="space-y-6 pt-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Manage your alerts and reminders.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <div>
                        <p className="font-semibold text-foreground">Push Notifications</p>
                        <p className="text-xs text-muted-foreground">Daily reminders & coach alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({...notifications, push: e.target.checked})} className="sr-only peer" />
                        <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold transition-colors"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <div>
                        <p className="font-semibold text-foreground">Email Updates</p>
                        <p className="text-xs text-muted-foreground">Weekly progress reports</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="sr-only peer" />
                        <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold transition-colors"></div>
                      </label>
                    </div>
                  </div>
                  <button onClick={() => {toast.success('Preferences saved'); setActiveModal(null)}} className="w-full py-4 bg-gold text-gold-foreground rounded-xl font-bold hover:bg-gold/90 transition-colors flex justify-center glow-gold">
                    Save Preferences
                  </button>
                </div>
              )}

              {/* Photo Upload Modal */}
              {activeModal === 'photo' && (
                <div className="space-y-6 pt-4 text-center">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground mb-4">Choose an image (max 2MB)</p>
                  </div>
                  
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-gold/30" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gold animate-spin" />
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
                    <button className="w-full py-4 bg-gold text-gold-foreground rounded-xl font-bold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 glow-gold">
                      <Camera className="w-5 h-5" />
                      {uploadingImage ? 'Uploading...' : 'Upload New Photo'}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Account Modal */}
              {activeModal === 'delete' && (
                <div className="space-y-6 pt-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Delete Account?</h3>
                    <p className="text-sm text-muted-foreground">This action is permanent and will delete all your workout logs, memories, and progress data.</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-white/5 text-foreground rounded-xl font-bold hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={handleDeleteAccount} className="flex-1 py-4 bg-destructive text-destructive-foreground rounded-xl font-bold hover:bg-destructive/90 transition-colors">Delete</button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
