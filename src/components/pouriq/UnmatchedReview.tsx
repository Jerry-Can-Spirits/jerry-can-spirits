'use client'

import { useState, useTransition } from 'react'
import { PRIMARY_BUTTON, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON } from '@/lib/pouriq/button-styles'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import { saveServeAction } from '@/lib/pouriq/server-actions'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'
import { POUR_PRESETS } from '@/lib/pouriq/measures'

interface UnmatchedItem {
  normalised_name: string
  raw_name: string
  total_quantity: number
  last_seen: string
  suggestion: { cocktail_id: string; name: string } | null
}

interface Props {
  items: UnmatchedItem[]
  cocktails: Array<{ id: string; name: string }>
  serves: Array<{ id: string; name: string }>
  libraryEntries: IngredientLibraryRow[]
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isUnitPriced(entry: IngredientLibraryRow | null): boolean {
  return entry !== null && entry.unit_cost_p !== null
}

function blankIngredient(): FormIngredient {
  return { library_entry: null, pour_ml: '', unit_count: '' }
}

export function UnmatchedReview({ items, cocktails, serves, libraryEntries }: Props) {
  const [rows, setRows] = useState(items)
  const [serveList, setServeList] = useState(serves)
  const [selection, setSelection] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.normalised_name, i.suggestion?.cocktail_id ?? ''])),
  )
  const [serveSelection, setServeSelection] = useState<Record<string, string>>({})
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function remove(name: string) {
    setRows((rs) => rs.filter((r) => r.normalised_name !== name))
  }

  async function postMap(body: Record<string, string>): Promise<boolean> {
    const res = await fetch('/api/pouriq/integrations/unmatched/map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as { error?: string }
      setError(e.error ?? 'Could not save the mapping.')
      return false
    }
    return true
  }

  function confirm(name: string) {
    const cocktailId = selection[name]
    if (!cocktailId) { setError('Pick a cocktail first.'); return }
    setError(null)
    startTransition(async () => {
      if (await postMap({ normalisedName: name, cocktailId })) remove(name)
    })
  }

  function confirmServe(name: string) {
    const serveId = serveSelection[name]
    if (!serveId) { setError('Pick a serve first.'); return }
    setError(null)
    startTransition(async () => {
      if (await postMap({ normalisedName: name, target: 'serve', serveId })) remove(name)
    })
  }

  function ignore(name: string) {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/pouriq/integrations/unmatched/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalisedName: name }),
      })
      if (!res.ok) { setError('Could not update that item.'); return }
      remove(name)
    })
  }

  if (rows.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-12 text-center">
        <p className="text-parchment-200 font-medium mb-1">Nothing to review.</p>
        <p className="text-parchment-400 text-sm">Every till item from your POS is matched to a cocktail.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {rows.map((row) => (
        <div key={row.normalised_name} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 className="text-lg font-serif font-bold text-white">{row.raw_name}</h2>
            <span className="text-xs text-parchment-400">
              {row.total_quantity} {row.total_quantity === 1 ? 'sale' : 'sales'} waiting · last seen {formatDate(row.last_seen)}
            </span>
          </div>
          <label htmlFor={`map-${row.normalised_name}`} className="block text-xs font-medium text-parchment-300 mb-2">
            This is a cocktail
          </label>
          <select
            id={`map-${row.normalised_name}`}
            value={selection[row.normalised_name] ?? ''}
            onChange={(e) => setSelection((s) => ({ ...s, [row.normalised_name]: e.target.value }))}
            disabled={pending}
            className="w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden mb-2"
          >
            <option value="">— Select a cocktail —</option>
            {cocktails.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => confirm(row.normalised_name)} disabled={pending} className={PRIMARY_BUTTON}>
              {pending ? 'Saving…' : 'Confirm cocktail'}
            </button>
            <button type="button" onClick={() => ignore(row.normalised_name)} disabled={pending} className={DESTRUCTIVE_BUTTON}>
              Not a cocktail
            </button>
          </div>

          <label htmlFor={`serve-${row.normalised_name}`} className="block text-xs font-medium text-parchment-300 mb-2">
            Or this is a serve
          </label>
          <select
            id={`serve-${row.normalised_name}`}
            value={serveSelection[row.normalised_name] ?? ''}
            onChange={(e) => setServeSelection((s) => ({ ...s, [row.normalised_name]: e.target.value }))}
            disabled={pending}
            className="w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden mb-2"
          >
            <option value="">— Select a serve —</option>
            {serveList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => confirmServe(row.normalised_name)} disabled={pending} className={PRIMARY_BUTTON}>
              {pending ? 'Saving…' : 'Confirm serve'}
            </button>
            <button
              type="button"
              onClick={() => setCreatingFor((c) => c === row.normalised_name ? null : row.normalised_name)}
              disabled={pending}
              className={SECONDARY_BUTTON_SM}
            >
              {creatingFor === row.normalised_name ? 'Cancel new serve' : 'Create serve'}
            </button>
          </div>

          {creatingFor === row.normalised_name && (
            <ServeCreator
              defaultName={row.raw_name}
              libraryEntries={libraryEntries}
              pending={pending}
              onError={setError}
              onCreate={(name, ingredients) => {
                setError(null)
                startTransition(async () => {
                  try {
                    const { serveId } = await saveServeAction(null, { name, ingredients })
                    if (await postMap({ normalisedName: row.normalised_name, target: 'serve', serveId })) {
                      setServeList((list) => [...list, { id: serveId, name }])
                      setCreatingFor(null)
                      remove(row.normalised_name)
                    }
                  } catch (e) {
                    setError((e as Error).message || 'Could not create the serve.')
                  }
                })
              }}
            />
          )}
        </div>
      ))}
      <p className="text-xs text-parchment-500">
        Confirming a match also recovers the waiting sales (up to 90 days) and remembers the mapping for next time.
      </p>
    </div>
  )
}

interface ServeCreatorProps {
  defaultName: string
  libraryEntries: IngredientLibraryRow[]
  pending: boolean
  onError: (message: string) => void
  onCreate: (name: string, ingredients: Array<{ library_ingredient_id: string; pour_ml: number | null; unit_count: number | null }>) => void
}

function ServeCreator({ defaultName, libraryEntries, pending, onError, onCreate }: ServeCreatorProps) {
  const [name, setName] = useState(defaultName)
  const [ingredients, setIngredients] = useState<FormIngredient[]>([blankIngredient()])

  function updateIngredient(idx: number, patch: Partial<FormIngredient>) {
    setIngredients((arr) => arr.map((ing, i) => i === idx ? { ...ing, ...patch } : ing))
  }

  function submit() {
    if (!name.trim()) { onError('Serve name is required.'); return }
    const parsed: Array<{ library_ingredient_id: string; pour_ml: number | null; unit_count: number | null }> = []
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
    onCreate(name.trim(), parsed)
  }

  return (
    <div className="mt-4 border border-gold-500/20 rounded-lg p-4 bg-jerry-green-900/30 space-y-4">
      <div>
        <label className={labelClass}>Serve name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
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
          {pending ? 'Saving…' : 'Create serve and map'}
        </button>
      </div>
    </div>
  )
}
