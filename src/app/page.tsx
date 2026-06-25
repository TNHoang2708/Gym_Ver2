'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, Apple, Play, Dumbbell, X, Star, Zap, Brain, Activity, ShieldCheck, Pointer, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
}

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      setDeferredPrompt(null)
    } else {
      setShowInstallModal(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground relative overflow-hidden">
      
      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 transform-gpu ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="w-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-gold/20 flex items-center justify-center overflow-hidden glow-gold transform-gpu transition-transform hover:scale-105">
              <Image src="/logo.png" alt="Forge Logo" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground uppercase">
              Forge
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 bg-white/5 px-8 py-3 rounded-full border border-white/5 backdrop-blur-md">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Features</Link>
            <Link href="#ai" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">AI Coach</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-white/5 rounded-full p-1 pl-4 shadow-sm border border-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors" onClick={handleInstallClick}>
              <span className="text-xs font-semibold mr-3 text-muted-foreground">Get App</span>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-colors">
                <Apple className="w-4 h-4 text-white" />
              </button>
              <button className="w-8 h-8 rounded-full bg-gold text-black flex items-center justify-center ml-1 glow-gold">
                <Download className="w-4 h-4" />
              </button>
            </div>
            <Link 
              href="/register" 
              className="flex items-center gap-2 text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors transform-gpu active:scale-95"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Padding for Fixed Nav */}
      <div className="pt-32 pb-20 px-6">
        {/* Hero Section */}
        <main className="w-full max-w-[1400px] mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Left Content */}
          <motion.div 
            className="max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5" /> Introducing Forge AI 2.0
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-[4rem] md:text-[6rem] lg:text-[7rem] leading-[0.95] font-medium tracking-tighter mb-6 text-white">
              Forge <span className="font-serif italic text-gold font-light">your</span><br />legacy
            </motion.h1>

            <motion.p variants={itemVariants} className="text-muted-foreground text-xl leading-relaxed mb-10 max-w-lg font-light">
              Experience the pinnacle of intelligent fitness. Personalized AI coaching, precise nutrition tracking, and elite performance analytics.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-gold text-black rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95 glow-gold flex items-center justify-center gap-2 transform-gpu"
              >
                Start Free Trial <Pointer className="w-5 h-5 -rotate-12 animate-pulse" />
              </Link>
              <button 
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white bg-white/5 backdrop-blur-sm rounded-full font-semibold text-lg transition-all hover:bg-white/10 active:scale-95 transform-gpu flex items-center justify-center gap-2"
              >
                <Apple className="w-5 h-5" /> Install App
              </button>
            </motion.div>
          </motion.div>

          {/* Right Content / Image */}
          <motion.div 
            className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[750px] rounded-[2.5rem] shadow-[0_0_80px_rgba(212,175,106,0.1)] border border-white/10 flex items-center justify-center group overflow-hidden transform-gpu"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <Image 
              src="/hero_bw.png" 
              alt="Professional bodybuilder" 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000 transform-gpu"
              priority
            />
            {/* Premium Overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-gold/5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
            
            {/* Glassmorphism Floating Stats */}
            <div className="absolute bottom-10 left-10 right-10 glass-card border border-white/10 rounded-3xl p-6 backdrop-blur-2xl bg-black/40 flex justify-between items-center transform-gpu hover:bg-black/50 transition-colors">
              <div>
                <p className="text-sm text-gold font-bold uppercase tracking-wider mb-1">Active Users</p>
                <p className="text-3xl font-heading font-bold text-white">100k+</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-sm text-gold font-bold uppercase tracking-wider mb-1">Meals Logged</p>
                <p className="text-3xl font-heading font-bold text-white">5.2M</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Bento Grid Features Section */}
      <section className="w-full max-w-[1400px] mx-auto px-6 py-24 relative z-10">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Elite Intelligence.</h2>
          <p className="text-xl text-muted-foreground font-light max-w-2xl">Everything you need to sculpt the perfect physique, powered by next-generation AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
          {/* Feature 1 - Large */}
          <motion.div 
            className="md:col-span-2 md:row-span-2 glass-card rounded-[2rem] p-10 relative overflow-hidden group border border-white/5 hover:border-gold/30 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-gold/20 transition-colors" />
            <Brain className="w-12 h-12 text-gold mb-6 relative z-10" />
            <h3 className="text-3xl font-bold mb-4 text-white relative z-10">Pro AI Coach</h3>
            <p className="text-lg text-muted-foreground relative z-10 max-w-md">Your personal trainer, nutritionist, and motivator. Available 24/7. Trained on thousands of elite athletic regimens.</p>
            
            {/* Mockup UI Element inside card */}
            <div className="absolute bottom-10 right-10 left-10 md:left-auto md:w-[400px] h-40 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl transform-gpu group-hover:-translate-y-2 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center"><Brain className="w-4 h-4 text-black" /></div>
                <div className="h-4 w-24 bg-white/20 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/10 rounded-full" />
                <div className="h-3 w-4/5 bg-white/10 rounded-full" />
                <div className="h-3 w-2/3 bg-white/10 rounded-full" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            className="glass-card rounded-[2rem] p-8 relative overflow-hidden group border border-white/5 hover:border-gold/20 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
          >
            <Activity className="w-10 h-10 text-white mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-white">Smart Tracking</h3>
            <p className="text-muted-foreground">Log workouts with one tap. Visualize progress with gorgeous, hardware-accelerated charts.</p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            className="glass-card rounded-[2rem] p-8 relative overflow-hidden group border border-white/5 hover:border-gold/20 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
          >
            <ShieldCheck className="w-10 h-10 text-white mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-white">Absolute Privacy</h3>
            <p className="text-muted-foreground">Your biometric data is encrypted and securely stored. We never sell your personal information.</p>
          </motion.div>
        </div>
      </section>

      {/* Trusted Clients */}
      <section className="w-full max-w-[1400px] mx-auto px-6 pb-24 relative z-10">
        <div className="border-y border-white/5 py-12">
          <p className="text-center text-sm font-bold tracking-widest uppercase text-muted-foreground mb-8">Trusted by elite performers from</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Nike', 'Gymshark', 'MyProtein', 'Rogue', 'CrossFit'].map((brand, i) => (
              <div key={i} className="text-2xl font-serif font-bold italic tracking-tighter text-white">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-12 mt-auto relative z-10 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black border border-gold/20 flex items-center justify-center glow-gold">
              <Dumbbell className="w-4 h-4 text-gold" />
            </div>
            <span className="font-heading font-bold tracking-tight text-white uppercase text-sm">Forge</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Forge Fitness AI. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Premium Install Modal Bottom Sheet */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transform-gpu"
              onClick={() => setShowInstallModal(false)}
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-black/90 backdrop-blur-2xl border border-white/10 p-8 sm:rounded-[2.5rem] rounded-[2.5rem] shadow-2xl z-10 transform-gpu"
            >
              <button 
                onClick={() => setShowInstallModal(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              <div className="flex items-start gap-5 mb-8 pt-2">
                <div className="w-24 h-24 shrink-0 rounded-3xl bg-black border border-gold/20 flex items-center justify-center overflow-hidden glow-gold shadow-2xl relative">
                  <Image src="/logo.png" alt="Forge App" fill sizes="96px" className="object-cover" />
                </div>
                <div className="pt-2">
                  <h3 className="text-2xl font-heading font-bold text-white mb-1">Forge AI Coach</h3>
                  <p className="text-muted-foreground">Intelligent Fitness</p>
                  <div className="flex items-center gap-1 mt-3">
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <span className="font-bold ml-2 text-white">4.9</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-8 text-muted-foreground leading-relaxed">
                <span className="font-bold text-white block mb-2">Install App (PWA)</span>
                Tap the <strong className="text-gold">Share</strong> button in your browser, then select <strong className="text-gold">"Add to Home Screen"</strong> for the native experience.
              </div>
              
              <button 
                onClick={() => setShowInstallModal(false)}
                className="w-full py-4 bg-gold text-black rounded-2xl font-bold text-lg transition-all hover:bg-gold/90 glow-gold active:scale-95 transform-gpu"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
