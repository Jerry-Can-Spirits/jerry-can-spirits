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
    // GA4 tracking for promo engagement
    console.log('Promo banner clicked:', action)
  }

  if (!isOpen) return null

  return (
    <div className="relative bg-gradient-to-r from-jerry-green-600 to-jerry-green-500 text-parchment-50 py-3 px-4 shadow-lg animate-in slide-in-from-top duration-500">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
            animation: 'promo-drift 20s linear infinite',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto flex items-center justify-between">
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
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
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

      <style jsx>{`
        @keyframes promo-drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40px); }
        }
      `}</style>
    </div>
  )
}