'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCocktailAction, deleteCocktailAction } from '@/lib/pouriq/server-actions'
import type { IngredientType, CocktailWithIngredients } from '@/lib/pouriq/types'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const TYPES_REQUIRING_UNIT_PRICING: IngredientType[] = ['garnish']

interface FormIngredient {
  name: string
  ingredient_type: IngredientType
  pricing_mode: 'bottle' | 'unit'
  pour_ml: string
  bottle_size_ml: string
  bottle_cost_p: string
  unit_cost_p: string
}

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-none'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'

function ingredientRowToForm(row: CocktailWithIngredients['ingredients'][0]): FormIngredient {
  const mode: 'bottle' | 'unit' = row.unit_cost_p !== null ? 'unit' : 'bottle'
  return {
    name: row.name,
    ingredient_type: row.ingredient_type,
    pricing_mode: mode,
    pour_ml: row.pour_ml?.toString() ?? '',
    bottle_size_ml: row.bottle_size_ml?.toString() ?? '',
    bottle_cost_p: row.bottle_cost_p?.toString() ?? '',
    unit_cost_p: row.unit_cost_p?.toString() ?? '',
  }
}

function blankIngredient(): FormIngredient {
  return {
    name: '', ingredient_type: 'spirit', pricing_mode: 'bottle',
    pour_ml: '', bottle_size_ml: '', bottle_cost_p: '', unit_cost_p: '',
  }
}

interface Props {
  menuId: string
  cocktail: CocktailWithIngredients | null
}

export function CocktailForm({ menuId, cocktail }: Props) {
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
    if (!name.trim()) { setError('Cocktail name is required'); return }
    if (!Number.isFinite(sale_price_p) || sale_price_p <= 0) { setError('Sale price must be > 0'); return }

    const parsedIngredients = ingredients.map((ing): {
      name: string
      ingredient_type: IngredientType
      pour_ml: number | null
      bottle_size_ml: number | null
      bottle_cost_p: number | null
      unit_cost_p: number | null
    } | null => {
      if (!ing.name.trim()) return null
      if (ing.pricing_mode === 'bottle') {
        const pour_ml = parseFloat(ing.pour_ml)
        const bottle_size_ml = parseFloat(ing.bottle_size_ml)
        const bottle_cost_p = Math.round(parseFloat(ing.bottle_cost_p) * 100)
        if (!Number.isFinite(pour_ml) || !Number.isFinite(bottle_size_ml) || !Number.isFinite(bottle_cost_p)) return null
        return {
          name: ing.name.trim(), ingredient_type: ing.ingredient_type,
          pour_ml, bottle_size_ml, bottle_cost_p, unit_cost_p: null,
        }
      }
      const unit_cost_p = Math.round(parseFloat(ing.unit_cost_p) * 100)
      if (!Number.isFinite(unit_cost_p)) return null
      return {
        name: ing.name.trim(), ingredient_type: ing.ingredient_type,
        pour_ml: null, bottle_size_ml: null, bottle_cost_p: null, unit_cost_p,
      }
    }).filter((x): x is NonNullable<typeof x> => x !== null)

    if (parsedIngredients.length === 0) { setError('Add at least one ingredient'); return }

    setSubmitting(true)
    try {
      await saveCocktailAction(menuId, cocktail?.id ?? null, {
        name: name.trim(),
        sale_price_p,
        notes: notes.trim() || null,
        ingredients: parsedIngredients,
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
          <label htmlFor="cocktail_name" className={labelClass}>Cocktail name *</label>
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
            const forceUnit = TYPES_REQUIRING_UNIT_PRICING.includes(ing.ingredient_type)
            const effectiveMode: 'bottle' | 'unit' = forceUnit ? 'unit' : ing.pricing_mode
            return (
              <div key={idx} className="border border-gold-500/10 rounded-lg p-3 bg-jerry-green-800/30">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Ingredient</label>
                    <input value={ing.name} onChange={(e) => updateIngredient(idx, { name: e.target.value })} className={inputClass} placeholder="e.g. Vodka" />
                  </div>
                  <div>
                    <label className={labelClass}>Type</label>
                    <select value={ing.ingredient_type} onChange={(e) => updateIngredient(idx, { ingredient_type: e.target.value as IngredientType })} className={inputClass}>
                      {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Pricing mode</label>
                    <select value={effectiveMode} disabled={forceUnit} onChange={(e) => updateIngredient(idx, { pricing_mode: e.target.value as 'bottle' | 'unit' })} className={inputClass}>
                      <option value="bottle">Per bottle</option>
                      <option value="unit">Per unit</option>
                    </select>
                  </div>
                </div>
                {effectiveMode === 'bottle' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Pour (ml)</label>
                      <input type="number" step="0.1" min={0} value={ing.pour_ml} onChange={(e) => updateIngredient(idx, { pour_ml: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Bottle size (ml)</label>
                      <input type="number" step="1" min={0} value={ing.bottle_size_ml} onChange={(e) => updateIngredient(idx, { bottle_size_ml: e.target.value })} className={inputClass} placeholder="700" />
                    </div>
                    <div>
                      <label className={labelClass}>Bottle cost (£)</label>
                      <input type="number" step="0.01" min={0} value={ing.bottle_cost_p} onChange={(e) => updateIngredient(idx, { bottle_cost_p: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Unit cost (£)</label>
                      <input type="number" step="0.01" min={0} value={ing.unit_cost_p} onChange={(e) => updateIngredient(idx, { unit_cost_p: e.target.value })} className={inputClass} />
                    </div>
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
            Delete cocktail
          </button>
        ) : <span />}
        <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Saving…' : cocktail ? 'Save changes' : 'Add cocktail'}
        </button>
      </div>
    </form>
  )
}
