'use client'

import { useEffect, useRef } from 'react'

// Window interface for Klaviyo is declared in KlaviyoScript.tsx

export default function KlaviyoEmbed() {
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Tell Klaviyo to open/render the embedded form
    // This is needed for SPAs where the div is rendered after initial page load
    const initKlaviyo = () => {
      if (window._klOnsite) {
        window._klOnsite.push(['openForm', 'SLGWJE'])
      }
    }

    // Try immediately
    initKlaviyo()

    // Also try after a short delay in case Klaviyo script is still loading
    const timeout = setTimeout(initKlaviyo, 1000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <section id="newsletter-signup" className="relative overflow-hidden py-20 lg:py-28">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Klaviyo Embedded Form */}
          <div ref={formRef} className="klaviyo-form-SLGWJE"></div>
        </div>
      </div>
    </section>
  )
}
