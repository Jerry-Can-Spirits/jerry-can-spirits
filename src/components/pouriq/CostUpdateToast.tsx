'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CostUpdateToastDrink } from '@/lib/pouriq/cost-impact'

interface Props {
  ingredientName: string
  newlyBelowTarget: CostUpdateToastDrink[]
  onDismiss: () => void
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export function CostUpdateToast({ ingredientName, newlyBelowTarget, onDismiss }: Props) {
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 6000)
    return () => clearTimeout(timer)
    // dismiss is stable across renders; safe to omit from deps for parity with SocialProofToast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setDismissing(true)
    setTimeout(() => onDismiss(), 300)
  }

  const count = newlyBelowTarget.length

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-40 rounded-lg border border-gold-500/20 bg-jerry-green-800 p-4 shadow-xl ${
        dismissing ? 'toast-fade-out' : 'toast-slide-in'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />

        <div className="flex-1 text-sm text-parchment-100">
          <p>
            <span className="font-semibold text-gold-400">{ingredientName}</span> updated.
            {count === 1 ? ' 1 drink now below target:' : ` ${count} drinks now below target:`}
          </p>
          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {newlyBelowTarget.map((d) => (
              <li key={d.cocktail_id}>
                <Link
                  href={`/trade/pouriq/${d.menu_id}/edit?cocktail=${d.cocktail_id}`}
                  className="text-gold-300 hover:text-gold-200 underline"
                >
                  {d.cocktail_name}
                </Link>
                <span className="text-parchment-400 text-xs"> {formatPct(d.projected_gp_pct)} (target {d.target_gp_pct}%)</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 text-parchment/40 hover:text-parchment transition-colors"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
