'use client'

import { useState } from 'react'

interface Variant {
  id: string
  title: string
}

export default function BackInStockForm({ variants }: { variants: Variant[] }) {
  const [email, setEmail] = useState('')
  const [variantId, setVariantId] = useState(variants[0]?.id ?? '')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const pickVariant = variants.length > 1 && variants.some(v => v.title !== 'Default Title')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/back-in-stock/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, variantId, website: honeypot }),
      })
      if (res.ok) {
        setStatus('success')
        return
      }
      let serverError = ''
      try {
        const data = await res.json() as { error?: string }
        if (typeof data?.error === 'string') serverError = data.error
      } catch {
        // Body wasn't JSON
      }
      setErrorMessage(serverError)
      setStatus('error')
    } catch {
      setErrorMessage('')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-gold-500/30 p-5 text-center">
        <p className="text-white font-semibold mb-1">You are on the list.</p>
        <p className="text-parchment-400 text-sm">We will email you once, when it is back in stock.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative rounded-lg border border-gold-500/30 p-5">
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
      <p className="text-white font-semibold mb-1">Sold out for now.</p>
      <p className="text-parchment-400 text-sm mb-4">
        Leave your email and we will write once, when it is back. Nothing else.
      </p>
      <div className="flex flex-col gap-3">
        {pickVariant && (
          <select
            aria-label="Option"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white text-base focus:outline-hidden focus:border-gold-400"
          >
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        )}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email address"
          aria-label="Email address"
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' ? 'back-in-stock-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-base focus:outline-hidden focus:border-gold-400 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending' : 'Email me when it is back'}
        </button>
      </div>
      {status === 'error' && (
        <p id="back-in-stock-error" role="alert" className="mt-3 text-red-400 text-xs">
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
