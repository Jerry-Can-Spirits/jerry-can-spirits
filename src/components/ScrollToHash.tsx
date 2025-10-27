'use client'

import { useEffect } from 'react'

/**
 * Component that handles smooth scrolling to hash anchors
 * when users navigate from other pages with #newsletter-signup
 */
export default function ScrollToHash() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check if there's a hash in the URL
    const hash = window.location.hash
    if (hash) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
    }
  }, [])

  return null // This component doesn't render anything
}
