'use client'

import { useState } from 'react'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'
import { POUR_PRESETS, GLASS_OPTIONS } from '@/lib/pouriq/measures'
import { PortionHelper } from '@/components/pouriq/PortionHelper'

export interface ServeFormIngredient {
  library_ingredient_id: string
  pour_ml: number | null
  unit_count: number | null
}

interface FormIngredient {
  library_entry: IngredientLibraryRow | null
  pour_ml: string
  unit_count: string
}

const UNIT_CHIPS: Array<{ label: string; value: number }> = [
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1 },
]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'
const chipClass = 'px-2 py-1 rounded-sm border text-xs transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

function isUnitPriced(entry: IngredientLibraryRow | null): boolean {
  return entry !== null && entry.base_unit === 'each'
}

function blankIngredient(): FormIngredient {
  return { library_entry: null, pour_ml: '', unit_count: '' }
}

interface Props {
  defaultName: string
  defaultGlass?: string | null
  defaultIngredients?: ServeFormIngredient[]
  libraryEntries: IngredientLibraryRow[]
  pending: boolean
  submitLabel: string
  onError: (message: string) => void
  onSubmit: (name: string, glass: string | null, ingredients: ServeFormIngredient[]) => void
}

export function ServeForm({ defaultName, defaultGlass, defaultIngredients, libraryEntries, pending, submitLabel, onError, onSubmit }: Props) {
  const [name, setName] = useState(defaultName)
  const [glass, setGlass] = useState(defaultGlass ?? '')
  const [ingredients, setIngredients] = useState<FormIngredient[]>(() => {
    if (!defaultIngredients || defaultIngredients.length === 0) return [blankIngredient()]
    return defaultIngredients.map((ing) => {
      const entry = libraryEntries.find((e) => e.id === ing.library_ingredient_id) ?? null
      return {
        library_entry: entry,
        pour_ml: ing.pour_ml !== null ? ing.pour_ml.toString() : '',
        unit_count: ing.unit_count !== null ? ing.unit_count.toString() : '',
      }
    })
  })

  function updateIngredient(idx: number, patch: Partial<FormIngredient>) {
    setIngredients((arr) => arr.map((ing, i) => i === idx ? { ...ing, ...patch } : ing))
  }

  function submit() {
    if (!name.trim()) { onError('Serve name is required.'); return }
    const parsed: ServeFormIngredient[] = []
    for (let idx = 0; idx < ingredients.length; idx++) {
      const ing = ingredients[idx]
      if (!ing.library_entry) { onError(`Ingredient ${idx + 1}: pick an ingredient or remove the row.`); return }
      if (isUnitPriced(ing.library_entry)) {
        const count = parseFloat(ing.unit_count)
        if (!Number.isFinite(count) || count <= 0) { onError(`Ingredient ${idx + 1} ("${ing.library_entry.name}"): unit count must be > 0.`); return }
        parsed.push({ library_ingredient_id: ing.library_entry.id, pour_ml: null, unit_count: count })
      } else {
        const pour = parseFloat(ing.pour_ml)
        if (!Number.isFinite(pour) || pour <= 0) { onError(`Ingredient ${idx + 1} ("${ing.library_entry.name}"): pour must be > 0 ml.`); return }
        parsed.push({ library_ingredient_id: ing.library_entry.id, pour_ml: pour, unit_count: null })
      }
    }
    if (parsed.length === 0) { onError('Add at least one ingredient.'); return }
    onSubmit(name.trim(), glass.trim() || null, parsed)
  }

  return (
    <div className="mt-4 border border-gold-500/20 rounded-lg p-4 bg-jerry-green-900/30 space-y-4">
      <div>
        <label className={labelClass}>Serve name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Glass</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {GLASS_OPTIONS.map((g) => (
            <button type="button" key={g} onClick={() => setGlass(g)}
              className={`${chipClass} ${glass === g ? chipActive : chipIdle}`}>
              {g}
            </button>
          ))}
        </div>
        <input value={glass} onChange={(e) => setGlass(e.target.value)} className={inputClass} placeholder="e.g. Rocks, Highball" />
      </div>
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
                      <label className={labelClass}>How much per serve</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {UNIT_CHIPS.map((c) => (
                          <button type="button" key={c.value} onClick={() => updateIngredient(idx, { unit_count: c.value.toString() })}
                            className={`${chipClass} ${ing.unit_count === c.value.toString() ? chipActive : chipIdle}`}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <input type="number" step="0.001" min={0} value={ing.unit_count} onChange={(e) => updateIngredient(idx, { unit_count: e.target.value })} className={inputClass} placeholder="custom (e.g., 0.5 for half a lime)" />
                      <PortionHelper className="mt-2" onApply={(v) => updateIngredient(idx, { unit_count: v.toString() })} />
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
                <button type="button" onClick={() => setIngredients((arr) => arr.filter((_, i) => i !== idx))} className="mt-3 text-xs text-parchment-400 hover:text-red-300 underline">
                  Remove ingredient
                </button>
              )}
            </div>
          )
        })}
      </div>
      <button type="button" onClick={() => setIngredients((arr) => [...arr, blankIngredient()])} className="text-sm text-gold-300 hover:text-gold-200 underline">
        Add another ingredient
      </button>
      <div className="flex justify-end">
        <button type="button" onClick={submit} disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  )
}
