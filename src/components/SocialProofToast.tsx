'use client'

import { useEffect, useState } from 'react'

interface OrderData {
  title: string
  region: string
  timeAgo: string
}

export default function SocialProofToast() {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('social_proof_seen')) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/recent-orders', { cache: 'no-cache' })
        const data: OrderData | null = await res.json()
        if (!data) return

        setOrder(data)
        setVisible(true)
        sessionStorage.setItem('social_proof_seen', 'true')

        // Auto-dismiss after 6 seconds
        setTimeout(() => dismiss(), 6000)
      } catch {
        // Silently fail — not critical
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setDismissing(true)
    sessionStorage.setItem('social_proof_seen', 'true')
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible || !order) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-40 rounded-lg border border-gold-500/20 bg-jerry-green-800 p-4 shadow-xl ${
        dismissing ? 'toast-fade-out' : 'toast-slide-in'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Gold dot indicator */}
        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gold-500" aria-hidden="true" />

        <p className="flex-1 text-sm text-parchment-100">
          Someone in {order.region} just ordered{' '}
          <span className="font-semibold text-gold-400">{order.title}</span>
          <span className="ml-1 text-parchment-300">— {order.timeAgo}</span>
        </p>

        <button
          onClick={dismiss}
          className="flex-shrink-0 text-parchment/40 hover:text-parchment transition-colors"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
