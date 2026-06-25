import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-2xl bg-black border border-gold/20 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,106,0.15)] mb-6 glow-gold">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
      <p className="text-muted-foreground font-medium text-sm tracking-widest uppercase">Forge AI</p>
    </div>
  )
}
