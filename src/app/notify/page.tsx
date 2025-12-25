'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function NotifyPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/klaviyo-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Thanks for signing up! We\'ll notify you when we launch.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/" className="hover:text-gold-300 transition-colors">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">Notify Me</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 md:p-12 border border-gold-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>

          <div className="relative z-10 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500/20 rounded-full mb-6">
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              Be the First to Know
            </h1>

            <p className="text-xl text-parchment-300 mb-8 max-w-2xl mx-auto">
              Join our mailing list and be notified when Jerry Can Spirits launches.
              Get exclusive early access and special offers for our first customers.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:border-gold-400/40 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Subscribing...' : 'Notify Me'}
                </button>
              </div>
            </form>

            {/* Status Messages */}
            {status === 'success' && (
              <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg mb-4">
                <p className="text-green-300 font-semibold">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg mb-4">
                <p className="text-red-300 font-semibold">{message}</p>
              </div>
            )}

            {/* Additional Info */}
            <p className="text-sm text-parchment-400 mt-6">
              By subscribing, you agree to our{' '}
              <Link href="/privacy-policy" className="text-gold-400 hover:text-gold-300 underline">
                Privacy Policy
              </Link>
              . We respect your privacy and will never share your email.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20">
            <svg className="w-10 h-10 mx-auto mb-3 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <h3 className="text-lg font-serif font-bold text-white mb-2">Early Access</h3>
            <p className="text-parchment-300 text-sm">
              Be among the first to try our spirits when we launch
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20">
            <svg className="w-10 h-10 mx-auto mb-3 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-serif font-bold text-white mb-2">Special Offers</h3>
            <p className="text-parchment-300 text-sm">
              Exclusive discounts and limited edition releases
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20">
            <svg className="w-10 h-10 mx-auto mb-3 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-serif font-bold text-white mb-2">Updates</h3>
            <p className="text-parchment-300 text-sm">
              Stay informed about our journey and product launches
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
