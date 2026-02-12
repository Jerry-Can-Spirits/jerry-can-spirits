'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface PromoBannerProps {
  message: string
  ctaText?: string
  ctaLink?: string
  isVisible?: boolean
  onClose?: () => void
}

export default function PromoBanner({ 
  message, 
  ctaText, 
  ctaLink, 
  isVisible = true,
  onClose 
}: PromoBannerProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('promoBannerDismissed')
    if (!dismissed && isVisible) {
      setIsOpen(true)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('promoBannerDismissed', 'true')
    if (onClose) onClose()
  }

  const trackPromoClick = (action: string) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'promo_click', {
        promo_action: action,
        promo_message: message,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="relative bg-gradient-to-r from-jerry-green-600 to-jerry-green-500 text-parchment-50 py-3 px-4 shadow-lg animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center justify-center flex-1 text-center">
          <p className="text-sm font-semibold tracking-wide">
            {message}
          </p>
          
          {ctaText && ctaLink && (
            <a
              href={ctaLink}
              className="ml-4 inline-flex items-center px-4 py-1 bg-parchment-100 text-jerry-green-800 text-sm font-bold rounded-full hover:bg-parchment-200 transition-all duration-200 hover:scale-105"
              onClick={() => trackPromoClick('CTA')}
            >
              {ctaText}
            </a>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-jerry-green-700/30 rounded-full transition-colors duration-200"
          aria-label="Close banner"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

    </div>
  )
}