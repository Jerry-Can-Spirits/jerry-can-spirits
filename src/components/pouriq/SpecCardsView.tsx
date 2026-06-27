'use client'

import { useState } from 'react'
import type { CocktailWithIngredients } from '@/lib/pouriq/types'
import { SpecCard } from './SpecCard'
import { PrintReportButton } from './PrintReportButton'
import { PRIMARY_BUTTON, SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'

interface Props {
  cocktails: CocktailWithIngredients[]
  costById: Record<string, { pourCostP: number; gpPct: number; complete: boolean }>
  priceIncludesVat: boolean
}

export function SpecCardsView({ cocktails, costById, priceIncludesVat }: Props) {
  const [compact, setCompact] = useState(false)
  const [showCost, setShowCost] = useState(false)

  return (
    <>
      <div className="no-print flex flex-wrap items-center gap-x-4 gap-y-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-slate-500">Layout</span>
          <button type="button" aria-pressed={!compact} onClick={() => setCompact(false)} className={compact ? SECONDARY_BUTTON_SM : PRIMARY_BUTTON}>One per page</button>
          <button type="button" aria-pressed={compact} onClick={() => setCompact(true)} className={compact ? PRIMARY_BUTTON : SECONDARY_BUTTON_SM}>Compact</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showCost} onChange={(e) => setShowCost(e.target.checked)} />
          Show costs
        </label>
        <span className="ml-auto"><PrintReportButton label="Print spec cards" /></span>
      </div>

      <div className={compact ? 'print:grid print:grid-cols-2 print:gap-4' : ''}>
        {cocktails.map((c) => (
          <SpecCard
            key={c.id}
            cocktail={c}
            priceIncludesVat={priceIncludesVat}
            compact={compact}
            showCost={showCost}
            cost={costById[c.id] ?? null}
          />
        ))}
      </div>
    </>
  )
}
