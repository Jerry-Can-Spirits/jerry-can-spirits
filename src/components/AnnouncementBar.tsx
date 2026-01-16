'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check if user has dismissed the bar in this session
  useEffect(() => {
    setMounted(true)
    const wasDismissed = sessionStorage.getItem('announcement-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  // Set CSS variable for header offset
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty(
        '--announcement-height',
        dismissed ? '0px' : '40px'
      )
    }
    return () => {
      document.documentElement.style.setProperty('--announcement-height', '0px')
    }
  }, [dismissed, mounted])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('announcement-dismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-jerry-green-900 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 text-sm">
          <div className="flex-1 text-center">
            <Link
              href="/shop/product/jerry-can-spirits-expedition-spiced-rum"
              className="inline-flex items-center gap-2 hover:underline font-medium"
            >
              <span className="hidden sm:inline">🥃</span>
              <span>
                <span className="font-semibold">Pre-order Expedition Spiced Rum</span>
                <span className="hidden sm:inline"> — Limited to 700 bottles</span>
                <span className="mx-2">|</span>
                <span className="hidden sm:inline">Ships April 2026</span>
                <span className="sm:hidden">April 2026</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                Pre-order Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 hover:bg-jerry-green-900/10 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss announcement"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
