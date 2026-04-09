'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface TrustpilotWidgetProps {
  templateId: string
  businessUnitId?: string
  height?: string
  width?: string
  theme?: 'light' | 'dark'
  stars?: string
  locale?: string
  token?: string
  sku?: string
  name?: string
}

export default function TrustpilotWidget({
  templateId,
  businessUnitId = '68fb4a6f43f3e1eb09b5e0ea',
  height = '400px',
  width = '100%',
  theme = 'dark',
  stars = '',
  locale = 'en-GB',
  token,
  sku,
  name,
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const checkConsent = () => {
      if (window.Cookiebot?.consent?.statistics) {
        setHasConsent(true)
        return true
      }
      return false
    }

    checkConsent()

    const handleAccept = () => {
      if (window.Cookiebot?.consent?.statistics) setHasConsent(true)
    }
    const handleDecline = () => setHasConsent(false)

    window.addEventListener('CookiebotOnAccept', handleAccept)
    window.addEventListener('CookiebotOnDecline', handleDecline)
    return () => {
      window.removeEventListener('CookiebotOnAccept', handleAccept)
      window.removeEventListener('CookiebotOnDecline', handleDecline)
    }
  }, [])

  useEffect(() => {
    if (!hasConsent) return
    const loadWidget = () => {
      if (window.Trustpilot && ref.current) {
        window.Trustpilot.loadFromElement(ref.current, true)
      } else if (!window.Trustpilot) {
        setTimeout(loadWidget, 100)
      }
    }
    loadWidget()
  }, [hasConsent, templateId, businessUnitId, sku, name])

  if (!hasConsent) return null

  const dataAttributes: Record<string, string | undefined> = {
    'data-locale': locale,
    'data-template-id': templateId,
    'data-businessunit-id': businessUnitId,
    'data-style-height': height,
    'data-style-width': width,
    'data-theme': theme,
    'data-sku': sku,
    'data-name': name,
    'data-token': token,
  }

  if (stars) dataAttributes['data-stars'] = stars

  return (
    <>
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
      />
      <div ref={ref} className="trustpilot-widget" {...dataAttributes}>
        <a
          href="https://www.trustpilot.com/review/jerrycanspirits.co.uk"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-gold-300 hover:text-gold-400 transition-colors"
        >
          Read our reviews on Trustpilot
        </a>
      </div>
    </>
  )
}

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement | null, update: boolean) => void
    }
    Cookiebot?: {
      consent: {
        marketing: boolean
        statistics: boolean
        preferences: boolean
        necessary: boolean
      }
      renew: () => void
    }
  }
}
