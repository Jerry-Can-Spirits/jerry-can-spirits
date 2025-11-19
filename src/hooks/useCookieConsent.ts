'use client'

import { useState, useEffect } from 'react'

export interface CookiePreferences {
  necessary: boolean // Always true, can't be disabled
  analytics: boolean
  marketing: boolean
}

// Use __Host- prefix for enhanced security on HTTPS
// Falls back to standard names on HTTP (localhost development)
const getSecureCookieName = (baseName: string): string => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `__Host-${baseName}`
  }
  return baseName
}

const COOKIE_CONSENT_KEY = getSecureCookieName('jcs_cookie_consent')
const COOKIE_PREFERENCES_KEY = getSecureCookieName('jcs_cookie_preferences')

// Cookie attributes for security
// Note: HttpOnly cannot be set from client-side JavaScript for security reasons
// Max-Age is set to 1 year (31536000 seconds)
const getCookieAttributes = (): string => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const maxAge = 31536000 // 1 year in seconds

  return isSecure
    ? `path=/; SameSite=Strict; Secure; Max-Age=${maxAge}`
    : `path=/; SameSite=Lax; Max-Age=${maxAge}`
}

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
    const cookieAttributes = getCookieAttributes()

    // Save consent flag
    document.cookie = `${COOKIE_CONSENT_KEY}=true; ${cookieAttributes}`

    // Save preferences
    document.cookie = `${COOKIE_PREFERENCES_KEY}=${encodeURIComponent(
      JSON.stringify(prefs)
    )}; ${cookieAttributes}`

    setPreferences(prefs)
    setHasConsented(true)

    // Clean up cookies based on preferences
    if (!prefs.analytics) {
      // Remove Google Analytics cookies if analytics disabled
      document.cookie = '_ga=; path=/; Max-Age=0'
      document.cookie = '_gid=; path=/; Max-Age=0'
      document.cookie = '_gat=; path=/; Max-Age=0'
    }

    if (!prefs.marketing) {
      // Remove marketing cookies (e.g., Klaviyo tracking)
      // Keep the newsletter signup cookie as it's functional, not marketing
    }
  }

  const resetConsent = () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; Max-Age=0`
    document.cookie = `${COOKIE_PREFERENCES_KEY}=; path=/; Max-Age=0`
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
