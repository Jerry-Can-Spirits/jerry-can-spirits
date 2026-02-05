'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCookieConsent, type CookiePreferences } from '@/hooks/useCookieConsent'

export default function CookiePreferencesPage() {
  const { preferences, isLoading, savePreferences, resetConsent } = useCookieConsent()
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handleSave = () => {
    savePreferences(localPreferences)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (confirm('This will reset all your cookie preferences. Are you sure?')) {
      resetConsent()
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-parchment-200">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-200 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-parchment-50 mb-4">
            Cookie Preferences
          </h1>
          <p className="text-xl text-parchment-200">
            Manage your cookie settings and privacy preferences.
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 p-4 bg-green-800/60 backdrop-blur-sm border border-green-600/30 rounded-xl flex items-center gap-3">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-200">Your preferences have been saved.</span>
          </div>
        )}

        {/* Cookie Categories */}
        <div className="space-y-6 mb-8">
          {/* Necessary Cookies */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">
                  Necessary Cookies
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  These cookies are essential for the website to function properly. They enable core functionality
                  such as security, network management, and accessibility. These cookies cannot be disabled.
                </p>
                <div className="mt-3 text-xs text-parchment-400">
                  <strong>Examples:</strong> Session cookies, security tokens, CSRF protection
                </div>
              </div>
              <div className="ml-4">
                <div className="flex items-center h-6 px-3 bg-jerry-green-700/60 rounded-full">
                  <span className="text-sm font-semibold text-parchment-200">Always Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">
                  Analytics Cookies
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  These cookies help us understand how visitors interact with our website by collecting and
                  reporting information anonymously. This helps us improve the website experience.
                </p>
                <div className="mt-3 text-xs text-parchment-400">
                  <strong>Examples:</strong> Google Analytics (_ga, _gid, _gat)
                </div>
              </div>
              <div className="ml-4">
                <label htmlFor="pref-analytics" className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="pref-analytics"
                    name="pref-analytics"
                    checked={localPreferences.analytics}
                    onChange={(e) =>
                      setLocalPreferences({ ...localPreferences, analytics: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-jerry-green-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-parchment-100 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">
                  Marketing Cookies
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  These cookies track your online activity to help advertisers deliver more relevant advertising
                  or to limit how many times you see an ad. We use these for email marketing and promotional campaigns.
                </p>
                <div className="mt-3 text-xs text-parchment-400">
                  <strong>Examples:</strong> Klaviyo tracking cookies, marketing campaign identifiers
                </div>
              </div>
              <div className="ml-4">
                <label htmlFor="pref-marketing" className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="pref-marketing"
                    name="pref-marketing"
                    checked={localPreferences.marketing}
                    onChange={(e) =>
                      setLocalPreferences({ ...localPreferences, marketing: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-jerry-green-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-parchment-100 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Save Preferences
          </button>
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-jerry-green-700/60 hover:bg-jerry-green-700/80 text-parchment-100 rounded-lg font-semibold uppercase tracking-wide transition-all duration-200 border border-gold-500/30 hover:border-gold-400/50"
          >
            Reset All
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-jerry-green-800/20 backdrop-blur-sm rounded-xl border border-gold-500/10">
          <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
            Need More Information?
          </h3>
          <p className="text-parchment-300 text-sm mb-4">
            For detailed information about the cookies we use and how we process your data, please review our:
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/cookie-policy/"
              className="text-gold-300 hover:text-gold-200 underline text-sm transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/privacy-policy/"
              className="text-gold-300 hover:text-gold-200 underline text-sm transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
