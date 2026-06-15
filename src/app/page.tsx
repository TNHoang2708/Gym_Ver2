import Link from 'next/link'
import { Dumbbell, Brain, Heart, TrendingUp, Zap, Shield, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gym Planner AI — The Coach That Remembers You',
  description: 'An AI fitness coach with real memory. It learns your goals, mood, injuries, and lifestyle — and talks to you like a real friend, not a chatbot.',
}

const features = [
  {
    icon: Brain,
    title: 'Real Memory',
    description: 'Remembers your injuries, goals, mood history, and every conversation — forever.',
  },
  {
    icon: Heart,
    title: 'Emotional Intelligence',
    description: 'Knows when you need support vs. coaching. Adapts its tone to your state of mind.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Nutrition',
    description: 'Calculates your exact calorie and macro targets. Tracks every meal.',
  },
  {
    icon: Zap,
    title: 'Custom Workout Plans',
    description: 'AI generates weekly programs based on your level, location, and schedule.',
  },
  {
    icon: Shield,
    title: 'Injury Aware',
    description: 'Never suggests exercises that conflict with your injuries or medical conditions.',
  },
  {
    icon: Dumbbell,
    title: 'Progress Tracking',
    description: 'Streaks, charts, diary. Every training day logged and visualized.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center glow-crimson">
              <Dumbbell className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Gym Planner AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-crimson hover:bg-crimson/90 text-white px-4 py-2 rounded-lg transition-all glow-crimson"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-crimson/10 border border-crimson/20 rounded-full px-4 py-1.5 mb-8">
            <Brain className="w-3.5 h-3.5 text-crimson" />
            <span className="text-xs font-semibold text-crimson uppercase tracking-wider">Powered by Gemini AI</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-none mb-6"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            The AI Coach<br />
            <span className="text-gradient-crimson">That Remembers You</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Not a generic chatbot. A fitness coach with real memory — it knows your injuries,
            goals, mood, and history. Every session feels like picking up where you left off.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-crimson hover:bg-crimson/90 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all glow-crimson w-full sm:w-auto justify-center"
            >
              Start Free — No Credit Card
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-3.5"
            >
              Already have an account →
            </Link>
          </div>
        </div>
      </section>

      {/* Memory Layers Visual */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Four Layers of Memory
            </h2>
            <p className="text-muted-foreground">
              Most apps forget you when you close the tab. We don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Hard Memory',
                color: 'text-crimson',
                bg: 'bg-crimson/5 border-crimson/15',
                items: ['Gender & Age', 'Height & Weight', 'Body Type', 'Injuries'],
              },
              {
                label: 'Soft Memory',
                color: 'text-orange-400',
                bg: 'bg-orange-400/5 border-orange-400/15',
                items: ['Goals & Physique', 'Schedule', 'Preferences', 'Conversation notes'],
              },
              {
                label: 'Emotional Memory',
                color: 'text-pink-400',
                bg: 'bg-pink-400/5 border-pink-400/15',
                items: ['Recent mood', 'Decay logic', 'Heavy context', 'Tone adjustment'],
              },
              {
                label: 'Session Meta',
                color: 'text-violet-400',
                bg: 'bg-violet-400/5 border-violet-400/15',
                items: ['Last opened', 'Last topics', 'Streak data', 'Onboarding status'],
              },
            ].map((layer) => (
              <div key={layer.label} className={`rounded-xl border p-5 ${layer.bg}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${layer.color}`}>
                  {layer.label}
                </p>
                <ul className="space-y-1.5">
                  {layer.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full ${layer.color} bg-current flex-shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Everything in One Place
            </h2>
            <p className="text-muted-foreground">
              Coaching, nutrition, tracking — all remembering who you are.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-6 group hover:border-crimson/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-crimson/10 flex items-center justify-center mb-4 group-hover:bg-crimson/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-crimson" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-10 border border-crimson/10">
            <div className="w-16 h-16 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center mx-auto mb-6 glow-crimson">
              <Dumbbell className="w-8 h-8 text-crimson" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Ready to start?
            </h2>
            <p className="text-muted-foreground mb-8">
              Complete a quick 15-step setup and your AI coach will know everything it needs
              to train you like a pro from day one.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-crimson hover:bg-crimson/90 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all glow-crimson"
            >
              Create Free Account
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-crimson" />
            <span className="text-sm font-semibold text-muted-foreground">Gym Planner AI v2</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with Gemini AI · Supabase · Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
