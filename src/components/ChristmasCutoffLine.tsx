'use client'

import { useEffect, useState } from 'react'
import { christmasCutoffLine } from '@/lib/delivery'
import { trackSiteEvent } from '@/components/GoogleTag'

// The Christmas last-order line, decided in the browser so it is right on the
// day regardless of how long the page has sat in a cache. Renders nothing
// until mounted and nothing outside the window (see lib/delivery.ts), so it
// costs no layout where it does not apply.
interface ChristmasCutoffLineProps {
  /** Which surface showed it, for the GA4 event. */
  surface: 'product' | 'shipping' | 'cart'
  className?: string
}

export default function ChristmasCutoffLine({ surface, className = '' }: ChristmasCutoffLineProps) {
  const [line, setLine] = useState<string | null>(null)

  useEffect(() => {
    const next = christmasCutoffLine()
    setLine(next)
    if (next) trackSiteEvent('shipping_cutoff_seen', { surface })
  }, [surface])

  if (!line) return null
  return <p className={className}>{line}</p>
}
