'use client'

import { useState } from 'react'

interface Props {
  onApply: (unitCount: number) => void
  className?: string
}

// Converts "this item gives N portions, using M" into a unit_count fraction
// (M / N) and applies it to the recipe's whole-item quantity. Stores nothing.
export function PortionHelper({ onApply, className }: Props) {
  const [per, setPer] = useState('')
  const [used, setUsed] = useState('')
  const perN = parseFloat(per)
  const usedN = parseFloat(used)
  const valid = Number.isFinite(perN) && perN > 0 && Number.isFinite(usedN) && usedN > 0
  const result = valid ? usedN / perN : null

  const inputClass = 'w-16 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded-sm text-parchment-50 text-sm focus:border-gold-400 focus:outline-hidden'
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs text-parchment-400 ${className ?? ''}`}>
      <span>This item gives</span>
      <input type="number" step="1" min={1} value={per} onChange={(e) => setPer(e.target.value)} className={inputClass} placeholder="8" aria-label="portions per item" />
      <span>portions, using</span>
      <input type="number" step="0.5" min={0.001} value={used} onChange={(e) => setUsed(e.target.value)} className={inputClass} placeholder="1" aria-label="portions used" />
      <button
        type="button"
        disabled={result === null}
        onClick={() => result !== null && onApply(Math.round(result * 1000) / 1000)}
        className="px-2 py-1 rounded-sm border border-gold-500/30 text-parchment-200 hover:border-gold-400 disabled:opacity-40 disabled:hover:border-gold-500/30"
      >
        {result === null ? 'Use' : `Use ${Math.round(result * 1000) / 1000}`}
      </button>
    </div>
  )
}
