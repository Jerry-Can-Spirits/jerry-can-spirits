'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { BottleMapPoint } from '@/lib/bottle-map'

const ExpeditionLogMap = dynamic(() => import('./ExpeditionLogMap'), { ssr: false })

export default function ExpeditionLogMapClient({ points, className }: { points: BottleMapPoint[], className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const check = () => !!(window.Cookiebot?.consent?.statistics)
    if (check()) setHasConsent(true)

    const onAccept = () => { if (check()) setHasConsent(true) }
    const onDecline = () => setHasConsent(false)
    window.addEventListener('CookiebotOnAccept', onAccept)
    window.addEventListener('CookiebotOnDecline', onDecline)
    return () => {
      window.removeEventListener('CookiebotOnAccept', onAccept)
      window.removeEventListener('CookiebotOnDecline', onDecline)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {isVisible && hasConsent
        ? <ExpeditionLogMap points={points} className="w-full h-full" />
        : <div className="w-full h-full rounded-xl bg-jerry-green-900/60 border border-gold-500/10 flex items-center justify-center">
            {isVisible && !hasConsent && (
              <p className="text-parchment-500 text-sm text-center px-4">
                Accept analytics cookies to view the map.
              </p>
            )}
          </div>
      }
    </div>
  )
}
