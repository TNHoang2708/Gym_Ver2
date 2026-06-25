'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error Caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-sm w-full p-8 rounded-2xl shadow-xl border border-border"
      >
        <div className="w-16 h-16 bg-muted/30 text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We&apos;re having trouble loading this page. Please try again or return to the dashboard.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="w-full py-3 px-4 bg-secondary text-secondary-foreground rounded-full font-semibold hover:bg-secondary/80 transition-colors"
          >
            Return Home
          </a>
        </div>
      </motion.div>
    </div>
  )
}
