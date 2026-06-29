import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(212,175,106,0.15)_0%,transparent_70%)] rounded-full transform-gpu" />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: 'oklch(0.1 0 0)',
            border: '1px solid oklch(0.18 0 0)',
            color: 'oklch(0.96 0 0)',
          },
        }}
      />
    </div>
  )
}
