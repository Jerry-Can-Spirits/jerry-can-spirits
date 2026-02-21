'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/** Country code → shipping/compliance message config */
interface ShippingMessage {
  text: string
  detail?: string
  cta?: { label: string; href: string }
}

const SHIPPING_MESSAGES: Record<string, ShippingMessage> = {
  GB: {
    text: 'Free UK shipping on orders over £50',
    detail: 'All prices include UK duty and VAT.',
  },
  US: {
    text: 'We\'re not yet available in the US',
    detail: 'Sign up to be notified when we launch stateside.',
    cta: { label: 'Notify Me', href: '/#newsletter-signup' },
  },
}

// EU member state codes
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

function getShippingMessage(country: string | null): ShippingMessage | null {
  if (!country) return null
  if (SHIPPING_MESSAGES[country]) return SHIPPING_MESSAGES[country]
  if (EU_COUNTRIES.has(country)) {
    return {
      text: 'EU shipping coming soon',
      detail: 'We\'re working on bringing Expedition Spiced Rum to Europe.',
      cta: { label: 'Get Notified', href: '/#newsletter-signup' },
    }
  }
  // Only show for non-UK international visitors
  if (country !== 'GB') {
    return {
      text: 'International shipping availability varies by region',
      cta: { label: 'Contact Us', href: '/contact/' },
    }
  }
  return null
}

export default function ShippingBanner() {
  const [message, setMessage] = useState<ShippingMessage | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('shipping-banner-dismissed')) {
      setDismissed(true)
      return
    }

    // Check cookie first (set by /api/geo on previous visit)
    const match = document.cookie.match(/(?:^|;\s*)detectedCountry=([A-Z]{2})/)
    if (match) {
      setMessage(getShippingMessage(match[1]))
      return
    }

    // No cookie yet — fetch from geo API (sets cookie for next time)
    fetch('/api/geo')
      .then((res) => res.json() as Promise<{ country: string | null }>)
      .then(({ country }) => setMessage(getShippingMessage(country)))
      .catch(() => { /* silently fail */ })
  }, [])

  if (!message || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('shipping-banner-dismissed', 'true')
  }

  return (
    <div className="bg-jerry-green-800/80 border-t border-gold-400/20 text-gold-300 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 text-center">
            <span className="font-medium">{message.text}</span>
            {message.detail && (
              <span className="hidden sm:inline text-gold-400 ml-2">{message.detail}</span>
            )}
            {message.cta && (
              <Link
                href={message.cta.href}
                className="ml-2 underline underline-offset-2 hover:text-gold-200 transition-colors font-medium"
              >
                {message.cta.label}
              </Link>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gold-400/10 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss shipping info"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
