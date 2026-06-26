'use client'

import type { IngredientLibraryRow, IngredientType, ServeUnitRow } from '@/lib/pouriq/types'
import { PriceInput } from '@/components/pouriq/PriceInput'
import { ServeUnitPicker } from '@/components/pouriq/ServeUnitPicker'
import { BOTTLE_SIZES_ML, WEIGHT_SIZES_G, KEG_SIZES_ML } from '@/lib/pouriq/measures'
import type { ServeUnit } from '@/lib/pouriq/measures'
import { formatPurchaseBasis } from '@/lib/pouriq/calculations'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','cider','mixer','syrup','juice','garnish','soft-drink','alcohol-free','food','other']

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
    base_unit: 'ml' | 'g' | 'each'
    pack_size: number
    price_p: number | null
    purchase_qty: number
    pack_format?: string | null
    subcategory?: string | null
  }
  pour_ml: number | null
  unit_count: number | null
  recipe_unit: string | null
  recipe_qty: number | null
}

interface Props {
  extractedName: string
  rawMeasurement: string
  inferredType: IngredientType
  matchKind: 'auto' | 'suggestions' | 'no-match' | 'catalogue'
  suggestionEntries: Array<{ id: string; name: string }>
  libraryEntries: IngredientLibraryRow[]
  serveUnits: Record<string, ServeUnitRow[]>
  state: MatchRowState
  onChange: (state: MatchRowState) => void
  // Fired when this row becomes resolved (existing entry picked, or a new
  // entry's price field blurred) so the parent can bulk-fill matching rows.
  onResolvedCommit?: () => void
}

function resolvedBaseUnit(state: MatchRowState, library: IngredientLibraryRow[]): 'ml' | 'g' | 'each' {
  if (state.new_library) return state.new_library.base_unit
  if (state.existing_library_id) {
    return library.find((e) => e.id === state.existing_library_id)?.base_unit ?? 'ml'
  }
  return 'ml'
}

export function IngredientMatchRow({
  extractedName, rawMeasurement, inferredType,
  matchKind, suggestionEntries, libraryEntries, serveUnits,
  state, onChange, onResolvedCommit,
}: Props) {
  const baseUnit = resolvedBaseUnit(state, libraryEntries)
  const selectedExisting = state.existing_library_id
    ? libraryEntries.find((e) => e.id === state.existing_library_id) ?? null
    : null

  const customUnits: ServeUnit[] = selectedExisting
    ? (serveUnits[selectedExisting.id] ?? [])
    : []

  function pickExisting(id: string) {
    onChange({
      existing_library_id: id,
      new_library: undefined,
      pour_ml: state.pour_ml,
      unit_count: state.unit_count,
      recipe_unit: state.recipe_unit,
      recipe_qty: state.recipe_qty,
    })
    onResolvedCommit?.()
  }

  function startNewLibrary() {
    onChange({
      existing_library_id: undefined,
      new_library: {
        name: extractedName,
        ingredient_type: inferredType,
        base_unit: 'ml',
        pack_size: 700,
        price_p: null,
        purchase_qty: 1,
      },
      pour_ml: state.pour_ml,
      unit_count: state.unit_count,
      recipe_unit: state.recipe_unit,
      recipe_qty: state.recipe_qty,
    })
  }

  function updateNewLibrary(patch: Partial<NonNullable<MatchRowState['new_library']>>) {
    if (!state.new_library) return
    onChange({ ...state, new_library: { ...state.new_library, ...patch } })
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
              <button type="button" onClick={() => onChange({ existing_library_id: undefined, new_library: undefined, pour_ml: state.pour_ml, unit_count: state.unit_count, recipe_unit: state.recipe_unit, recipe_qty: state.recipe_qty })} className="text-xs text-parchment-400 hover:text-parchment-200">Cancel</button>
            </div>
            <input value={state.new_library.name} onChange={(e) => updateNewLibrary({ name: e.target.value })} className={inputClass} placeholder="Name" />
            {(() => {
              const nl = state.new_library
              const basis = nl.price_p !== null && nl.price_p > 0
                ? formatPurchaseBasis({ base_unit: nl.base_unit, pack_size: nl.pack_size, price_p: nl.price_p, purchase_qty: nl.purchase_qty })
                : null
              const sizePresets = nl.base_unit === 'ml'
                ? (nl.ingredient_type === 'beer' ? [...BOTTLE_SIZES_ML, ...KEG_SIZES_ML] : BOTTLE_SIZES_ML)
                : nl.base_unit === 'g' ? WEIGHT_SIZES_G : null
              return (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={nl.ingredient_type} onChange={(e) => updateNewLibrary({ ingredient_type: e.target.value as IngredientType })} className={inputClass}>
                      {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={nl.base_unit}
                      onChange={(e) => {
                        const bu = e.target.value as 'ml' | 'g' | 'each'
                        const defaultSize = bu === 'ml' ? 700 : bu === 'g' ? 1000 : 1
                        updateNewLibrary({ base_unit: bu, pack_size: defaultSize })
                      }}
                      className={inputClass}
                    >
                      <option value="ml">Liquid (ml)</option>
                      <option value="g">Weight (g)</option>
                      <option value="each">Count (each)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Price paid (£)</label>
                      <PriceInput
                        valueP={nl.price_p}
                        onChangeP={(p) => updateNewLibrary({ price_p: p })}
                        onCommit={onResolvedCommit}
                        className={inputClass} placeholder="14.40" />
                    </div>
                    <div>
                      <label className={labelClass}>How many does that buy?</label>
                      <input
                        type="number" step="1" min={1}
                        value={nl.purchase_qty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateNewLibrary({ purchase_qty: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                        className={inputClass} placeholder="1" />
                      <p className="text-xs text-parchment-400 mt-1">
                        {nl.base_unit === 'each' ? 'e.g. 6 for a 6-pack' : 'e.g. 24 for a case'}
                      </p>
                    </div>
                  </div>
                  {nl.base_unit !== 'each' && (
                    <div>
                      <label className={labelClass}>
                        {nl.base_unit === 'ml' ? 'Size of each (ml)' : 'Weight per pack (g)'}
                      </label>
                      {sizePresets && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {sizePresets.map((s) => (
                            <button type="button" key={s} onClick={() => updateNewLibrary({ pack_size: s })}
                              className={`${chipClass} ${nl.pack_size === s ? chipActive : chipIdle}`}>
                              {nl.base_unit === 'ml' && s >= 10000 ? `${s / 1000}L` : `${s}${nl.base_unit}`}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        type="number" step="1" min={1}
                        value={nl.pack_size}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateNewLibrary({ pack_size: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                        className={inputClass}
                        placeholder={nl.base_unit === 'ml' ? '330 for a can, 50000 for a 50L keg' : '500, 1000, 2500…'} />
                      <p className="text-xs text-parchment-400 mt-1">Enter any size not shown above.</p>
                    </div>
                  )}
                  {basis !== null && <p className="text-xs text-gold-200">= {basis}</p>}
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
                {selectedExisting.base_unit !== 'each'
                  ? ` · £${(selectedExisting.price_p / 100).toFixed(2)} / ${selectedExisting.pack_size}${selectedExisting.base_unit}`
                  : ` · £${(selectedExisting.price_p / 100).toFixed(2)} each`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Serve unit picker */}
      {(state.existing_library_id || state.new_library) && (
        <ServeUnitPicker
          baseUnit={baseUnit}
          customUnits={customUnits}
          recipeUnit={state.recipe_unit}
          recipeQty={state.recipe_qty}
          onChange={(next) => onChange({ ...state, ...next })}
        />
      )}
    </div>
  )
}
