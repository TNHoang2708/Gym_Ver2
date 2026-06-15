import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Gym Planner AI — Your Personal AI Fitness Coach',
    template: '%s | Gym Planner AI',
  },
  description:
    'The AI fitness coach that actually remembers you. Get personalized workout plans, nutrition tracking, and real coaching that adapts to your life.',
  keywords: ['fitness', 'AI coach', 'workout planner', 'nutrition tracking', 'gym'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
