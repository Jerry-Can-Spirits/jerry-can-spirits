'use client'

import { useEffect, useRef } from 'react'

interface TrustpilotWidgetProps {
  templateId?: string
  businessUnitId?: string
  height?: string
  width?: string
  theme?: 'light' | 'dark'
  stars?: '1,2,3,4,5' | '4,5' | '5'
}

/**
 * Trustpilot Widget Component
 *
 * SETUP INSTRUCTIONS:
 * 1. Sign up at https://www.trustpilot.com/
 * 2. Get your Business Unit ID from Trustpilot dashboard
 * 3. Choose a widget template from: https://businessapp.b2b.trustpilot.com/#/integrations/widgets
 * 4. Replace the placeholder businessUnitId below with your actual ID
 *
 * Common Template IDs:
 * - Mini: '539ad0ffdec7e10e686debd7'
 * - Micro: '53aa8912dec7e10d38f59f36'
 * - Carousel: '54ad5defc6454f065c28af8b'
 * - Mini Carousel: '53aa8807dec7e10d38f59f32'
 * - Slider: '54ad5defc6454f065c28af8b'
 * - Grid: '539adbd6dec7e10e686debee'
 */
export default function TrustpilotWidget({
  templateId = '53aa8912dec7e10d38f59f36', // Micro star rating
  businessUnitId = 'YOUR_BUSINESS_UNIT_ID', // TODO: Replace with your Trustpilot Business Unit ID
  height = '20px',
  width = '100%',
  theme = 'dark',
  stars = '4,5'
}: TrustpilotWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Trustpilot widget script
    const script = document.createElement('script')
    script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'
    script.async = true

    script.onload = () => {
      // Initialize widget after script loads
      if (window.Trustpilot) {
        window.Trustpilot.loadFromElement(widgetRef.current, true)
      }
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // If business unit ID hasn't been set up yet, show a placeholder
  if (businessUnitId === 'YOUR_BUSINESS_UNIT_ID') {
    return (
      <div className="flex items-center gap-3 p-4 bg-jerry-green-800/20 border border-gold-500/20 rounded-lg">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="w-5 h-5 text-gold-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <div className="text-sm text-gray-300">
          Trustpilot reviews (Coming Soon)
        </div>
      </div>
    )
  }

  return (
    <div
      ref={widgetRef}
      className="trustpilot-widget"
      data-locale="en-GB"
      data-template-id={templateId}
      data-businessunit-id={businessUnitId}
      data-style-height={height}
      data-style-width={width}
      data-theme={theme}
      data-stars={stars}
      data-schema-type="Organization"
    >
      <a
        href={`https://www.trustpilot.com/review/jerrycanspirits.co.uk`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold-500 hover:text-gold-400 transition-colors"
      >
        Jerry Can Spirits on Trustpilot
      </a>
    </div>
  )
}

// Type declaration for Trustpilot global
declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement | null, refresh?: boolean) => void
    }
  }
}
