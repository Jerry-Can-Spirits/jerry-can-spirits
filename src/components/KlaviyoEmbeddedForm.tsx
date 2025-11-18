'use client'

import { useEffect } from 'react'

// Extend Window interface to include Klaviyo's _learnq property
declare global {
  interface Window {
    _learnq?: unknown[]
  }
}

export default function KlaviyoEmbeddedForm() {
  useEffect(() => {
    // Give Klaviyo script time to load
    const checkKlaviyo = setInterval(() => {
      if (typeof window !== 'undefined' && window._learnq) {
        console.log('Klaviyo loaded successfully')
        clearInterval(checkKlaviyo)
      }
    }, 100)

    return () => clearInterval(checkKlaviyo)
  }, [])

  return (
    <section id="newsletter-signup" className="relative overflow-hidden py-20 lg:py-28">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="klaviyo-form-S8TnNz"></div>
        </div>
      </div>
    </section>
  )
}
