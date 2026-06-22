'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { IngredientMatchRow, type MatchRowState } from '@/components/pouriq/IngredientMatchRow'
import { normalise } from '@/lib/pouriq/match'
import { planBulkFill, type BulkFillRow } from '@/lib/pouriq/import-bulk-fill'

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'

export interface PreviewDrinkInput {
  name: string
  sale_price_p: number | null
  ingredients: Array<{
    extracted_name: string
    raw_measurement: string
    inferred_type: IngredientType
    parsed:
      | { pour_ml: number }
      | { unit_count: number }
      | { raw: string }
    match:
      | { kind: 'auto'; library_id: string; library_name: string }
      | { kind: 'suggestions'; entries: Array<{ id: string; name: string }> }
      | { kind: 'catalogue'; catalogue_id: string; name: string; ingredient_type: IngredientType; pricing_mode: 'bottle' | 'unit'; default_bottle_size_ml: number | null }
      | { kind: 'no-match' }
  }>
}

// A staged new_library entry is only "resolved" once it carries a usable
// price — catalogue adoptions start price-less and must be filled in.
function newLibraryPriced(nl: NonNullable<MatchRowState['new_library']>): boolean {
  if (nl.unit_cost_p !== null) return nl.unit_cost_p > 0
  return nl.bottle_size_ml !== null && nl.bottle_cost_p !== null && nl.bottle_cost_p > 0
}

function isRowResolved(s: MatchRowState): boolean {
  if (s.existing_library_id) return true
  if (s.new_library) return newLibraryPriced(s.new_library)
  return false
}

// Stable per-row grouping for bulk-fill: catalogue matches group by catalogue
// id (so spelling variants collapse), pickable rows by normalised menu name.
// Auto-matched rows are already resolved and never grouped.
function groupKeyFor(input: PreviewDrinkInput['ingredients'][0]): string | null {
  const m = input.match
  if (m.kind === 'catalogue') return `cat:${m.catalogue_id}`
  if (m.kind === 'suggestions' || m.kind === 'no-match') return `name:${normalise(input.extracted_name)}`
  return null
}

interface DrinkState {
  skip: boolean
  name: string
  salePoundsStr: string
  ingredients: MatchRowState[]
}

function initialIngredientState(input: PreviewDrinkInput['ingredients'][0]): MatchRowState {
  const pour_ml = 'pour_ml' in input.parsed ? input.parsed.pour_ml : null
  const unit_count = 'unit_count' in input.parsed ? input.parsed.unit_count : null
  if (input.match.kind === 'auto') {
    return {
      existing_library_id: input.match.library_id,
      pour_ml,
      unit_count,
    }
  }
  if (input.match.kind === 'catalogue') {
    // Pre-stage a new library entry from the catalogue; the bar just types
    // the price. Starts price-less so it counts as "needs price" until filled.
    const m = input.match
    const isUnit = m.pricing_mode === 'unit'
    return {
      new_library: {
        name: m.name,
        ingredient_type: m.ingredient_type,
        bottle_size_ml: isUnit ? null : (m.default_bottle_size_ml ?? 700),
        bottle_cost_p: null,
        unit_cost_p: isUnit ? 0 : null,
      },
      pour_ml,
      unit_count,
    }
  }
  return { pour_ml, unit_count }
}

function initialDrinkState(d: PreviewDrinkInput): DrinkState {
  return {
    skip: false,
    name: d.name,
    salePoundsStr: d.sale_price_p !== null ? (d.sale_price_p / 100).toFixed(2) : '',
    ingredients: d.ingredients.map(initialIngredientState),
  }
}

interface Props {
  menuId: string
  drinks: PreviewDrinkInput[]
  libraryEntries: IngredientLibraryRow[]
}

export function ImportPreview({ menuId, drinks: extracted, libraryEntries }: Props) {
  const router = useRouter()
  const [drinks, setDrinks] = useState<DrinkState[]>(() => extracted.map(initialDrinkState))
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0, 1, 2]))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const stats = drinks.reduce((acc, d) => {
    if (d.skip) return acc
    acc.included++
    for (const ing of d.ingredients) {
      if (ing.existing_library_id) acc.matched++
      else if (ing.new_library) {
        if (newLibraryPriced(ing.new_library)) acc.toCreate++
        else acc.needsChoice++
      }
      else acc.needsChoice++
    }
    return acc
  }, { included: 0, matched: 0, toCreate: 0, needsChoice: 0 })

  function toggle(idx: number) {
    setExpanded((set) => {
      const next = new Set(set)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  function updateDrink(idx: number, patch: Partial<DrinkState>) {
    setDrinks((arr) => arr.map((d, i) => i === idx ? { ...d, ...patch } : d))
  }

  function updateIngredient(drinkIdx: number, ingIdx: number, state: MatchRowState) {
    setDrinks((arr) => arr.map((d, i) => {
      if (i !== drinkIdx) return d
      return {
        ...d,
        ingredients: d.ingredients.map((ing, j) => j === ingIdx ? state : ing),
      }
    }))
  }

  // When a row resolves, auto-fill every other still-unresolved row for the
  // same ingredient (price/library copied; each drink keeps its own pour/unit).
  // Functional updater so it reads the just-resolved state, not a stale closure.
  function propagateFrom(drinkIdx: number, ingIdx: number) {
    setDrinks((arr) => {
      const flat: BulkFillRow[] = []
      const coords: Array<{ d: number; i: number }> = []
      arr.forEach((d, di) => {
        if (d.skip) return
        d.ingredients.forEach((st, ii) => {
          flat.push({
            groupKey: groupKeyFor(extracted[di].ingredients[ii]),
            resolved: isRowResolved(st),
            state: st,
          })
          coords.push({ d: di, i: ii })
        })
      })
      const sourcePos = coords.findIndex((c) => c.d === drinkIdx && c.i === ingIdx)
      if (sourcePos < 0) return arr
      const plan = planBulkFill(flat, sourcePos)
      if (!plan) return arr
      const next = arr.map((d) => ({ ...d, ingredients: d.ingredients.slice() }))
      for (const t of plan.targets) {
        const { d, i } = coords[t]
        const target = next[d].ingredients[i]
        next[d].ingredients[i] = {
          ...target,
          existing_library_id: plan.apply.existing_library_id,
          new_library: plan.apply.new_library ? { ...plan.apply.new_library } : undefined,
        }
      }
      return next
    })
  }

  async function handleCommit() {
    setError(null)
    if (stats.needsChoice > 0) {
      setError(`${stats.needsChoice} ingredients still need a library match or a price`)
      return
    }
    if (stats.included === 0) {
      setError('No drinks selected for import')
      return
    }

    // Validation: every included drink needs a name + sale price > 0;
    // every kept ingredient needs pour_ml or unit_count > 0.
    for (let i = 0; i < drinks.length; i++) {
      const d = drinks[i]
      if (d.skip) continue
      if (!d.name.trim()) { setError(`Drink ${i + 1} needs a name`); return }
      const sale_price_p = Math.round(parseFloat(d.salePoundsStr) * 100)
      if (!Number.isFinite(sale_price_p) || sale_price_p <= 0) { setError(`${d.name}: needs a sale price`); return }
      for (let j = 0; j < d.ingredients.length; j++) {
        const ing = d.ingredients[j]
        if (!ing.existing_library_id && !ing.new_library) { setError(`${d.name} ingredient ${j + 1} unresolved`); return }
        const hasQty = (ing.pour_ml !== null && ing.pour_ml > 0) || (ing.unit_count !== null && ing.unit_count > 0)
        if (!hasQty) { setError(`${d.name} ingredient ${j + 1} needs a pour or unit count`); return }
      }
    }

    const body = {
      menuId,
      drinks: drinks
        .filter((d) => !d.skip)
        .map((d) => ({
          name: d.name.trim(),
          sale_price_p: Math.round(parseFloat(d.salePoundsStr) * 100),
          ingredients: d.ingredients.map((ing) => ({
            existing_library_id: ing.existing_library_id,
            new_library: ing.new_library,
            pour_ml: ing.pour_ml,
            unit_count: ing.unit_count,
          })),
        })),
    }

    setSubmitting(true)
    const res = await fetch('/api/pouriq/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Commit failed' })) as { error?: string }
      setError(data.error ?? 'Commit failed')
      setSubmitting(false)
      return
    }
    router.push(`/trade/pouriq/${menuId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-jerry-green-800/40 border border-gold-500/30 rounded-xl p-4 text-sm text-parchment-200">
        <p>
          <strong className="text-gold-300">{stats.included}</strong> drinks ·{' '}
          <strong className="text-emerald-300">{stats.matched}</strong> auto-matched ·{' '}
          <strong className="text-amber-300">{stats.toCreate}</strong> new library entries ·{' '}
          {stats.needsChoice > 0
            ? <strong className="text-red-300">{stats.needsChoice} need a choice</strong>
            : <strong className="text-emerald-300">all resolved</strong>}
        </p>
      </div>

      <div className="space-y-4">
        {drinks.map((d, idx) => (
          <div key={idx} className={`border rounded-xl ${d.skip ? 'border-parchment-500/20 bg-jerry-green-900/20' : 'border-gold-500/20 bg-jerry-green-800/40'}`}>
            <button type="button" onClick={() => toggle(idx)} aria-expanded={expanded.has(idx)} aria-controls={`drink-panel-${idx}`} className="w-full text-left p-4 flex items-baseline justify-between gap-3">
              <h3 className={`text-base font-serif font-bold ${d.skip ? 'text-parchment-500 line-through' : 'text-white'}`}>
                {d.name}
              </h3>
              <span className="text-xs text-parchment-400">{expanded.has(idx) ? 'Hide' : 'Show'} ({d.ingredients.length} ing.)</span>
            </button>
            {expanded.has(idx) && (
              <div id={`drink-panel-${idx}`} className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-parchment-300 mb-1">Name</label>
                    <input value={d.name} onChange={(e) => updateDrink(idx, { name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-parchment-300 mb-1">Sale price (£)</label>
                    <input type="number" step="0.01" min={0} value={d.salePoundsStr} onChange={(e) => updateDrink(idx, { salePoundsStr: e.target.value })} className={inputClass} placeholder="0.00" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-parchment-300 cursor-pointer">
                  <input type="checkbox" checked={d.skip} onChange={(e) => updateDrink(idx, { skip: e.target.checked })} className="w-4 h-4 accent-gold-500" />
                  Skip this drink
                </label>
                {!d.skip && d.ingredients.map((_ingState, ingIdx) => {
                  const ing = extracted[idx].ingredients[ingIdx]
                  return (
                  <IngredientMatchRow
                    key={ingIdx}
                    extractedName={ing.extracted_name}
                    rawMeasurement={ing.raw_measurement}
                    inferredType={ing.inferred_type}
                    matchKind={ing.match.kind}
                    suggestionEntries={ing.match.kind === 'suggestions' ? ing.match.entries : []}
                    libraryEntries={libraryEntries}
                    state={d.ingredients[ingIdx]}
                    onChange={(state) => updateIngredient(idx, ingIdx, state)}
                    onResolvedCommit={() => propagateFrom(idx, ingIdx)}
                  />
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={handleCommit} disabled={submitting || stats.needsChoice > 0 || stats.included === 0}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Importing…' : `Import ${stats.included} drink${stats.included === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
