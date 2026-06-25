'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Caught:', error)
  }, [error])

  return (
    <html>
      <body className="bg-background text-foreground flex items-center justify-center min-h-screen p-4">
        <div className="glass-card max-w-md w-full p-8 text-center rounded-2xl shadow-2xl border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-red-500">Critical System Error</h2>
          <p className="text-muted-foreground mb-6">
            We encountered a severe issue processing your request. Our engineering team has been notified.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
