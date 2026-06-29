import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { PWARegister } from '@/components/PWARegister'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Forge - Your Personal AI Fitness Coach',
    template: '%s | Forge',
  },
  description:
    'The AI fitness coach that actually remembers you. Get personalized workout plans, nutrition tracking, and real coaching that adapts to your life.',
  keywords: ['fitness', 'AI coach', 'workout planner', 'nutrition tracking', 'gym'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Forge'
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden relative">
        {/* Global True Black Background */}
        <div className="fixed inset-0 z-[-1] bg-background">
          {/* Subtle single ambient light to prevent complete flatness */}
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[100vw] h-[60vh] bg-[radial-gradient(ellipse_at_center,_color-mix(in_srgb,var(--primary)_2%,transparent)_0%,transparent_50%)] transform-gpu" />
        </div>
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
