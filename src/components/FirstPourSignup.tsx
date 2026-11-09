'use client'

import { useState } from 'react'
import { identifyKlaviyo } from '@/lib/klaviyo-onsite'
import type { SignupList } from '@/app/api/klaviyo-signup/route'

export const FIRST_POUR_SIGNED_UP_KEY = 'jcs_first_pour_signed_up'

// One form, two lists. The Advance Party (9 Nov 2026) reuses the First Pour
// form with its own copy; the server maps the key to the Klaviyo list.
const COPY: Record<SignupList, {
  interest: string
  button: string
  successTitle: string
  successBody: string
  consent: string
  errorId: string
}> = {
  'first-pour': {
    interest: 'first-pour-book',
    button: 'Send me the book',
    successTitle: 'Check your inbox.',
    successBody: 'The book is on its way. If you do not see it in a few minutes, check your spam folder.',
    consent: 'I agree to receive the book and occasional emails from Jerry Can Spirits. You can unsubscribe at any time. See our',
    errorId: 'first-pour-error',
  },
  'advance-party': {
    interest: 'advance-party',
    button: 'Join the Advance Party',
    successTitle: 'You are in the Advance Party.',
    successBody: 'We write when the next batch is ready to order, before it goes on general sale.',
    consent: 'I am 18 or over and agree to receive Advance Party emails from Jerry Can Spirits. You can unsubscribe at any time. See our',
    errorId: 'advance-party-error',
  },
}

export default function FirstPourSignup({ list = 'first-pour' }: { list?: SignupList }) {
  const copy = COPY[list]
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
          list,
          interests: [copy.interest],
          marketingConsent: consent,
          website: honeypot,
        }),
      })

      if (res.ok) {
        setStatus('success')
        setErrorMessage('')
        // Lets the sitewide First Pour block stand down on this device.
        if (list === 'first-pour') {
          try {
            localStorage.setItem(FIRST_POUR_SIGNED_UP_KEY, '1')
          } catch {
            // Storage blocked: the block simply keeps showing.
          }
        }
        // The server has the profile; the browser still needs telling whose it
        // is, or this visitor's product views and basket adds are discarded.
        identifyKlaviyo(email, firstName)
      } else {
        let serverError = ''
        try {
          const data = await res.json() as { error?: string }
          if (typeof data?.error === 'string') serverError = data.error
        } catch {
          // Body wasn't JSON
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
      <div className="text-center py-6 animate-fade-in">
        <p className="text-white font-semibold text-lg mb-2">{copy.successTitle}</p>
        <p className="text-parchment-400 text-sm">{copy.successBody}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="text"
          name="firstName"
          required
          autoComplete="given-name"
          placeholder="First name"
          aria-label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-base focus:outline-hidden focus:border-gold-400 transition-colors"
        />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email address"
          aria-label="Email address"
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' ? copy.errorId : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-base focus:outline-hidden focus:border-gold-400 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || !consent}
          className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending
            </span>
          ) : copy.button}
        </button>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded-sm border-gold-500/40 bg-jerry-green-900 accent-gold-500 shrink-0"
        />
        <span className="text-parchment-500 text-xs leading-relaxed">
          {copy.consent}{' '}
          <a href="/privacy-policy/" className="underline hover:text-parchment-300 transition-colors">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {status === 'error' && (
        <p id={copy.errorId} role="alert" className="mt-3 text-red-400 text-xs">
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
