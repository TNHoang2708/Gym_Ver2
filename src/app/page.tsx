'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, Apple, Play, Dumbbell, X, Star, Zap, Brain, Activity, ShieldCheck, Pointer, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { ForgeLogo } from '@/components/ForgeLogo'

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

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  const yHeroText = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacityHeroText = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const yHeroBg = useTransform(scrollYProgress, [0, 1], [0, 150])
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
    <div ref={containerRef} className="min-h-screen flex flex-col font-sans bg-background text-foreground relative overflow-hidden">
      
      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 transform-gpu ${scrolled ? 'bg-[#090A0F]/95 backdrop-blur-xl border-b border-white/[0.08] py-4' : 'bg-transparent py-6'}`}>
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ForgeLogo className="w-10 h-10" glowing={true} />
            <span className="font-heading font-black text-2xl tracking-tight text-white uppercase mt-0.5">
              FORGE <span className="text-red-500 font-mono text-xs font-bold">PRO AI</span>
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-8 bg-[#12141F] px-8 py-2.5 rounded-xl border border-white/[0.08]">
            <Link href="#features" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors">FEATURES</Link>
            <Link href="#ai" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors">AI COACH</Link>
            <Link href="#pricing" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors">PRICING</Link>
            <Link href="#faq" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-[#12141F] rounded-xl p-1 pl-4 border border-white/[0.08] cursor-pointer hover:border-white/20 transition-all" onClick={handleInstallClick}>
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold mr-3 text-zinc-400">GET APP</span>
              <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center transition-colors">
                <Apple className="w-4 h-4 text-white" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center ml-1 shadow-md">
                <Download className="w-4 h-4" />
              </button>
            </div>
            <Link 
              href="/login" 
              className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider bg-white text-black px-6 py-3 rounded-xl hover:bg-zinc-200 transition-all active:scale-95 shadow-md min-h-[44px]"
            >
              SIGN IN <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Padding for Fixed Nav */}
      <div className="pt-32 pb-20 px-4 md:px-8">
        {/* Hero Section */}
        <main className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-12 items-center relative z-10">
          
          {/* Left Content */}
          <motion.div 
            className="max-w-3xl"
            style={{ y: yHeroText, opacity: opacityHeroText }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-600/30 bg-red-600/10 text-red-400 text-[11px] font-mono font-bold tracking-widest uppercase mb-6">
              <Zap className="w-4 h-4" /> ATHLETIC AI TRAINING ENGINE
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight uppercase leading-[0.95] mb-6 text-white">
              FORGE YOUR <span className="text-red-500">LEGACY</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-10 max-w-xl font-light">
              No excuses. Only progress. AI-generated workout splits, macro telemetry, and real-time athletic guidance engineered for dedicated lifters.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2.5 min-h-[48px]"
              >
                START FREE TRIAL <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-8 py-4 border border-white/[0.08] text-white bg-[#12141F] rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all hover:border-white/20 active:scale-95 flex items-center justify-center gap-2.5 min-h-[48px]"
              >
                <Apple className="w-4 h-4" /> INSTALL MOBILE APP
              </button>
            </motion.div>
          </motion.div>

          {/* Right Content */}
          <div className="flex flex-col gap-6 w-full lg:h-[700px]">
            {/* Hero Banner Card */}
            <motion.div 
              className="relative w-full flex-1 rounded-2xl bg-[#12141F] border border-white/[0.08] shadow-2xl flex items-center justify-center group overflow-hidden transform-gpu min-h-[380px]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <motion.div 
                className="absolute inset-0 w-full h-[120%]"
                style={{ y: yHeroBg, top: '-10%' }}
              >
                <Image 
                  src="/hero_bw.png" 
                  alt="Forge AI Fitness Athlete" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-1000 transform-gpu"
                  priority
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-transparent to-transparent pointer-events-none" />
            </motion.div>

            {/* Live Stats Row */}
            <div className="bg-[#12141F] border border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row justify-around items-center shrink-0 shadow-xl">
              <div className="text-center sm:text-left mb-4 sm:mb-0 w-full sm:w-auto">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">ACTIVE ATHLETES</p>
                <p className="text-3xl font-mono font-black text-white tabular-nums">100K+</p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/[0.08]" />
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">MEALS ANALYZED</p>
                <p className="text-3xl font-mono font-black text-white tabular-nums">5.2M</p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/[0.08]" />
              <div className="text-center sm:text-left w-full sm:w-auto mt-4 sm:mt-0">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">AI PRECISION</p>
                <p className="text-3xl font-mono font-black text-emerald-400 tabular-nums">99.4%</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section id="features" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-black mb-3 text-white uppercase tracking-tight">BUILT FOR HIGH PERFORMERS</h2>
          <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">EVERYTHING YOU NEED TO OPTIMIZE YOUR TRAINING AND NUTRITION</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#12141F] border border-white/[0.08] rounded-2xl p-8 hover:border-white/20 transition-all duration-300 shadow-xl">
            <Brain className="w-7 h-7 text-red-500 mb-5" />
            <h3 className="text-lg font-black mb-2 text-white uppercase tracking-tight">PRO AI COACH</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">Personalized workout regimens and real-time athletic guidance trained on elite performance data.</p>
          </div>

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
