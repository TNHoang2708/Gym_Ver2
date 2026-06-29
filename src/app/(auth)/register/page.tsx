'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/ai-coach`,
      },
    })

    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('This email is already in use')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    toast.success('Account created successfully!')

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <motion.div 
        className="glass-card rounded-[2rem] p-8 md:p-10 space-y-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[radial-gradient(circle,rgba(140,224,255,0.2)_0%,transparent_70%)] rounded-full pointer-events-none" />

        <div className="text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto glow-gold">
            <Dumbbell className="w-8 h-8 text-gold" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Start your intelligent fitness journey.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-gold transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-gold transition-colors" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-gold transition-colors" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat password"
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 glow-gold disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground relative z-10">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground hover:text-gold font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
