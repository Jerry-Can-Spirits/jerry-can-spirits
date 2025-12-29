'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Detect iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIOS(isIOSDevice)

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)

      // Don't show again for 30 days after dismissal
      if (daysSinceDismissed < 30) {
        return
      }
    }

    // For iOS devices, show instructions after a few visits
    if (isIOSDevice) {
      // Track visit count
      const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0')
      localStorage.setItem('pwa-visit-count', (visitCount + 1).toString())

      // Show iOS prompt after 3 visits, after 10 seconds
      if (visitCount >= 2) {
        setTimeout(() => {
          setShowIOSPrompt(true)
        }, 10000)
      }
      return
    }

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after 10 seconds of browsing (not immediately)
      setTimeout(() => {
        setShowPrompt(true)
      }, 10000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    setShowPrompt(false)
    setShowIOSPrompt(false)
  }

  // iOS Install Instructions Banner
  if (showIOSPrompt && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300 max-w-[calc(100vw-2rem)]">
        <div className="bg-jerry-green-800 border-2 border-gold-500/30 rounded-lg shadow-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gold-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-jerry-green-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gold-300 mb-2">
                Add to Home Screen
              </h3>
              <p className="text-xs sm:text-sm text-parchment-300 mb-3 leading-relaxed">
                Install Jerry Can Spirits for quick access to cocktail recipes, even offline.
              </p>

              {/* Instructions */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2 text-xs sm:text-sm text-parchment-300">
                  <span className="flex-shrink-0 w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-300 font-bold text-xs">1</span>
                  <span>Tap the Share button
                    <svg className="inline w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-.707.707L20.586 11H4v2h16.586l-5.293 5.293L16 19l7-7-7-7z"/>
                      <path d="M16.5 6.5l-1.414-1.414L20.172 10H4v4h16.172l-5.086 5.086L16.5 20.5l7.5-7.5-7.5-7.5z" transform="rotate(-90 12 12)"/>
                    </svg>
                    in Safari
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm text-parchment-300">
                  <span className="flex-shrink-0 w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-300 font-bold text-xs">2</span>
                  <span>Select &quot;Add to Home Screen&quot;</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm text-parchment-300">
                  <span className="flex-shrink-0 w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-300 font-bold text-xs">3</span>
                  <span>Tap &quot;Add&quot; to install</span>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-jerry-green-700 hover:bg-jerry-green-600 text-parchment-300 font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                Got it
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-parchment-400 hover:text-parchment-200 transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop Install Prompt
  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300 max-w-[calc(100vw-2rem)]">
      <div className="bg-jerry-green-800 border-2 border-gold-500/30 rounded-lg shadow-2xl p-4 sm:p-6 backdrop-blur-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gold-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-jerry-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gold-300 mb-1">
              Add to Home Screen
            </h3>
            <p className="text-xs sm:text-sm text-parchment-300 mb-3 sm:mb-4 leading-relaxed">
              Install Jerry Can Spirits for quick access to cocktail recipes, even offline.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-jerry-green-700 hover:bg-jerry-green-600 text-parchment-300 font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-parchment-400 hover:text-parchment-200 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
