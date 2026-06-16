'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, MessageSquare, Send, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PROMPTS = [
  'The AI Coach really gets me',
  'Memory feature is amazing',
  'Workout plans are on point',
  'Nutrition tracking helps a lot',
  'Could be better',
]

export default function FeedbackPage() {
  const supabase = createClient()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      rating,
      message: message.trim() || null,
    })

    if (error) {
      toast.error('Failed to submit feedback')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold">Thank you! 🙏</h2>
          <p className="text-sm text-muted-foreground">
            Your feedback helps us make the AI Coach better for everyone.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Feedback
          </h1>
          <p className="text-sm text-muted-foreground">Help us improve the AI Coach</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star rating */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold text-center">How would you rate your experience?</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-10 h-10 transition-colors',
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-border'
                  )}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {['', 'Poor 😕', 'Fair 🤔', 'Good 👍', 'Great 😊', 'Amazing! 🔥'][rating]}
            </p>
          )}
        </div>

        {/* Quick prompts */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick thoughts (tap to fill):</p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setMessage(prompt)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all',
                  message === prompt
                    ? 'bg-gold/10 border-gold/30 text-gold'
                    : 'border-border text-muted-foreground hover:border-border/60'
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you love or what could be better…"
            rows={4}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/30 resize-none transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all',
            rating > 0 && !submitting
              ? 'bg-gold hover:bg-gold/90 text-white glow-gold'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          )}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Feedback</>
          )}
        </button>
      </form>
    </div>
  )
}
