'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

// Google Merchant Center id for Jerry Can Spirits.
const MERCHANT_ID = 5723441167

// The Google seller-rating badge. Loaded only after Cookiebot marketing consent,
// matching how the Trustpilot widget is gated. This is the display badge only —
// the post-purchase Google Customer Reviews opt-in is a separate integration that
// runs on the Shopify order-confirmation flow, not here.
export default function GoogleReviewBadge() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    if (window.Cookiebot?.consent?.marketing) setHasConsent(true)

    const handleAccept = () => {
      if (window.Cookiebot?.consent?.marketing) setHasConsent(true)
    }
    const handleDecline = () => setHasConsent(false)

    window.addEventListener('CookiebotOnAccept', handleAccept)
    window.addEventListener('CookiebotOnDecline', handleDecline)
    return () => {
      window.removeEventListener('CookiebotOnAccept', handleAccept)
      window.removeEventListener('CookiebotOnDecline', handleDecline)
    }
  }, [])

  if (!hasConsent) return null

  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onLoad={() => {
        window.merchantwidget?.start({ merchant_id: MERCHANT_ID })
      }}
    />
  )
}

declare global {
  interface Window {
    merchantwidget?: {
      start: (config: { merchant_id: number; position?: string; region?: string }) => void
    }
  }
}
