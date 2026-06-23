'use client'

import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { PriceInput } from '@/components/pouriq/PriceInput'
import { POUR_PRESETS, BOTTLE_SIZES_ML } from '@/lib/pouriq/measures'
import { formatPurchaseBasis } from '@/lib/pouriq/calculations'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const UNIT_CHIPS = [
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1 },
]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm focus:border-gold-400 focus:outline-hidden'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'
const chipClass = 'px-2 py-1 rounded-sm border text-xs transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

export interface MatchRowState {
  // Either picked an existing library entry...
  existing_library_id?: string
  // ...or staged a new library entry to be created on commit.
  new_library?: {
    name: string
    ingredient_type: IngredientType
    bottle_size_ml: number | null
    bottle_cost_p: number | null
    unit_cost_p: number | null
    purchase_qty: number
  }
  pour_ml: number | null
  unit_count: number | null
}

interface Props {
  extractedName: string
  rawMeasurement: string
  inferredType: IngredientType
  matchKind: 'auto' | 'suggestions' | 'no-match' | 'catalogue'
  suggestionEntries: Array<{ id: string; name: string }>
  libraryEntries: IngredientLibraryRow[]
  state: MatchRowState
  onChange: (state: MatchRowState) => void
  // Fired when this row becomes resolved (existing entry picked, or a new
  // entry's price field blurred) so the parent can bulk-fill matching rows.
  onResolvedCommit?: () => void
}

function isUnitPricedSelection(state: MatchRowState, library: IngredientLibraryRow[]): boolean {
  if (state.new_library) return state.new_library.unit_cost_p !== null
  if (state.existing_library_id) {
    const entry = library.find((e) => e.id === state.existing_library_id)
    return entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined
  }
  return false
}

export function IngredientMatchRow({
  extractedName, rawMeasurement, inferredType,
  matchKind, suggestionEntries, libraryEntries,
  state, onChange, onResolvedCommit,
}: Props) {
  const unitPriced = isUnitPricedSelection(state, libraryEntries)
  const selectedExisting = state.existing_library_id
    ? libraryEntries.find((e) => e.id === state.existing_library_id) ?? null
    : null

  function pickExisting(id: string) {
    onChange({
      existing_library_id: id,
      new_library: undefined,
      pour_ml: state.pour_ml,
      unit_count: state.unit_count,
    })
    // Picking an existing entry resolves the row instantly (no blur).
    onResolvedCommit?.()
  }

  function startNewLibrary() {
    onChange({
      existing_library_id: undefined,
      new_library: {
        name: extractedName,
        ingredient_type: inferredType,
        bottle_size_ml: 700,
        bottle_cost_p: null,
        unit_cost_p: null,
        purchase_qty: 1,
      },
      pour_ml: state.pour_ml,
      unit_count: state.unit_count,
    })
  }

  function updateNewLibrary(patch: Partial<NonNullable<MatchRowState['new_library']>>) {
    if (!state.new_library) return
    onChange({ ...state, new_library: { ...state.new_library, ...patch } })
  }

  function setPour(ml: number | null) {
    onChange({ ...state, pour_ml: ml, unit_count: null })
  }
  function setUnit(count: number | null) {
    onChange({ ...state, unit_count: count, pour_ml: null })
  }

  const matchBadge = matchKind === 'auto'
    ? <span className="text-xs text-emerald-300">auto-matched</span>
    : matchKind === 'catalogue'
      ? <span className="text-xs text-sky-300">from catalogue — set your price</span>
      : matchKind === 'suggestions'
        ? <span className="text-xs text-amber-300">pick a match</span>
        : <span className="text-xs text-red-300">no match in library</span>

  return (
    <div className="border border-gold-500/10 rounded-lg p-3 bg-jerry-green-800/30 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-parchment-100 font-medium">{extractedName}</p>
          <p className="text-xs text-parchment-400 mt-1">menu: &ldquo;{rawMeasurement}&rdquo; · type: {inferredType}</p>
        </div>
        {matchBadge}
      </div>

      {/* Match selection */}
      <div>
        <label className={labelClass}>Library entry</label>
        {state.new_library ? (
          <div className="space-y-2 p-3 rounded-sm border border-gold-500/20 bg-jerry-green-900/30">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-gold-300">Creating new library entry</p>
              <button type="button" onClick={() => onChange({ existing_library_id: undefined, new_library: undefined, pour_ml: state.pour_ml, unit_count: state.unit_count })} className="text-xs text-parchment-400 hover:text-parchment-200">Cancel</button>
            </div>
            <input value={state.new_library.name} onChange={(e) => updateNewLibrary({ name: e.target.value })} className={inputClass} placeholder="Name" />
            {(() => {
              const nl = state.new_library
              const isUnit = nl.unit_cost_p !== null
              const sizeN = nl.bottle_size_ml
              const basis = formatPurchaseBasis({
                bottle_cost_p: nl.bottle_cost_p,
                bottle_size_ml: nl.bottle_size_ml,
                unit_cost_p: nl.unit_cost_p,
                purchase_qty: nl.purchase_qty,
              })
              return (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={nl.ingredient_type} onChange={(e) => updateNewLibrary({ ingredient_type: e.target.value as IngredientType })} className={inputClass}>
                      {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={isUnit ? 'unit' : 'bottle'}
                      onChange={(e) => {
                        if (e.target.value === 'unit') updateNewLibrary({ bottle_size_ml: null, bottle_cost_p: null, unit_cost_p: 0, purchase_qty: nl.purchase_qty })
                        else updateNewLibrary({ bottle_size_ml: 700, bottle_cost_p: 0, unit_cost_p: null, purchase_qty: nl.purchase_qty })
                      }}
                      className={inputClass}
                    >
                      <option value="bottle">By volume (bottles, cans, kegs, BIB)</option>
                      <option value="unit">Per item (limes, garnish)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Price you pay (£)</label>
                      <PriceInput
                        valueP={isUnit ? nl.unit_cost_p : nl.bottle_cost_p}
                        onChangeP={(p) => updateNewLibrary(isUnit ? { unit_cost_p: p } : { bottle_cost_p: p })}
                        onCommit={onResolvedCommit}
                        className={inputClass} placeholder="14.40" />
                    </div>
                    <div>
                      <label className={labelClass}>How many does that buy?</label>
                      <input
                        type="number" step="1" min={1}
                        value={nl.purchase_qty}
                        onChange={(e) => updateNewLibrary({ purchase_qty: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                        className={inputClass} placeholder="1" />
                    </div>
                  </div>
                  <p className="text-xs text-parchment-400">
                    {isUnit ? 'e.g. 6 for a 6-pack' : 'e.g. 24 for a case'}. Leave 1 for a single {isUnit ? 'item' : 'bottle'}.
                  </p>
                  {!isUnit && (
                    <div>
                      <label className={labelClass}>Size of each (ml)</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {BOTTLE_SIZES_ML.map((s) => (
                          <button type="button" key={s} onClick={() => updateNewLibrary({ bottle_size_ml: s })}
                            className={`${chipClass} ${sizeN === s ? chipActive : chipIdle}`}>
                            {s}ml
                          </button>
                        ))}
                      </div>
                      <input
                        type="number" step="1" min={0}
                        value={nl.bottle_size_ml ?? ''}
                        onChange={(e) => updateNewLibrary({ bottle_size_ml: e.target.value === '' ? null : Math.round(Number(e.target.value) || 0) })}
                        className={inputClass} placeholder="330 for a can, 50000 for a keg, 10000 for a 10L BIB" />
                    </div>
                  )}
                  {basis !== '—' && <p className="text-xs text-gold-200">= {basis}</p>}
                </>
              )
            })()}
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={state.existing_library_id ?? ''}
              onChange={(e) => {
                if (e.target.value === '__new__') startNewLibrary()
                else if (e.target.value) pickExisting(e.target.value)
              }}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {matchKind === 'suggestions' && suggestionEntries.length > 0 && (
                <optgroup label="Suggested matches">
                  {suggestionEntries.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              )}
              <optgroup label="All library">
                {libraryEntries.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
              <option value="__new__">+ Create new from this entry</option>
            </select>
            {selectedExisting && (
              <p className="text-xs text-parchment-400">
                Linked to {selectedExisting.name}
                {selectedExisting.bottle_size_ml ? ` · £${((selectedExisting.bottle_cost_p ?? 0)/100).toFixed(2)} / ${selectedExisting.bottle_size_ml}ml` : ''}
                {selectedExisting.unit_cost_p !== null ? ` · £${((selectedExisting.unit_cost_p ?? 0)/100).toFixed(2)} / unit` : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pour or unit count */}
      {(state.existing_library_id || state.new_library) && (
        <div>
          <label className={labelClass}>{unitPriced ? 'How much per drink' : 'Pour (ml)'}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {unitPriced
              ? UNIT_CHIPS.map((c) => (
                  <button type="button" key={c.value} onClick={() => setUnit(c.value)}
                    className={`${chipClass} ${state.unit_count === c.value ? chipActive : chipIdle}`}>
                    {c.label}
                  </button>
                ))
              : POUR_PRESETS.map((p) => (
                  <button type="button" key={p.ml} onClick={() => setPour(p.ml)}
                    className={`${chipClass} ${state.pour_ml === p.ml ? chipActive : chipIdle}`}>
                    {p.label}
                  </button>
                ))}
          </div>
          {unitPriced ? (
            <input type="number" step="0.001" min={0} value={state.unit_count ?? ''} onChange={(e) => setUnit(parseFloat(e.target.value) || 0)} className={inputClass} placeholder="custom" />
          ) : (
            <input type="number" step="0.1" min={0} value={state.pour_ml ?? ''} onChange={(e) => setPour(parseFloat(e.target.value) || 0)} className={inputClass} placeholder="custom" />
          )}
        </div>
      )}
    </div>
  )
}
