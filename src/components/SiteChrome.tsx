'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import ShippingBanner from './ShippingBanner'
import { LazyCartographicBackground } from './ClientLazy'
import { isPourIqAppRoute } from '@/lib/trade-portal/nav'

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // Pour IQ has its own shell; /qr/* is iframed into the QR landing page and
  // must render bare (no header, footer, banner, or background).
  if (isPourIqAppRoute(pathname) || pathname.startsWith('/qr/')) return <>{children}</>

  return (
    <>
      {/* Unified Cartographic Background */}
      <div className="print:hidden">
        <LazyCartographicBackground opacity={0.75} showCoordinates={true} showCompass={true} className="fixed inset-0 z-0 pointer-events-none" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        {/* Main content with proper spacing for fixed header + announcement bar.
            flex-1 makes it fill the viewport so the footer stays pinned to the
            bottom even while content is empty (first paint, hydration, or a
            navigation to a route whose content is still loading) — otherwise the
            footer flashes up under the header. */}
        <main id="main-content" className="flex-1 pt-20" style={{ paddingTop: 'calc(5rem + var(--announcement-height, 0px))' }}>
          {children}
        </main>

        <div className="print:hidden">
          <ShippingBanner />
        </div>
        <Footer />
      </div>
    </>
  )
}
