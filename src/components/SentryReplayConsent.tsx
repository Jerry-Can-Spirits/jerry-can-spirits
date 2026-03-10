'use client'

import { useEffect } from 'react'

/**
 * Adds Sentry Session Replay only after the user grants statistics consent.
 * Sentry Replay must not initialise automatically — it captures screen content
 * which constitutes personal data under GDPR.
 */
export default function SentryReplayConsent() {
  useEffect(() => {
    let added = false

    async function addReplay() {
      if (added) return
      added = true

      const Sentry = await import('@sentry/nextjs')
      Sentry.addIntegration(
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        })
      )
    }

    function handleConsent() {
      if (window.Cookiebot?.consent?.statistics) {
        addReplay()
      }
    }

    // Returning visitor who already gave consent
    if (window.Cookiebot?.consent?.statistics) {
      addReplay()
    }

    window.addEventListener('CookiebotOnAccept', handleConsent)
    return () => window.removeEventListener('CookiebotOnAccept', handleConsent)
  }, [])

  return null
}
