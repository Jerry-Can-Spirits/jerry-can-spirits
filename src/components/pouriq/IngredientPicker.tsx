'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction } from '@/lib/pouriq/server-actions'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const COMMON_BOTTLE_SIZES = [500, 700, 750, 1000]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-none'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'

interface Props {
  libraryEntries: IngredientLibraryRow[]
  selectedEntryId: string | null
  onChange: (entry: IngredientLibraryRow) => void
}

export function IngredientPicker({ libraryEntries, selectedEntryId, onChange }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  // Inline-create form state
  const [name, setName] = useState('')
  const [ingredient_type, setIngredientType] = useState<IngredientType>('spirit')
  const [pricing_mode, setPricingMode] = useState<'bottle' | 'unit'>('bottle')
  const [bottle_size_ml, setBottleSize] = useState('700')
  const [bottle_cost_pounds, setBottleCostPounds] = useState('')
  const [unit_cost_pounds, setUnitCostPounds] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const selectedEntry = libraryEntries.find((e) => e.id === selectedEntryId) ?? null

  const matches = useMemo(() => {
    if (!query.trim()) return libraryEntries.slice(0, 20)
    const q = query.toLowerCase()
    return libraryEntries
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [libraryEntries, query])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current?.parentElement?.contains(e.target as Node)) return
      setOpen(false)
      setShowCreate(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function selectEntry(entry: IngredientLibraryRow) {
    onChange(entry)
    setQuery('')
    setOpen(false)
    setShowCreate(false)
  }

  async function handleCreate() {
    setCreateError(null)
    if (!name.trim()) { setCreateError('Name required'); return }
    let bottle_size_ml_n: number | null = null
    let bottle_cost_p: number | null = null
    let unit_cost_p: number | null = null
    if (pricing_mode === 'bottle') {
      bottle_size_ml_n = parseFloat(bottle_size_ml)
      bottle_cost_p = Math.round(parseFloat(bottle_cost_pounds) * 100)
      if (!Number.isFinite(bottle_size_ml_n) || bottle_size_ml_n <= 0) { setCreateError('Bottle size invalid'); return }
      if (!Number.isFinite(bottle_cost_p) || bottle_cost_p < 0) { setCreateError('Bottle cost invalid'); return }
    } else {
      unit_cost_p = Math.round(parseFloat(unit_cost_pounds) * 100)
      if (!Number.isFinite(unit_cost_p) || unit_cost_p < 0) { setCreateError('Unit cost invalid'); return }
    }
    setCreating(true)
    try {
      const result = await saveLibraryEntryAction(null, {
        name: name.trim(), ingredient_type,
        bottle_size_ml: bottle_size_ml_n, bottle_cost_p, unit_cost_p,
        notes: null,
      })
      // Build the new entry shape for the parent. Full row would require a refetch;
      // synthesise enough for the parent to render and recalc.
      const newEntry: IngredientLibraryRow = {
        id: result.entryId,
        trade_account_id: '',
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: bottle_size_ml_n,
        bottle_cost_p,
        unit_cost_p,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      // Append to local library copy so it appears in the dropdown for the next pick.
      libraryEntries.push(newEntry)
      selectEntry(newEntry)
      // Reset form
      setName(''); setBottleCostPounds(''); setUnitCostPounds(''); setShowCreate(false)
    } catch (e) {
      setCreateError((e as Error).message || 'Could not create')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        aria-label="Ingredient picker"
        value={open || showCreate ? query : (selectedEntry?.name ?? '')}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        placeholder={selectedEntry ? selectedEntry.name : 'Pick an ingredient…'}
        className={inputClass}
      />
      {open && !showCreate && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-jerry-green-800 border border-gold-500/30 rounded-lg shadow-lg">
          {matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-parchment-400">No matches in your library.</p>
          )}
          {matches.map((entry) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => selectEntry(entry)}
              className="block w-full text-left px-3 py-2 text-sm text-parchment-100 hover:bg-jerry-green-700"
            >
              <span className="font-medium">{entry.name}</span>
              <span className="text-xs text-parchment-400 ml-2">{entry.ingredient_type}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setShowCreate(true); setName(query) }}
            className="block w-full text-left px-3 py-2 text-sm text-gold-300 hover:bg-jerry-green-700 border-t border-gold-500/20"
          >
            + Create new ingredient{query.trim() ? `: "${query.trim()}"` : ''}
          </button>
        </div>
      )}

      {showCreate && (
        <div className="absolute z-10 left-0 right-0 mt-1 p-4 bg-jerry-green-800 border border-gold-500/30 rounded-lg shadow-lg space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Tito's Vodka" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type</label>
              <select value={ingredient_type} onChange={(e) => setIngredientType(e.target.value as IngredientType)} className={inputClass}>
                {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pricing</label>
              <select value={pricing_mode} onChange={(e) => setPricingMode(e.target.value as 'bottle' | 'unit')} className={inputClass}>
                <option value="bottle">Per bottle</option>
                <option value="unit">Per unit</option>
              </select>
            </div>
          </div>
          {pricing_mode === 'bottle' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Size (ml)</label>
                <select value={bottle_size_ml} onChange={(e) => setBottleSize(e.target.value)} className={inputClass}>
                  {COMMON_BOTTLE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Cost (£)</label>
                <input type="number" step="0.01" min={0} value={bottle_cost_pounds} onChange={(e) => setBottleCostPounds(e.target.value)} className={inputClass} placeholder="25.00" />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Unit cost (£)</label>
              <input type="number" step="0.01" min={0} value={unit_cost_pounds} onChange={(e) => setUnitCostPounds(e.target.value)} className={inputClass} placeholder="1.00" />
            </div>
          )}
          {createError && <p role="alert" className="text-xs text-red-300">{createError}</p>}
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-parchment-400 hover:text-parchment-200">Cancel</button>
            <button type="button" onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded text-sm disabled:opacity-50">
              {creating ? 'Adding…' : 'Add to library'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
