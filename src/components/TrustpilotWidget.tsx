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
  stars = '4,5',
  locale = 'en-GB',
  sku,
  name,
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Trustpilot script if not already loaded
    if (typeof window !== 'undefined' && !window.Trustpilot) {
      const script = document.createElement('script')
      script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'
      script.async = true
      script.onload = () => {
        if (window.Trustpilot) {
          window.Trustpilot.loadFromElement(ref.current, true)
        }
      }
      document.head.appendChild(script)
    } else if (window.Trustpilot && ref.current) {
      // Reload widget if Trustpilot is already loaded
      window.Trustpilot.loadFromElement(ref.current, true)
    }
  }, [templateId, businessUnitId, sku, name])

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale={locale}
      data-template-id={templateId}
      data-businessunit-id={businessUnitId}
      data-style-height={height}
      data-style-width={width}
      data-theme={theme}
      data-stars={stars}
      data-sku={sku}
      data-name={name}
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
