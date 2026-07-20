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
            flex-1 pins the footer to the bottom once the flex context is
            established. min-h-[70svh] adds an INTRINSIC reservation that does
            not depend on that context: on the streamed / service-worker-cached
            path the shell can paint before the flex layout resolves, and without
            an intrinsic min-height the footer flashes up near the top of the
            viewport for a beat before content arrives. 70svh keeps the footer
            below the fold on all viewports while content is pending, without
            leaving a large gap once short content loads (flex-1 still fills the
            rest). */}
        <main id="main-content" className="flex-1 min-h-[70svh] pt-20" style={{ paddingTop: 'calc(5rem + var(--announcement-height, 0px))' }}>
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
