'use client'

import { useState, useEffect } from 'react'

export interface CookiePreferences {
  necessary: boolean // Always true, can't be disabled
  analytics: boolean
  marketing: boolean
}

const COOKIE_CONSENT_KEY = 'jcs_cookie_consent'
const COOKIE_PREFERENCES_KEY = 'jcs_cookie_preferences'

/**
 * Hook to manage GDPR cookie consent and preferences
 */
export function useCookieConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load consent status and preferences from cookies
    const consentCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith(`${COOKIE_CONSENT_KEY}=`))

    const preferencesCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith(`${COOKIE_PREFERENCES_KEY}=`))

    if (consentCookie) {
      setHasConsented(true)

      if (preferencesCookie) {
        try {
          const savedPrefs = JSON.parse(
            decodeURIComponent(preferencesCookie.split('=')[1])
          )
          setPreferences(savedPrefs)
        } catch (error) {
          console.error('Error parsing cookie preferences:', error)
        }
      }
    } else {
      setHasConsented(false)
    }

    setIsLoading(false)
  }, [])

  const acceptAll = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    savePreferences(prefs)
  }

  const acceptNecessaryOnly = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    savePreferences(prefs)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1) // 1 year expiry

    // Save consent flag
    document.cookie = `${COOKIE_CONSENT_KEY}=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

    // Save preferences
    document.cookie = `${COOKIE_PREFERENCES_KEY}=${encodeURIComponent(
      JSON.stringify(prefs)
    )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

    setPreferences(prefs)
    setHasConsented(true)

    // Clean up cookies based on preferences
    if (!prefs.analytics) {
      // Remove Google Analytics cookies if analytics disabled
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }

    if (!prefs.marketing) {
      // Remove marketing cookies (e.g., Klaviyo tracking)
      // Keep the newsletter signup cookie as it's functional, not marketing
    }
  }

  const resetConsent = () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${COOKIE_PREFERENCES_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    setHasConsented(false)
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    })
  }

  return {
    hasConsented,
    preferences,
    isLoading,
    acceptAll,
    acceptNecessaryOnly,
    savePreferences,
    resetConsent,
  }
}
