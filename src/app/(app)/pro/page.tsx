'use client'

import { motion } from 'framer-motion'
import { Check, Star, Zap, Activity, BrainCircuit, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProUpgradePage() {
  const features = [
    { icon: BrainCircuit, title: 'Infinite AI Memory', desc: 'The AI remembers your entire history, every injury, and every goal.' },
    { icon: Zap, title: 'Live Workout Engine', desc: 'Step-by-step active workout tracking with automated rest timers.' },
    { icon: Activity, title: 'Advanced Body Analytics', desc: 'Unlock 14-day mood tracking, total volume analytics, and body fat estimators.' },
    { icon: Star, title: 'Priority Support', desc: 'Skip the line with 24/7 priority access to our support team.' }
  ]

  const handleSubscribe = () => {
    toast.success('Redirecting to Stripe Checkout...', { icon: '💳' })
  }

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] transform-gpu pointer-events-none z-0 rounded-full" />
      <div className="absolute bottom-0 left-[-20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] transform-gpu pointer-events-none z-0 rounded-full" />
      
      <div className="max-w-md mx-auto relative z-10">
        <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold transition-colors mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Profile
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse mr-2" />
            <span className="text-sm font-bold text-gold uppercase tracking-widest">Upgrade to Pro</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Unleash Your <br/><span className="text-gradient-gold">Full Potential</span></h1>
          <p className="text-muted-foreground text-lg px-4">Take your fitness journey to the absolute peak with advanced AI memory and analytics.</p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-[2.5rem] p-8 mb-8 relative border-gold/30 glow-gold"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full" />
          
          <div className="mb-6 border-b border-white/10 pb-6">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-bold font-heading text-foreground">$9.99</span>
              <span className="text-muted-foreground mb-1 font-medium">/ month</span>
            </div>
            <p className="text-sm text-gold">Billed monthly. Cancel anytime.</p>
          </div>
          
          <div className="space-y-5 mb-8">
            {features.map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleSubscribe}
            className="w-full py-5 bg-gold text-gold-foreground rounded-2xl font-bold text-lg hover:bg-gold/90 transition-all hover:scale-[1.02] active:scale-[0.98] glow-gold flex justify-center items-center gap-2"
          >
            Get Pro Access Now
          </button>
        </motion.div>
        
        <p className="text-center text-xs text-muted-foreground opacity-60">
          Secure payment processing by Stripe. <br/>By subscribing you agree to our Terms of Service.
        </p>
      </div>
    </div>
  )
}
