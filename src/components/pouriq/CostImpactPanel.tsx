'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  pricingMode,
  projectCocktail,
  rollupByMenu,
  type CostImpactPayload,
  type ProjectedCocktail,
} from '@/lib/pouriq/cost-impact'
import { RipplePreview } from './RipplePreview'

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

interface Props {
  ingredientId: string
}

export function CostImpactPanel({ ingredientId }: Props) {
  const [data, setData] = useState<CostImpactPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCostPounds, setNewCostPounds] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/pouriq/library/${encodeURIComponent(ingredientId)}/impact`)
      .then((r) => (r.ok ? (r.json() as Promise<CostImpactPayload>) : Promise.reject(new Error('Could not load impact data'))))
      .then((d) => {
        if (cancelled) return
        setData(d)
        const currentP = d.ingredient.unit_cost_p ?? d.ingredient.bottle_cost_p ?? 0
        setNewCostPounds((currentP / 100).toFixed(2))
        setError(null)
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ingredientId])

  const projection = useMemo(() => {
    if (!data) return null
    const newCostP = Math.round((parseFloat(newCostPounds) || 0) * 100)
    const mode = pricingMode(data.ingredient)
    const currentP = (mode === 'unit' ? data.ingredient.unit_cost_p : data.ingredient.bottle_cost_p) ?? 0
    const delta = newCostP - currentP
    const projected: ProjectedCocktail[] = data.affected.map((c) =>
      projectCocktail(data.ingredient, c, newCostP),
    )
    const rollups = rollupByMenu(projected)
    return { projected, rollups, newCostP, currentP, delta, mode }
  }, [data, newCostPounds])

  if (loading) {
    return <p className="text-sm text-parchment-300">Loading impact…</p>
  }
  if (error || !data || !projection) {
    return <p role="alert" className="text-sm text-red-300">{error ?? 'Could not load impact data'}</p>
  }

  const { ingredient } = data
  const { projected, rollups, currentP, delta, mode } = projection
  const unitLabel = mode === 'unit' ? 'per unit' : `per ${ingredient.bottle_size_ml ?? ''}ml bottle`

  return (
    <div className="space-y-6">
      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6">
        <h2 className="text-lg font-serif font-bold text-white mb-1">Cost change impact</h2>
        <p className="text-sm text-parchment-300 mb-5">
          {ingredient.name} · current {formatMoney(currentP)} {unitLabel}
        </p>

        <label htmlFor="new-cost" className="block text-sm font-medium text-parchment-200 mb-2">
          New cost ({unitLabel})
        </label>
        <input
          id="new-cost"
          type="number"
          step="0.01"
          min={0}
          value={newCostPounds}
          onChange={(e) => setNewCostPounds(e.target.value)}
          className="w-48 px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:outline-hidden"
        />
        <p className="mt-3 text-sm text-parchment-300">
          Change: <strong className={delta === 0 ? 'text-parchment-200' : delta > 0 ? 'text-amber-300' : 'text-emerald-300'}>
            {delta === 0 ? 'no change' : `${delta > 0 ? '+' : ''}${formatMoney(delta)}`}
          </strong>{' '}
          {currentP > 0 && delta !== 0 && (
            <span className="text-parchment-400">({((delta / currentP) * 100).toFixed(1)}%)</span>
          )}
        </p>
      </div>

      <RipplePreview projected={projected} rollups={rollups} />
    </div>
  )
}
