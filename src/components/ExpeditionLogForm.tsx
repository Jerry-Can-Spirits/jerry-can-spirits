'use client'

import { useState } from 'react'
import Script from 'next/script'

interface Props {
  batchId: string
}

export default function ExpeditionLogForm({ batchId }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const name = (fd.get('name') as string)?.trim() ?? ''
    const location = (fd.get('location') as string)?.trim() ?? ''
    const message = (fd.get('message') as string)?.trim() ?? ''
    const turnstileToken = (fd.get('cf-turnstile-response') as string) ?? ''
    const website = (fd.get('website') as string) ?? ''

    if (!name) {
      setErrorMessage('Name is required.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/expedition-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          batch_id: batchId,
          location: location || undefined,
          message: message || undefined,
          turnstileToken,
          website,
        }),
      })

      if (res.status === 201) {
        setStatus('success')
      } else {
        const data = await res.json() as { error?: string }
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-parchment-300 text-sm">
        {"You're on the log. Welcome to the expedition."}
      </p>
    )
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="log-name" className="block text-parchment-400 text-sm mb-1">
            Your name
          </label>
          <input
            id="log-name"
            type="text"
            name="name"
            required
            maxLength={100}
            placeholder="Your name"
            autoComplete="name"
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label htmlFor="log-location" className="block text-parchment-400 text-sm mb-1">
            Location <span className="text-parchment-600">(optional)</span>
          </label>
          <input
            id="log-location"
            type="text"
            name="location"
            maxLength={100}
            placeholder="City, country"
            autoComplete="off"
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label htmlFor="log-message" className="block text-parchment-400 text-sm mb-1">
            Notes from the field <span className="text-parchment-600">(optional)</span>
          </label>
          <textarea
            id="log-message"
            name="message"
            maxLength={500}
            rows={3}
            placeholder="Notes from the field"
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400 resize-none"
          />
        </div>
        {/* Turnstile widget — auto-populates cf-turnstile-response hidden input */}
        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="dark"
        />
        {/* Honeypot — type="text" so bots fill it, sr-only so humans don't see it */}
        <input
          type="text"
          name="website"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        {status === 'error' && (
          <p className="text-red-400 text-sm">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full sm:w-auto px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {status === 'submitting' ? 'Sending...' : 'Join the Expedition Log'}
        </button>
      </form>
    </>
  )
}
