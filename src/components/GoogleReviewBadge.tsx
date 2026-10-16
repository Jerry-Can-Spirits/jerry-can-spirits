'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

// Google Merchant Center id for Jerry Can Spirits.
const MERCHANT_ID = 5723441167

// The element merchantwidget.js appends to <body>. Google never removes it,
// and start() throws if it already exists.
const WRAPPER_ID = 'google-merchantwidget-iframe-wrapper'

// Desktop only: on phones every bottom corner is taken by the recent-orders
// toast, the First Pour bar and the sticky add-to-cart bar, and the widget sits
// above them all (z-index 2147483647).
const DESKTOP_QUERY = '(min-width: 768px)'

export function canShowMerchantWidget(win: Pick<Window, 'Cookiebot' | 'matchMedia'>): boolean {
  return Boolean(win.Cookiebot?.consent?.marketing) && win.matchMedia(DESKTOP_QUERY).matches
}

// LEFT_BOTTOM keeps it clear of the cart drawer and the back-to-top button on
// the right. The loader recognises LEFT_BOTTOM; anything else falls back to
// bottom right.
export function startMerchantWidget(win: Pick<Window, 'merchantwidget'>, doc: Pick<Document, 'getElementById'>): void {
  if (doc.getElementById(WRAPPER_ID)) return
  win.merchantwidget?.start({ merchant_id: MERCHANT_ID, position: 'LEFT_BOTTOM', region: 'GB' })
}

export function removeMerchantWidget(doc: Pick<Document, 'getElementById'>): void {
  doc.getElementById(WRAPPER_ID)?.remove()
}

// The Google Customer Reviews store widget. Loaded only after Cookiebot
// marketing consent, matching how the Trustpilot widget is gated: its iframe is
// served from www.google.com, which sets Google's advertising cookies. This is
// the display badge only; the post-purchase Google Customer Reviews opt-in is a
// separate integration on the Shopify order-confirmation flow, not here.
export default function GoogleReviewBadge() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const update = () => setShow(canShowMerchantWidget(window))
    update()

    const handleDecline = () => {
      removeMerchantWidget(document)
      setShow(false)
    }

    window.addEventListener('CookiebotOnAccept', update)
    window.addEventListener('CookiebotOnDecline', handleDecline)
    return () => {
      window.removeEventListener('CookiebotOnAccept', update)
      window.removeEventListener('CookiebotOnDecline', handleDecline)
      // Otherwise the widget follows the visitor to every page after /reviews.
      removeMerchantWidget(document)
    }
  }, [])

  if (!show) return null

  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="afterInteractive"
      // onReady, not onLoad: it also fires when the page is revisited and the
      // script is already loaded, so the widget comes back on /reviews.
      onReady={() => startMerchantWidget(window, document)}
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
