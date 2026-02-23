'use client'

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    // Wait for Trustpilot bootstrap script to be available
    const loadWidget = () => {
      if (window.Trustpilot && ref.current) {
        window.Trustpilot.loadFromElement(ref.current, true)
      } else if (typeof window !== 'undefined' && !window.Trustpilot) {
        setTimeout(loadWidget, 100)
      }
    }

    loadWidget()
  }, [templateId, businessUnitId, sku, name])

  // Build data attributes object
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

  // Only include stars attribute if it has a value
  if (stars) {
    dataAttributes['data-stars'] = stars
  }

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      {...dataAttributes}
    >
      <a
        href="https://uk.trustpilot.com/review/jerrycanspirits.co.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold-300 hover:text-gold-400 transition-colors"
      >
        Trustpilot
      </a>
    </div>
  )
}

// TypeScript declaration for Trustpilot
declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement | null, update: boolean) => void
    }
  }
}
