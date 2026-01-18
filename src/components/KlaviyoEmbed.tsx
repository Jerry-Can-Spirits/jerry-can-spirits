'use client'

import { useEffect } from 'react'

export default function KlaviyoEmbed() {
  useEffect(() => {
    // Klaviyo script is loaded via Cloudflare Zaraz
    // This component just renders the form container
  }, [])

  return (
    <section id="newsletter-signup" className="relative overflow-hidden py-20 lg:py-28">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Klaviyo Embedded Form */}
          <div className="klaviyo-form-SLGWJE"></div>
        </div>
      </div>
    </section>
  )
}
