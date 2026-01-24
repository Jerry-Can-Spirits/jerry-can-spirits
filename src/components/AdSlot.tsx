'use client'

import { useEffect, useRef } from 'react'

// Global flag to enable/disable all ads - flip to true when ready to monetise
const ADS_ENABLED = false

// Ad slot IDs from Google AdSense - replace with your actual slot IDs when created
const AD_SLOTS = {
  sidebar: '1234567890',      // Create in AdSense: Display ad, vertical
  footer: '0987654321',       // Create in AdSense: Display ad, horizontal
  inline: '1122334455',       // Create in AdSense: In-article ad
}

interface AdSlotProps {
  position: 'sidebar' | 'footer' | 'inline'
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>
  }
}

export default function AdSlot({ position, className = '' }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)
  const isLoaded = useRef(false)

  useEffect(() => {
    // Don't load ads if disabled or already loaded
    if (!ADS_ENABLED || isLoaded.current) return

    try {
      // Push ad to AdSense
      if (typeof window !== 'undefined' && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
        isLoaded.current = true
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  // Don't render anything if ads are disabled
  if (!ADS_ENABLED) return null

  // Position-specific styling
  const positionStyles = {
    sidebar: {
      container: 'hidden lg:block', // Desktop only
      ad: 'w-[160px] min-h-[600px]', // Vertical skyscraper
    },
    footer: {
      container: 'block', // All devices
      ad: 'w-full min-h-[100px] max-h-[250px]', // Horizontal banner
    },
    inline: {
      container: 'my-8', // Spacing in content
      ad: 'w-full min-h-[250px]', // In-article rectangle
    },
  }

  const styles = positionStyles[position]

  return (
    <div
      className={`ad-slot ad-slot-${position} ${styles.container} ${className}`}
      aria-label="Advertisement"
    >
      {/* Subtle branded container */}
      <div className="relative bg-jerry-green-800/30 border border-jerry-green-700/30 rounded-lg overflow-hidden">
        {/* Optional: Small "Advertisement" label for transparency */}
        <div className="absolute top-1 left-2 text-[10px] text-parchment-400/50 uppercase tracking-wider">
          Sponsored
        </div>

        <ins
          ref={adRef}
          className={`adsbygoogle block ${styles.ad}`}
          style={{ display: 'block' }}
          data-ad-client="ca-pub-5758288828569326"
          data-ad-slot={AD_SLOTS[position]}
          data-ad-format={position === 'sidebar' ? 'vertical' : 'horizontal'}
          data-full-width-responsive={position !== 'sidebar' ? 'true' : 'false'}
        />
      </div>
    </div>
  )
}

// Wrapper component for sidebar layout with ad
export function ContentWithSidebarAd({ children }: { children: React.ReactNode }) {
  if (!ADS_ENABLED) {
    return <>{children}</>
  }

  return (
    <div className="flex gap-8">
      {/* Left sidebar ad - desktop only */}
      <aside className="hidden lg:block flex-shrink-0 sticky top-32 self-start">
        <AdSlot position="sidebar" />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

// Footer ad component - shows on all devices
export function FooterAd() {
  if (!ADS_ENABLED) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <AdSlot position="footer" />
    </div>
  )
}
