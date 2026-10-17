'use client'

import { useEffect, useState } from 'react'
import { OFFER_ENDED_LINE, OFFER_ENDS_AT, OFFER_LINE, formatTimeLeft, offerLive, timeLeft } from '@/lib/october-offer'

// The landing page is served from an hourly cache, so the server's clock can
// be up to an hour behind the visitor's at the boundary. Both pieces decide
// from the browser's clock once mounted, and the countdown ticks from there.
function useNow(initial?: number): number {
  const [now, setNow] = useState(initial ?? Date.now())
  useEffect(() => {
    setNow(Date.now())
    if (!offerLive(Date.now())) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** The offer sentence while the offer runs; the ended line after. */
export function OfferLine({ now: initial }: { now?: number }) {
  const now = useNow(initial)
  return (
    <p className="text-xl text-parchment-200 leading-relaxed">
      {offerLive(now) ? OFFER_LINE : OFFER_ENDED_LINE}
    </p>
  )
}

/** A small countdown to the end of the offer. Nothing once it has ended. */
export function OfferCountdown({ now: initial }: { now?: number }) {
  const now = useNow(initial)
  const left = timeLeft(now)
  if (!left) return null
  return (
    <p className="text-sm text-parchment-400" aria-live="off">
      Ends in <time dateTime={new Date(OFFER_ENDS_AT).toISOString()} suppressHydrationWarning>{formatTimeLeft(left)}</time>.
    </p>
  )
}
