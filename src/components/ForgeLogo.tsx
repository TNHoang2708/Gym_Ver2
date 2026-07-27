import Image from 'next/image'

export function ForgeLogo({ className = "w-6 h-6", glowing = false }: { className?: string; glowing?: boolean }) {
  return (
    <div className={`relative ${className} flex items-center justify-center shrink-0`}>
      {glowing && (
        <>
          {/* Subtle inner core of the halo */}
          <div className="absolute inset-0 bg-orange-500/30 blur-[10px] rounded-full scale-[0.8] pointer-events-none z-0" />
          {/* Broad outer red glow */}
          <div className="absolute inset-0 bg-red-600/15 blur-[25px] rounded-full scale-[1.3] pointer-events-none z-0" />
        </>
      )}
      <Image
        src="/forge-logo-magma-transparent-2.png"
        alt="Forge Logo"
        width={150}
        height={150}
        className="w-full h-full object-contain relative z-10 drop-shadow-xl" 
        priority
      />
    </div>
  )
}
