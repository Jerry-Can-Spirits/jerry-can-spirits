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
  sku?: string
  name?: string
}

export default function TrustpilotWidget({
  templateId,
  businessUnitId = '68fb4a6f189deab684654fd3',
  height = '400px',
  width = '100%',
  theme = 'dark',
  stars = '',
  locale = 'en-GB',
  sku,
  name,
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Trustpilot script is loaded via Cloudflare Zaraz
    // Wait for Trustpilot to be available and then load the widget
    const loadWidget = () => {
      if (window.Trustpilot && ref.current) {
        window.Trustpilot.loadFromElement(ref.current, true)
      } else if (typeof window !== 'undefined' && !window.Trustpilot) {
        // If Trustpilot isn't loaded yet, try again in 100ms
        setTimeout(loadWidget, 100)
      }
    }

    loadWidget()
  }, [templateId, businessUnitId, sku, name])

  // Build data attributes object, excluding stars if empty
  const dataAttributes: Record<string, string | undefined> = {
    'data-locale': locale,
    'data-template-id': templateId,
    'data-businessunit-id': businessUnitId,
    'data-style-height': height,
    'data-style-width': width,
    'data-theme': theme,
    'data-sku': sku,
    'data-name': name,
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
