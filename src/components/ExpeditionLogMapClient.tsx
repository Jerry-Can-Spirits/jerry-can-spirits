'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { ExpeditionLogEntry } from '@/lib/d1'

const ExpeditionLogMap = dynamic(() => import('./ExpeditionLogMap'), { ssr: false })

export default function ExpeditionLogMapClient({ entries, className }: { entries: ExpeditionLogEntry[], className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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
      {isVisible
        ? <ExpeditionLogMap entries={entries} className="w-full h-full" />
        : <div className="w-full h-full rounded-xl bg-jerry-green-900/60 border border-gold-500/10" />
      }
    </div>
  )
}
