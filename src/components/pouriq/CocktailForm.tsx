'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCocktailAction, deleteCocktailAction } from '@/lib/pouriq/server-actions'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import type { CocktailWithIngredients, IngredientLibraryRow } from '@/lib/pouriq/types'
import { POUR_PRESETS, GLASS_OPTIONS } from '@/lib/pouriq/measures'

const UNIT_CHIPS: Array<{ label: string; value: number }> = [
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1 },
]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-hidden'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'
const chipClass = 'px-2 py-1 rounded-sm border text-xs transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

interface FormIngredient {
  library_entry: IngredientLibraryRow | null
  pour_ml: string
  unit_count: string
}

function ingredientRowToForm(row: CocktailWithIngredients['ingredients'][0]): FormIngredient {
  return {
    library_entry: row.library,
    pour_ml: row.pour_ml?.toString() ?? '',
    unit_count: row.unit_count?.toString() ?? '',
  }
}

function blankIngredient(): FormIngredient {
  return { library_entry: null, pour_ml: '', unit_count: '' }
}

function isUnitPriced(entry: IngredientLibraryRow | null): boolean {
  return entry !== null && entry.unit_cost_p !== null
}

interface Props {
  menuId: string
  cocktail: CocktailWithIngredients | null
  libraryEntries: IngredientLibraryRow[]
}

export function CocktailForm({ menuId, cocktail, libraryEntries }: Props) {
  const router = useRouter()
  const [name, setName] = useState(cocktail?.name ?? '')
  const [salePricePounds, setSalePricePounds] = useState(
    cocktail ? (cocktail.sale_price_p / 100).toFixed(2) : ''
  )
  const [promoPricePounds, setPromoPricePounds] = useState(
    cocktail?.promotional_price_p !== null && cocktail?.promotional_price_p !== undefined
      ? (cocktail.promotional_price_p / 100).toFixed(2) : ''
  )
  const [promoLabel, setPromoLabel] = useState(cocktail?.promotional_label ?? '')
  const [promoDays, setPromoDays] = useState<number[]>(
    cocktail?.promotional_days
      ? cocktail.promotional_days.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      : []
  )
  const [promoValidFrom, setPromoValidFrom] = useState(cocktail?.promotional_valid_from ?? '')
  const [promoValidUntil, setPromoValidUntil] = useState(cocktail?.promotional_valid_until ?? '')
  const [notes, setNotes] = useState(cocktail?.notes ?? '')
  const [glass, setGlass] = useState(cocktail?.glass ?? '')
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    cocktail?.ingredients.length
      ? cocktail.ingredients.map(ingredientRowToForm)
      : [blankIngredient()]
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateIngredient(idx: number, patch: Partial<FormIngredient>) {
    setIngredients((arr) => arr.map((ing, i) => i === idx ? { ...ing, ...patch } : ing))
  }

  function addIngredient() {
    setIngredients((arr) => [...arr, blankIngredient()])
  }

  function removeIngredient(idx: number) {
    setIngredients((arr) => arr.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const sale_price_p = Math.round(Number(salePricePounds) * 100)
    if (!name.trim()) { setError('Drink name is required'); return }
    if (!Number.isFinite(sale_price_p) || sale_price_p <= 0) { setError('Sale price must be > 0'); return }

    const parsed: Array<{ library_ingredient_id: string; pour_ml: number | null; unit_count: number | null }> = []
    for (let idx = 0; idx < ingredients.length; idx++) {
      const ing = ingredients[idx]
      if (!ing.library_entry) {
        setError(`Ingredient ${idx + 1}: pick an ingredient or remove the row`)
        return
      }
      if (isUnitPriced(ing.library_entry)) {
        const count = parseFloat(ing.unit_count)
        if (!Number.isFinite(count) || count <= 0) {
          setError(`Ingredient ${idx + 1} ("${ing.library_entry.name}"): unit count must be > 0`)
          return
        }
        parsed.push({ library_ingredient_id: ing.library_entry.id, pour_ml: null, unit_count: count })
      } else {
        const pour = parseFloat(ing.pour_ml)
        if (!Number.isFinite(pour) || pour <= 0) {
          setError(`Ingredient ${idx + 1} ("${ing.library_entry.name}"): pour must be > 0 ml`)
          return
        }
        parsed.push({ library_ingredient_id: ing.library_entry.id, pour_ml: pour, unit_count: null })
      }
    }

    if (parsed.length === 0) { setError('Add at least one ingredient'); return }

    let promotional_price_p: number | null = null
    const promoTrimmed = promoPricePounds.trim()
    if (promoTrimmed) {
      promotional_price_p = Math.round(Number(promoTrimmed) * 100)
      if (!Number.isFinite(promotional_price_p) || promotional_price_p <= 0) {
        setError('Promo price must be > 0 if set')
        return
      }
      if (promotional_price_p >= sale_price_p) {
        setError('Promo price should be lower than the normal sale price')
        return
      }
    }
    const promotional_label = promoLabel.trim() || null

    let promotional_days: string | null = null
    let promotional_valid_from: string | null = null
    let promotional_valid_until: string | null = null
    if (promotional_price_p !== null) {
      if (promoDays.length > 0 && promoDays.length < 7) {
        promotional_days = [...promoDays].sort((a, b) => a - b).join(',')
      }
      const isoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? s.trim() : null
      promotional_valid_from = isoDate(promoValidFrom)
      promotional_valid_until = isoDate(promoValidUntil)
      if (promotional_valid_from && promotional_valid_until && promotional_valid_until < promotional_valid_from) {
        setError('Promo end date must be on or after the start date')
        return
      }
    }

    setSubmitting(true)
    try {
      await saveCocktailAction(menuId, cocktail?.id ?? null, {
        name: name.trim(),
        sale_price_p,
        promotional_price_p,
        promotional_label,
        promotional_days,
        promotional_valid_from,
        promotional_valid_until,
        notes: notes.trim() || null,
        glass: glass.trim() || null,
        ingredients: parsed,
      })
      router.push(`/trade/pouriq/${menuId}`)
      router.refresh()
    } catch (e) {
      setError((e as Error).message || 'Could not save')
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!cocktail) return
    if (!confirm(`Delete "${cocktail.name}"?`)) return
    await deleteCocktailAction(menuId, cocktail.id)
    router.push(`/trade/pouriq/${menuId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cocktail_name" className={labelClass}>Drink name *</label>
          <input id="cocktail_name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="sale_price" className={labelClass}>Sale price (£) *</label>
          <input id="sale_price" type="number" step="0.01" min={0} required value={salePricePounds} onChange={(e) => setSalePricePounds(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="border border-gold-500/20 rounded-lg p-4 bg-jerry-green-900/30">
        <h3 className="text-sm font-medium text-parchment-100">Promotional price (optional)</h3>
        <p className="text-xs text-parchment-400 mt-1 mb-3">
          Set a promo price for happy hour, 2-4-1, or any period when this drink sells for less. Leave blank if there&rsquo;s no promo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="promo_price" className={labelClass}>Promo price (£)</label>
            <input id="promo_price" type="number" step="0.01" min={0} value={promoPricePounds} onChange={(e) => setPromoPricePounds(e.target.value)} className={inputClass} placeholder="leave blank for none" />
          </div>
          <div>
            <label htmlFor="promo_label" className={labelClass}>Label</label>
            <input id="promo_label" value={promoLabel} onChange={(e) => setPromoLabel(e.target.value)} className={inputClass} placeholder="e.g. Happy hour, 2-4-1" />
          </div>
        </div>
        {promoPricePounds.trim() !== '' && (
          <>
            <div className="mt-4">
              <label className={labelClass}>Active on (leave none selected for every day)</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 1, label: 'Mon' },
                  { value: 2, label: 'Tue' },
                  { value: 3, label: 'Wed' },
                  { value: 4, label: 'Thu' },
                  { value: 5, label: 'Fri' },
                  { value: 6, label: 'Sat' },
                  { value: 0, label: 'Sun' },
                ].map((d) => {
                  const active = promoDays.includes(d.value)
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setPromoDays((arr) => active ? arr.filter((n) => n !== d.value) : [...arr, d.value])}
                      className={`${chipClass} ${active ? chipActive : chipIdle}`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="promo_valid_from" className={labelClass}>Valid from (optional)</label>
                <input id="promo_valid_from" type="date" value={promoValidFrom} onChange={(e) => setPromoValidFrom(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="promo_valid_until" className={labelClass}>Valid until (optional)</label>
                <input id="promo_valid_until" type="date" value={promoValidUntil} onChange={(e) => setPromoValidUntil(e.target.value)} className={inputClass} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border border-gold-500/20 rounded-lg p-4 bg-jerry-green-900/30">
        <h3 className="text-sm font-medium text-parchment-100 mb-4">Ingredients</h3>
        <div className="space-y-4">
          {ingredients.map((ing, idx) => {
            const unitPriced = isUnitPriced(ing.library_entry)
            return (
              <div key={idx} className="border border-gold-500/10 rounded-lg p-3 bg-jerry-green-800/30">
                <label className={labelClass}>Ingredient {idx + 1}</label>
                <IngredientPicker
                  libraryEntries={libraryEntries}
                  selectedEntryId={ing.library_entry?.id ?? null}
                  onChange={(entry) => updateIngredient(idx, {
                    library_entry: entry,
                    pour_ml: isUnitPriced(entry) ? '' : ing.pour_ml,
                    unit_count: isUnitPriced(entry) ? ing.unit_count : '',
                  })}
                />

                {ing.library_entry && (
                  <div className="mt-3">
                    {unitPriced ? (
                      <div>
                        <label className={labelClass}>How much per drink</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {UNIT_CHIPS.map((c) => (
                            <button type="button" key={c.value} onClick={() => updateIngredient(idx, { unit_count: c.value.toString() })}
                              className={`${chipClass} ${ing.unit_count === c.value.toString() ? chipActive : chipIdle}`}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <input type="number" step="0.001" min={0} value={ing.unit_count} onChange={(e) => updateIngredient(idx, { unit_count: e.target.value })} className={inputClass} placeholder="custom (e.g., 0.5 for half a lime)" />
                      </div>
                    ) : (
                      <div>
                        <label className={labelClass}>Pour (ml)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {POUR_PRESETS.map((p) => (
                            <button type="button" key={p.ml} onClick={() => updateIngredient(idx, { pour_ml: p.ml.toString() })}
                              className={`${chipClass} ${ing.pour_ml === p.ml.toString() ? chipActive : chipIdle}`}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <input type="number" step="0.1" min={0} value={ing.pour_ml} onChange={(e) => updateIngredient(idx, { pour_ml: e.target.value })} className={inputClass} placeholder="custom" />
                      </div>
                    )}
                  </div>
                )}

                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(idx)} className="mt-3 text-xs text-parchment-400 hover:text-red-300 underline">
                    Remove ingredient
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" onClick={addIngredient} className="mt-4 text-sm text-gold-300 hover:text-gold-200 underline">
          Add another ingredient
        </button>
      </div>

      <div>
        <label htmlFor="glass" className={labelClass}>Glass</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {GLASS_OPTIONS.map((g) => (
            <button type="button" key={g} onClick={() => setGlass(g)}
              className={`${chipClass} ${glass === g ? chipActive : chipIdle}`}>
              {g}
            </button>
          ))}
        </div>
        <input id="glass" value={glass} onChange={(e) => setGlass(e.target.value)} className={inputClass} placeholder="e.g. Rocks, Highball" />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Directions</label>
        <p className="text-xs text-parchment-400 mb-1">Your method for this drink (build, glass, technique). Shown to staff on the spec card.</p>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-vertical`} placeholder="e.g. Build over cubed ice, stir, lemon twist." />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-between items-center">
        {cocktail ? (
          <button type="button" onClick={handleDelete} className="text-sm text-red-300 hover:text-red-200 underline">
            Delete drink
          </button>
        ) : <span />}
        <button type="submit" disabled={submitting} className="px-6 py-3 bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Saving…' : cocktail ? 'Save changes' : 'Add drink'}
        </button>
      </div>
    </form>
  )
}
