'use client'

import Link from 'next/link'
import { ArrowRight, Download, Apple, Play, Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'
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
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navigation */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-[1400px] mx-auto z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center glow-gold">
            <Dumbbell className="w-5 h-5 text-gold" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">
            Gym<span className="text-gold">AI</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[13px] font-medium tracking-wide">
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">AI Coach</Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Success Stories</Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-white/5 rounded-full p-1 pl-4 shadow-sm border border-white/5 backdrop-blur-sm">
            <span className="text-xs font-semibold mr-3 text-muted-foreground">Download App</span>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Apple className="w-4 h-4 text-foreground" />
            </button>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ml-1">
              <Play className="w-4 h-4 ml-0.5 text-foreground" />
            </button>
            <button className="w-8 h-8 rounded-full bg-gold text-gold-foreground flex items-center justify-center hover:bg-gold/90 transition-colors ml-1">
              <Download className="w-4 h-4" />
            </button>
          </div>
          <Link 
            href="/register" 
            className="flex items-center gap-2 text-sm font-semibold bg-gold text-gold-foreground px-5 py-2.5 rounded-full hover:bg-gold/90 transition-colors glow-gold"
          >
            Start Training <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center mt-8 lg:mt-0 relative z-10">
        
        {/* Left Content */}
        <motion.div 
          className="max-w-xl pr-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="text-[3.5rem] md:text-[5rem] lg:text-[5.5rem] leading-[1.05] font-medium tracking-tight mb-6">
            Transform <span className="font-serif italic text-gold">your body</span> and mind
          </motion.h1>

          <motion.p variants={itemVariants} className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md">
            Build strength, find balance, and unlock your full potential with guided fitness and mindful living.
          </motion.p>

          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <Link 
              href="/register" 
              className="px-8 py-3.5 bg-gold text-gold-foreground rounded-full font-medium transition-transform hover:scale-105 active:scale-95 glow-gold"
            >
              Join Member
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-3.5 border border-white/20 text-foreground bg-white/5 backdrop-blur-sm rounded-full font-medium transition-all hover:bg-white/10 active:scale-95"
            >
              Start for Free
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Content / Image */}
        <motion.div 
          className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[650px] rounded-[2rem] shadow-[0_0_60px_rgba(212,175,106,0.15)] border border-gold/20 flex items-center justify-center group"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          {/* Inner wrapper for image to allow floating elements outside the overflow hidden */}
          <div className="absolute inset-2 md:inset-4 rounded-3xl overflow-hidden bg-black">
            <Image 
              src="/hero_bw.png" 
              alt="Professional bodybuilder" 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
              priority
            />
            {/* Duotone Gold Gradient Overlay to tie the B&W image into the color scheme */}
            <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-gold/10 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
          </div>

          {/* Floating Badge - Top Right */}
          <motion.div 
            className="absolute -top-4 -right-4 md:top-8 md:-right-6 glass-card border border-gold/30 px-5 py-3 rounded-2xl flex items-center gap-3 z-20 shadow-2xl glow-gold"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 100 }}
          >
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-sm font-bold tracking-wider uppercase text-gold">Pro AI Coach</span>
          </motion.div>

          {/* Floating Badge - Bottom Left */}
          <motion.div 
            className="absolute -bottom-4 -left-4 md:bottom-12 md:-left-8 glass-card border border-white/10 p-4 rounded-3xl flex items-center gap-4 z-20 shadow-2xl backdrop-blur-xl bg-black/60"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
          >
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-background bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">AI</div>
              <div className="w-10 h-10 rounded-full border-2 border-background bg-white/10 flex items-center justify-center text-xs font-bold text-white">PRO</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Trained by</p>
              <p className="font-heading font-bold text-lg text-foreground mt-0.5">Elite Algorithms</p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Clients Banner */}
      <div className="w-full max-w-[1400px] mx-auto px-6 pb-6 mt-16 relative z-10">
        <motion.div 
          className="glass-card rounded-[2rem] p-8 md:p-10 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm font-medium mb-8">
            <p className="uppercase tracking-widest text-xs font-semibold">[ 1000+ Trusted Clients ]</p>
            <p className="mt-4 md:mt-0 font-mono">@2002-2026</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Sisyphus', 'Luminous', 'Interlock', 'Biosynthesis', 'Nietzsche', 'Layers'].map((client, i) => (
              <div key={i} className="bg-white/5 border border-white/5 backdrop-blur-sm rounded-xl h-20 flex items-center justify-center p-4 hover:-translate-y-1 hover:bg-white/10 hover:border-gold/30 transition-all cursor-pointer group">
                <span className="font-bold text-muted-foreground group-hover:text-gold flex items-center gap-2 transition-colors">
                  <div className="w-3 h-3 bg-white/20 group-hover:bg-gold rounded-sm rotate-45 transition-colors" />
                  {client}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  )
}
