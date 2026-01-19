'use client'

import { useState } from 'react'

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    try {
      const params: Record<string, string> = {
        'g': 'T4uXSb',
        'email': email,
      }

      // Add first name if provided
      if (firstName.trim()) {
        params['$fields'] = '$first_name'
        params['$first_name'] = firstName.trim()
      }

      const response = await fetch('https://manage.kmail-lists.com/ajax/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params)
      })

      const data = await response.json()

      if (data.success || response.ok) {
        setStatus('success')
        setEmail('')
        setFirstName('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section id="newsletter-signup" className="py-16 bg-jerry-green-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 backdrop-blur-sm rounded-xl p-8 border border-green-500/30 text-center">
            <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Welcome to the Mission!</h2>
            <p className="text-green-300">Check your inbox for your discount code.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="newsletter-signup" className="py-16 bg-jerry-green-800/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Join the Mission
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Get 10% Off Your First Order
          </h2>

          <p className="text-parchment-200 text-lg mb-8 max-w-xl mx-auto">
            Sign up for exclusive updates, early access, and a welcome discount.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="sm:w-1/3 px-4 py-3 bg-jerry-green-900/60 border border-gold-500/30 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 px-4 py-3 bg-jerry-green-900/60 border border-gold-500/30 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-gold-600 disabled:cursor-wait text-jerry-green-900 font-bold rounded-lg transition-colors duration-200"
            >
              {status === 'loading' ? 'Joining...' : 'Get My Discount'}
            </button>
          </form>

          {status === 'error' && (
            <p className="mt-4 text-red-400">Something went wrong. Please try again.</p>
          )}

          <p className="mt-6 text-parchment-400 text-sm">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
