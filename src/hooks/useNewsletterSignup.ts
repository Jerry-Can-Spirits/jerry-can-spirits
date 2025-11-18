'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to check if user has already signed up for the newsletter
 * Reads the jcs_newsletter_signup cookie set by Klaviyo form submission
 */
export function useNewsletterSignup() {
  const [hasSignedUp, setHasSignedUp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for the newsletter signup cookie
    const cookies = document.cookie.split(';')
    const signupCookie = cookies.find(cookie =>
      cookie.trim().startsWith('jcs_newsletter_signup=')
    )

    setHasSignedUp(signupCookie !== undefined)
    setIsLoading(false)
  }, [])

  return { hasSignedUp, isLoading }
}
