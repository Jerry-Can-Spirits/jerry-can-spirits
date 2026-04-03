'use client'

import { useEffect, useState } from 'react'

interface PreOrderProgressBarProps {
  sold: number
  total: number
}

export default function PreOrderProgressBar({ sold, total }: PreOrderProgressBarProps) {
  const [width, setWidth] = useState(0)
  const percentage = Math.round((sold / total) * 100)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-parchment-200 font-semibold">
          {sold} of {total} bottles reserved
        </span>
        <span className="text-gold-300 font-semibold">{percentage}% claimed</span>
      </div>
      <div className="w-full h-3 bg-jerry-green-800/60 rounded-full overflow-hidden border border-gold-500/20">
        <div
          className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-parchment-400 text-sm mt-2">
        Only {total - sold} bottles remaining
      </p>
    </div>
  )
}
