'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Ghost, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ImpersonationBanner() {
  const [impersonateId] = useState<string | null>(() => Cookies.get('impersonate_user_id') || null)
  const [impersonateEmail] = useState<string | null>(() => Cookies.get('impersonate_user_email') || Cookies.get('impersonate_user_id') || null)

  if (!impersonateId) return null

  function handleExit() {
    Cookies.remove('impersonate_user_id')
    Cookies.remove('impersonate_user_email')
    window.location.href = '/admin'
  }

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between z-[100] sticky top-0 font-bold text-sm shadow-lg border-b border-red-700">
      <div className="flex items-center gap-2">
        <Ghost className="w-4 h-4 animate-pulse" />
        <span className="hidden sm:inline">Impersonating User:</span>
        <span className="font-mono text-xs ml-1 bg-black/20 px-2 py-0.5 rounded">{impersonateEmail}</span>
        <span className="ml-2 uppercase tracking-wider text-[10px] bg-black/40 px-2 py-0.5 rounded-full">View Only</span>
      </div>
      <button 
        onClick={handleExit}
        className="flex items-center gap-1 bg-black/20 hover:bg-black/40 px-3 py-1 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" /> Exit
      </button>
    </div>
  )
}
