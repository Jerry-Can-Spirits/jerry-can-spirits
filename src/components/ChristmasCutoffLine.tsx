'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { christmasCutoffLine, christmasGiftCardLine } from '@/lib/delivery'
import { GIFT_CARD_HANDLE } from '@/lib/gift-card'
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
  const [giftLine, setGiftLine] = useState<string | null>(null)

  useEffect(() => {
    const next = christmasCutoffLine()
    setLine(next)
    if (next) trackSiteEvent('shipping_cutoff_seen', { surface })
    // Once the cut-off has passed, the same spot points to the gift card.
    setGiftLine(next ? null : christmasGiftCardLine())
  }, [surface])

  if (giftLine) {
    return (
      <p className={className}>
        <Link href={`/shop/product/${GIFT_CARD_HANDLE}/`} className="underline underline-offset-2">
          {giftLine}
        </Link>
      </p>
    )
  }
  if (!line) return null
  return <p className={className}>{line}</p>
}
