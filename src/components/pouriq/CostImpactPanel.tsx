'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  pricingMode,
  projectCocktail,
  rollupByMenu,
  type CostImpactPayload,
  type ProjectedCocktail,
} from '@/lib/pouriq/cost-impact'

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
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
  const noUsage = projected.length === 0
  const projectedByMenu = new Map<string, ProjectedCocktail[]>()
  for (const p of projected) {
    if (!projectedByMenu.has(p.menu_id)) projectedByMenu.set(p.menu_id, [])
    projectedByMenu.get(p.menu_id)!.push(p)
  }

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
          className="w-48 px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:outline-none"
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

      {noUsage ? (
        <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6 text-sm text-parchment-300">
          This ingredient isn&rsquo;t used in any drinks yet. Add it to a cocktail to see the impact.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rollups.map((r) => {
              const gpDelta = r.projected_avg_gp_pct - r.current_avg_gp_pct
              return (
                <div key={r.menu_id} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5">
                  <Link href={`/trade/pouriq/${r.menu_id}`} className="text-base font-serif font-bold text-white hover:text-gold-200">
                    {r.menu_name}
                  </Link>
                  <p className="text-xs text-parchment-400 mt-1">Target {r.menu_target_gp_pct}% · {r.cocktail_count} drink{r.cocktail_count === 1 ? '' : 's'}</p>
                  <p className="text-sm mt-3 text-parchment-200">
                    Avg GP: {formatPct(r.current_avg_gp_pct)}{' → '}
                    <strong className={gpDelta < 0 ? 'text-amber-300' : gpDelta > 0 ? 'text-emerald-300' : 'text-parchment-100'}>
                      {formatPct(r.projected_avg_gp_pct)}
                    </strong>
                  </p>
                  {r.newly_below_target > 0 && (
                    <p className="text-xs text-red-300 mt-2">
                      {r.newly_below_target} drink{r.newly_below_target === 1 ? '' : 's'} would drop below target after this change.
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {Array.from(projectedByMenu.entries()).map(([menuId, cocktails]) => (
            <div key={menuId} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gold-500/10">
                <Link href={`/trade/pouriq/${menuId}`} className="text-base font-serif font-bold text-white hover:text-gold-200">
                  {cocktails[0].menu_name}
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-jerry-green-900/40">
                    <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                      <th className="px-4 py-3">Drink</th>
                      <th className="px-4 py-3">Sale</th>
                      <th className="px-4 py-3">Now: pour / GP</th>
                      <th className="px-4 py-3">After: pour / GP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cocktails.map((c) => (
                      <tr key={c.cocktail_id} className="border-t border-gold-500/10">
                        <td className="px-4 py-3 text-parchment-100">{c.cocktail_name}</td>
                        <td className="px-4 py-3 text-parchment-200">{formatMoney(c.sale_price_p)}</td>
                        <td className={`px-4 py-3 ${c.below_target_now ? 'text-red-300' : 'text-parchment-200'}`}>
                          {formatMoney(c.current_pour_cost_p)} · {formatPct(c.current_gp_pct)}
                        </td>
                        <td className={`px-4 py-3 ${c.below_target_after ? 'text-red-300' : (c.projected_gp_pct < c.current_gp_pct ? 'text-amber-200' : 'text-parchment-100')}`}>
                          {formatMoney(c.projected_pour_cost_p)} · {formatPct(c.projected_gp_pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
