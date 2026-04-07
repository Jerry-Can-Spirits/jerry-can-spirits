'use client'

import { useState } from 'react'

type Stage = 'pin' | 'order' | 'loading'

interface VerifyResponse {
  venue_name: string
  tier: 'intro' | 'standard' | 'partner'
  error?: string
}

interface CheckoutResponse {
  checkoutUrl: string
  error?: string
}

const TIER_LABEL: Record<string, string> = {
  intro: 'Intro',
  standard: 'Standard',
  partner: 'Partner',
}

export default function TradeOrderForm() {
  const [stage, setStage] = useState<Stage>('pin')
  const [pin, setPin] = useState('')
  const [venueName, setVenueName] = useState('')
  const [tier, setTier] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStage('loading')

    try {
      const res = await fetch('/api/trade/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await res.json() as VerifyResponse

      if (!res.ok) {
        setError(data.error ?? 'Invalid PIN.')
        setStage('pin')
        return
      }

      setVenueName(data.venue_name)
      setTier(data.tier)
      setStage('order')
    } catch {
      setError('Something went wrong. Please try again.')
      setStage('pin')
    }
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStage('loading')

    try {
      const res = await fetch('/api/trade/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      const data = await res.json() as CheckoutResponse

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? 'Failed to start checkout. Please try again.')
        setStage('order')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setError('Something went wrong. Please try again.')
      setStage('order')
    }
  }

  if (stage === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-parchment-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">One moment...</span>
        </div>
      </div>
    )
  }

  if (stage === 'pin') {
    return (
      <div className="max-w-sm">
        <p className="text-parchment-400 text-sm mb-8">
          Enter the trade access PIN from your welcome email.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="trade-pin" className="block text-parchment-500 text-xs uppercase tracking-widest mb-2">
              Trade PIN
            </label>
            <input
              id="trade-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-600 text-sm focus:outline-none focus:border-gold-400 transition-colors tracking-widest"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={!pin.trim()}
            className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
        <p className="mt-6 text-parchment-600 text-xs">
          Don&apos;t have a PIN?{' '}
          <a href="/trade/" className="text-gold-500 hover:text-gold-400 underline">
            Make a trade enquiry
          </a>
        </p>
      </div>
    )
  }

  // stage === 'order'
  return (
    <div className="max-w-sm">
      <p className="text-gold-400 text-sm font-semibold mb-1">{venueName}</p>
      <p className="text-parchment-500 text-xs uppercase tracking-widest mb-8">
        {TIER_LABEL[tier] ?? tier} account
      </p>

      <form onSubmit={handleOrder} className="space-y-6">
        <div>
          <p className="text-parchment-500 text-xs uppercase tracking-widest mb-2">Product</p>
          <p className="text-white font-semibold">Expedition Spiced — Trade Case</p>
          <p className="text-parchment-400 text-sm">6 × 700ml bottles, 40% ABV</p>
<<<<<<< feat/trade-portal-price-display
          <p className="text-gold-400 text-sm font-semibold mt-2">
            £{(210 * quantity).toFixed(2)} inc VAT
            {quantity > 1 && <span className="text-parchment-500 font-normal"> (£210.00 per case)</span>}
          </p>
          <p className="text-parchment-600 text-xs mt-0.5">
            Your trade discount will be applied at checkout.
          </p>
=======
>>>>>>> main
        </div>

        <div>
          <label htmlFor="trade-quantity" className="block text-parchment-500 text-xs uppercase tracking-widest mb-2">
            Cases
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
            <span className="text-white text-xl font-serif font-bold w-8 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
            <span className="text-parchment-400 text-sm">
              {quantity * 6} bottles total
            </span>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors"
        >
          Proceed to Checkout
        </button>
      </form>

      <p className="mt-6 text-parchment-600 text-xs">
        Your trade pricing will be applied automatically at checkout.
        Questions?{' '}
        <a href="mailto:partnerships@jerrycanspirits.co.uk" className="text-gold-500 hover:text-gold-400 underline">
          Get in touch
        </a>
      </p>
    </div>
  )
}
