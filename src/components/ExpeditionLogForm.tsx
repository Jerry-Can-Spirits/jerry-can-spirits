'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

interface Props {
  batchId: string
}

interface BottleEntry {
  type: 'standard' | 'premium' | 'founder'
  number: string
}

const BOTTLE_TYPES: { value: BottleEntry['type']; label: string }[] = [
  { value: 'standard', label: 'Batch 001' },
  { value: 'premium', label: 'Premium' },
  { value: 'founder', label: 'Founder' },
]

const MAX_BOTTLES = 20

export default function ExpeditionLogForm({ batchId }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [bottles, setBottles] = useState<BottleEntry[]>([{ type: 'standard', number: '' }])

  const addBottle = () => {
    if (bottles.length < MAX_BOTTLES) {
      setBottles([...bottles, { type: 'standard', number: '' }])
    }
  }

  const removeBottle = (index: number) => {
    setBottles(bottles.filter((_, i) => i !== index))
  }

  const updateBottle = (index: number, field: keyof BottleEntry, value: string) => {
    setBottles(bottles.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const name = (fd.get('name') as string)?.trim() ?? ''
    const location = (fd.get('location') as string)?.trim() ?? ''
    const turnstileToken = (fd.get('cf-turnstile-response') as string) ?? ''
    const website = (fd.get('website') as string) ?? ''

    if (!name) {
      setErrorMessage('Name is required.')
      setStatus('error')
      return
    }

    for (const bottle of bottles) {
      if (!bottle.number) {
        setErrorMessage('Enter a bottle number for each bottle.')
        setStatus('error')
        return
      }
      const n = parseInt(bottle.number, 10)
      if (!Number.isInteger(n) || n < 1) {
        setErrorMessage('Bottle numbers must be positive whole numbers.')
        setStatus('error')
        return
      }
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
          bottles: bottles.map((b) => ({ type: b.type, number: parseInt(b.number, 10) })),
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
        <div className="space-y-2">
          <label className="block text-parchment-400 text-sm">
            Your {bottles.length === 1 ? 'bottle' : 'bottles'}
          </label>
          {bottles.map((bottle, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={bottle.type}
                onChange={(e) => updateBottle(i, 'type', e.target.value)}
                className="px-3 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-400"
              >
                {BOTTLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={bottle.number}
                onChange={(e) => updateBottle(i, 'number', e.target.value)}
                placeholder="Bottle no."
                className="w-32 px-3 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400"
              />
              {bottles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBottle(i)}
                  className="text-parchment-500 hover:text-parchment-300 text-sm px-2"
                  aria-label="Remove bottle"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {bottles.length < MAX_BOTTLES && (
            <button
              type="button"
              onClick={addBottle}
              className="text-gold-400 hover:text-gold-300 text-sm"
            >
              + Add another bottle
            </button>
          )}
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
        <p className="text-xs text-parchment-500">
          By submitting, your name and location will appear publicly on the Expedition Log.{' '}
          <Link href="/privacy-policy/" className="underline hover:text-parchment-400 transition-colors">
            Privacy policy.
          </Link>
        </p>
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
