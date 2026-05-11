'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-8">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Trade Portal</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-white mb-3">Sign in</h1>
        <p className="text-parchment-400 text-sm mb-10">Enter your trade account PIN to continue.</p>

        <form onSubmit={handleSubmit} className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 space-y-5">
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
              className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={submitting || pin.length === 0}
            aria-disabled={submitting || pin.length === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-jerry-green-900 font-semibold rounded-lg transition-all"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-parchment-500 mt-6">
          Don&rsquo;t have a trade account?{' '}
          <a href="/trade/apply/" className="text-gold-300 hover:text-gold-200 underline">Apply for one</a>
        </p>
      </div>
    </main>
  )
}
