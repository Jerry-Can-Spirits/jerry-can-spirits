'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import ShippingBanner from './ShippingBanner'
import { LazyCartographicBackground } from './ClientLazy'
import { isPourIqAppRoute } from '@/lib/pouriq/nav'

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (isPourIqAppRoute(pathname)) return <>{children}</>

  return (
    <>
      {/* Unified Cartographic Background */}
      <div className="print:hidden">
        <LazyCartographicBackground opacity={0.75} showCoordinates={true} showCompass={true} className="fixed inset-0 z-0 pointer-events-none" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Main content with proper spacing for fixed header + announcement bar */}
        <main id="main-content" className="pt-20" style={{ paddingTop: 'calc(5rem + var(--announcement-height, 0px))' }}>
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
