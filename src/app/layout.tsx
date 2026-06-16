import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

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
  themeColor: '#D4AF6A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gym AI'
  }
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
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
