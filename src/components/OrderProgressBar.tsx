'use client'

import { useEffect, useState } from 'react'

interface OrderProgressBarProps {
  /**
   * How far through the batch we are, 0-100. Drives the fill only: no figure
   * derived from it is rendered. Batch sizes and bottle counts are not
   * published, so the bar conveys scarcity without stating a number.
   */
  percentageClaimed: number
}

export default function OrderProgressBar({ percentageClaimed }: OrderProgressBarProps) {
  const [width, setWidth] = useState(0)
  const clamped = Math.min(100, Math.max(0, percentageClaimed))

  useEffect(() => {
    const timer = setTimeout(() => setWidth(clamped), 100)
    return () => clearTimeout(timer)
  }, [clamped])

  return (
    <div className="mb-8">
      <div className="mb-3">
        <span className="text-parchment-200 font-semibold">Batch No. 001</span>
      </div>
      <div className="w-full h-3 bg-jerry-green-800/60 rounded-full overflow-hidden border border-gold-500/20">
        <div
          className="h-full bg-linear-to-r from-gold-600 to-gold-400 transition-all duration-700"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-parchment-400 text-sm mt-2">
        A limited first batch. Once it is gone, it is gone.
      </p>
    </div>
  )
}
