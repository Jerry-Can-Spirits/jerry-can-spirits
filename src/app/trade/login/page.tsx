'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TradePortalHeader } from '@/components/trade-portal/TradePortalHeader'

export default function TradeLoginPage() {
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/trade/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (res.ok) {
        router.push('/trade/landing')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({ error: 'Login failed' })) as { error?: string }
        setError(data.error ?? 'Login failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-jerry-green-950">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <div className="mb-8">
          <TradePortalHeader />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white mb-3">Sign in</h1>
        <p className="text-parchment-400 text-sm mb-10">Enter your trade account PIN to continue.</p>

        <form onSubmit={handleSubmit} className="bg-jerry-green-800 rounded-xl p-6 border border-gold-500/20 space-y-5">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-parchment-200 mb-2">Trade PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting || pin.length === 0}
            aria-disabled={submitting || pin.length === 0}
            className="inline-flex w-full items-center justify-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-parchment-500 mt-6">
          Don&rsquo;t have a trade account?{' '}
          <a href="/trade/apply/" className="text-gold-300 hover:text-gold-400 underline">Apply for one</a>
        </p>
      </div>
    </main>
  )
}
