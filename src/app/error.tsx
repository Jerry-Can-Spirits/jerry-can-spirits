'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Per-segment error boundary. Without this, any throw inside an app/ route
 * propagates up to global-error.tsx, which renders a bare-bones browser
 * error screen with no branding or recovery options. This boundary still
 * captures the error to Sentry but presents a usable fallback.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-jerry-green-900">
      <div className="max-w-md w-full text-center">
        <p className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-4">
          Off Course
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
          Something went sideways.
        </h1>
        <p className="text-parchment-300 mb-8 leading-relaxed">
          We&apos;ve been notified and are looking at it. Try the page again, or
          head back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gold-500/40 text-gold-300 font-semibold rounded-lg hover:bg-jerry-green-800/50 transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  )
}
