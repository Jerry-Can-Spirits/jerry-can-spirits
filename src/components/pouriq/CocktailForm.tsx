'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCocktailAction, deleteCocktailAction } from '@/lib/pouriq/server-actions'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import type { CocktailWithIngredients, IngredientLibraryRow } from '@/lib/pouriq/types'

const POUR_CHIPS = [15, 25, 35, 50, 75, 100]
const UNIT_CHIPS: Array<{ label: string; value: number }> = [
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1 },
]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-none'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'
const chipClass = 'px-2 py-1 rounded border text-xs transition-colors'
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
  const [notes, setNotes] = useState(cocktail?.notes ?? '')
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

    setSubmitting(true)
    try {
      await saveCocktailAction(menuId, cocktail?.id ?? null, {
        name: name.trim(),
        sale_price_p,
        notes: notes.trim() || null,
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
                          {POUR_CHIPS.map((ml) => (
                            <button type="button" key={ml} onClick={() => updateIngredient(idx, { pour_ml: ml.toString() })}
                              className={`${chipClass} ${ing.pour_ml === ml.toString() ? chipActive : chipIdle}`}>
                              {ml}ml
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
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-vertical`} />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-between items-center">
        {cocktail ? (
          <button type="button" onClick={handleDelete} className="text-sm text-red-300 hover:text-red-200 underline">
            Delete drink
          </button>
        ) : <span />}
        <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Saving…' : cocktail ? 'Save changes' : 'Add drink'}
        </button>
      </div>
    </form>
  )
}
