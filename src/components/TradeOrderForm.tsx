'use client'

import { useState } from 'react'
import {
  type TradeProduct,
  type TradeCategory,
  CATEGORY_LABELS,
} from '@/lib/trade-products'

type Stage = 'pin' | 'order' | 'loading'

interface VerifyResponse {
  venue_name: string
  tier: string
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

const CATEGORY_ORDER: TradeCategory[] = ['spirits', 'glassware', 'bar-tools', 'sustainability']

function formatPrice(amount: string): string {
  return `£${parseFloat(amount).toFixed(2)}`
}

interface TradeOrderFormProps {
  products: TradeProduct[]
  error?: string
}

export default function TradeOrderForm({ products, error: catalogueError }: TradeOrderFormProps) {
  const [stage, setStage] = useState<Stage>('pin')
  const [pin, setPin] = useState('')
  const [venueName, setVenueName] = useState('')
  const [tier, setTier] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [formError, setFormError] = useState('')

  const setQuantity = (variantId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, Math.min(99, value)) }))
  }

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0)

  const runningTotal = products
    .flatMap((p) => p.variants)
    .reduce((sum, v) => sum + parseFloat(v.price) * (quantities[v.id] ?? 0), 0)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setStage('loading')

    try {
      const res = await fetch('/api/trade/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await res.json() as VerifyResponse

      if (!res.ok) {
        setFormError(data.error ?? 'Invalid PIN.')
        setStage('pin')
        return
      }

      setVenueName(data.venue_name)
      setTier(data.tier)
      setStage('order')
    } catch {
      setFormError('Something went wrong. Please try again.')
      setStage('pin')
    }
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setStage('loading')

    const lines = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, quantity]) => ({ variantId, quantity }))

    try {
      const res = await fetch('/api/trade/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      })
      const data = await res.json() as CheckoutResponse

      if (!res.ok || !data.checkoutUrl) {
        setFormError(data.error ?? 'Failed to start checkout. Please try again.')
        setStage('order')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setFormError('Something went wrong. Please try again.')
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
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
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
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-gold-400 text-sm font-semibold mb-1">{venueName}</p>
        <p className="text-parchment-500 text-xs uppercase tracking-widest">
          {TIER_LABEL[tier] ?? tier} account
        </p>
      </div>

      {catalogueError ? (
        <div className="p-6 bg-jerry-green-800/20 border border-gold-500/20 rounded-xl">
          <p className="text-parchment-300 text-sm">{catalogueError}</p>
          <a
            href="mailto:trade@jerrycanspirits.co.uk"
            className="mt-4 inline-block text-gold-400 hover:text-gold-300 text-sm underline"
          >
            Contact us
          </a>
        </div>
      ) : (
        <form onSubmit={handleOrder} className="space-y-10">
          {CATEGORY_ORDER.map((category) => {
            const categoryProducts = products.filter((p) => p.category === category)
            if (categoryProducts.length === 0) return null

            return (
              <div key={category}>
                <h2 className="text-parchment-500 text-xs uppercase tracking-widest mb-4 pb-2 border-b border-gold-500/10">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="space-y-6">
                  {categoryProducts.map((product) => {
                    const isMultiVariant = product.variants.length > 1 || product.variants[0]?.title !== 'Default Title'

                    return (
                      <div key={product.handle}>
                        {/* Product header */}
                        <div className="flex items-center gap-3 mb-2">
                          {product.featuredImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.featuredImage.url}
                              alt={product.featuredImage.altText ?? product.title}
                              className="w-12 h-12 rounded object-cover flex-shrink-0 border border-gold-500/20"
                            />
                          )}
                          <p className="text-white text-sm font-semibold">{product.title}</p>
                        </div>

                        {/* Variant rows */}
                        <div className={isMultiVariant ? 'pl-16' : ''}>
                          {product.variants.map((variant) => {
                            const qty = quantities[variant.id] ?? 0

                            return (
                              <div
                                key={variant.id}
                                className="flex items-center justify-between gap-4 py-2.5 border-b border-gold-500/10 last:border-0"
                              >
                                <div className="flex-1 min-w-0">
                                  {isMultiVariant && (
                                    <p className="text-parchment-300 text-xs mb-0.5">{variant.title}</p>
                                  )}
                                  <p className="text-parchment-500 text-xs">{formatPrice(variant.price)} each</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setQuantity(variant.id, qty - 1)}
                                    className="w-8 h-8 rounded border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-base font-bold"
                                  >
                                    −
                                  </button>
                                  <span className="text-white text-sm font-serif font-bold w-6 text-center">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setQuantity(variant.id, qty + 1)}
                                    className="w-8 h-8 rounded border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-base font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="pt-4 border-t border-gold-500/20">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-parchment-500 text-xs uppercase tracking-widest">Order total</p>
              <p className="text-gold-400 text-xl font-serif font-bold">
                {formatPrice(runningTotal.toString())}
              </p>
            </div>
            <p className="text-parchment-600 text-xs mb-6">
              Your trade discount will be applied at checkout.
            </p>

            {formError && <p className="text-red-400 text-sm mb-4">{formError}</p>}

            <button
              type="submit"
              disabled={totalItems === 0}
              className="w-full sm:w-auto px-8 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
          </div>
        </form>
      )}

      <p className="mt-8 text-parchment-600 text-xs">
        Questions?{' '}
        <a href="mailto:trade@jerrycanspirits.co.uk" className="text-gold-500 hover:text-gold-400 underline">
          Get in touch
        </a>
      </p>
    </div>
  )
}
