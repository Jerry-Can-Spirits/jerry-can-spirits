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

    // Listen for Klaviyo form submission success
    const handleFormSubmit = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.formId === 'S8TnNz') {
        // Set cookie for 1 year when form is successfully submitted
        const expires = new Date()
        expires.setFullYear(expires.getFullYear() + 1)
        document.cookie = `jcs_newsletter_signup=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
        console.log('Newsletter signup cookie set')
      }
    }

    // Klaviyo fires this event on successful form submission
    window.addEventListener('klaviyoForms:submit', handleFormSubmit)

    return () => {
      clearInterval(checkKlaviyo)
      window.removeEventListener('klaviyoForms:submit', handleFormSubmit)
    }
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
