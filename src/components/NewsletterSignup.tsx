'use client'

import { useState } from 'react'

const NEWSLETTER_LIST_ID = 'RcxQRP'

export default function NewsletterSignup() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) return

    setStatus('submitting')

    try {
      const res = await fetch('/api/klaviyo-signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          email,
          listId: NEWSLETTER_LIST_ID,
          marketingConsent: consent,
          website: honeypot,
        }),
      })

      if (res.ok) {
        setStatus('success')
        setErrorMessage('')
        // Set cookie so the form can be hidden elsewhere if needed
        document.cookie = 'jcs_newsletter_signup=1; path=/; max-age=31536000; SameSite=Lax'
      } else {
        let serverError = ''
        try {
          const data = await res.json() as { error?: string }
          if (typeof data?.error === 'string') serverError = data.error
        } catch {
          // Body wasn't JSON — keep the generic fallback below
        }
        setErrorMessage(serverError)
        setStatus('error')
      }
    } catch {
      setErrorMessage('')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4 animate-fade-in">
        <p className="text-white font-semibold mb-1">You are in.</p>
        <p className="text-parchment-400 text-sm">
          Check your inbox. Your 10% discount code will be waiting.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          name="firstName"
          required
          autoComplete="given-name"
          placeholder="First name"
          aria-label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="flex-1 px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-base focus:outline-none focus:border-gold-400 transition-colors"
        />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email address"
          aria-label="Email address"
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-base focus:outline-none focus:border-gold-400 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || !consent}
          className="px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'submitting' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending
            </span>
          ) : 'Join the Expedition'}
        </button>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gold-500/40 bg-jerry-green-900 accent-gold-500 flex-shrink-0"
        />
        <span className="text-parchment-500 text-xs leading-relaxed">
          I agree to receive marketing emails from Jerry Can Spirits. You can unsubscribe at any time. See our{' '}
          <a href="/privacy-policy/" className="underline hover:text-parchment-300 transition-colors">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {status === 'error' && (
        <p id="newsletter-error" role="alert" className="mt-3 text-red-400 text-xs">
          {errorMessage || (
            <>
              Something went wrong. Try again or email{' '}
              <a href="mailto:hello@jerrycanspirits.co.uk" className="underline">
                hello@jerrycanspirits.co.uk
              </a>
              .
            </>
          )}
        </p>
      )}
    </form>
  )
}
