'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction } from '@/lib/pouriq/server-actions'
import { BarcodeScanner } from '@/components/pouriq/BarcodeScanner'
import { BOTTLE_SIZES_ML } from '@/lib/pouriq/measures'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-hidden'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'

interface Props {
  libraryEntries: IngredientLibraryRow[]
  selectedEntryId: string | null
  onChange: (entry: IngredientLibraryRow) => void
}

export function IngredientPicker({ libraryEntries, selectedEntryId, onChange }: Props) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  // Inline-create form state
  const [name, setName] = useState('')
  const [ingredient_type, setIngredientType] = useState<IngredientType>('spirit')
  const [pricing_mode, setPricingMode] = useState<'bottle' | 'unit'>('bottle')
  const [bottle_size_ml, setBottleSize] = useState('700')
  const [bottle_cost_pounds, setBottleCostPounds] = useState('')
  const [unit_cost_pounds, setUnitCostPounds] = useState('')
  // When a scan didn't match an existing library entry, we surface
  // the scanned code so the new entry gets saved with it. Cleared on
  // form cancel.
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null)
  // True when name/type/size were prefilled from the cross-tenant
  // catalogue — surfaces a small hint so the user sanity-checks the
  // prefill before saving.
  const [prefilledFromCatalogue, setPrefilledFromCatalogue] = useState(false)
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
      // Containment must be tested against the whole component, not just the
      // input's row: the options dropdown and inline-create form are siblings
      // of that row, so checking the row alone treated option clicks as
      // "outside" and closed the menu on mousedown before the click landed.
      if (containerRef.current?.contains(e.target as Node)) return
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
    setScanInfo(null)
    setPendingBarcode(null)
    setPrefilledFromCatalogue(false)
  }

  async function handleScan(code: string) {
    setScanOpen(false)
    setScanInfo(null)
    setPrefilledFromCatalogue(false)
    // First check the local library copy for an instant match.
    const localMatch = libraryEntries.find((e) => e.barcode === code)
    if (localMatch) {
      selectEntry(localMatch)
      return
    }
    // Server lookup: tenant library + cross-tenant catalogue prefill.
    let cataloguePrefill: { name: string; ingredient_type: IngredientType; bottle_size_ml: number | null } | null = null
    try {
      const res = await fetch(`/api/pouriq/library/by-barcode?code=${encodeURIComponent(code)}`)
      if (res.ok) {
        const data = await res.json() as {
          entry: IngredientLibraryRow | null
          catalogue: { name: string; ingredient_type: IngredientType; bottle_size_ml: number | null; verified: boolean } | null
        }
        if (data.entry) {
          libraryEntries.push(data.entry)
          selectEntry(data.entry)
          return
        }
        if (data.catalogue) {
          cataloguePrefill = data.catalogue
        }
      }
    } catch { /* fall through to create flow */ }
    // No tenant match — open the inline create form with the barcode
    // prefilled, plus name/type/size from the shared catalogue if we
    // recognised the product.
    setPendingBarcode(code)
    setShowCreate(true)
    setOpen(true)
    if (cataloguePrefill) {
      setName(cataloguePrefill.name)
      setIngredientType(cataloguePrefill.ingredient_type)
      if (cataloguePrefill.bottle_size_ml) {
        setPricingMode('bottle')
        setBottleSize(String(cataloguePrefill.bottle_size_ml))
      }
      setPrefilledFromCatalogue(true)
      setScanInfo(`Recognised ${code}. We've pre-filled the name, type and size — just add your cost.`)
    } else {
      setName('')
      setScanInfo(`Scanned ${code}. Fill in the rest to add it to your library.`)
    }
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
        purchase_qty: 1,
        barcode: pendingBarcode,
        notes: null,
      })
      const newEntry: IngredientLibraryRow = {
        id: result.entryId,
        trade_account_id: '',
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: bottle_size_ml_n,
        bottle_cost_p,
        unit_cost_p,
        purchase_qty: 1,
        yield_pct: 100,
        barcode: pendingBarcode,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      libraryEntries.push(newEntry)
      selectEntry(newEntry)
      setName(''); setBottleCostPounds(''); setUnitCostPounds(''); setShowCreate(false); setPendingBarcode(null)
    } catch (e) {
      setCreateError((e as Error).message || 'Could not create')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
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
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          title="Scan a barcode"
          aria-label="Scan a barcode"
          className="shrink-0 px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm"
        >
          Scan
        </button>
      </div>

      {scanInfo && !scanOpen && (
        <p className="mt-1 text-xs text-gold-200">{scanInfo}</p>
      )}

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
          {pendingBarcode && (
            <p className="text-xs text-gold-200">Barcode: <span className="font-mono">{pendingBarcode}</span></p>
          )}
          {prefilledFromCatalogue && (
            <p className="text-xs text-emerald-200">Name, type and size came from the Pour IQ shared catalogue — sanity-check before saving.</p>
          )}
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
                  {BOTTLE_SIZES_ML.map((s) => <option key={s} value={s}>{s}</option>)}
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
            <button type="button" onClick={() => { setShowCreate(false); setPendingBarcode(null); setScanInfo(null); setPrefilledFromCatalogue(false) }} className="text-xs text-parchment-400 hover:text-parchment-200">Cancel</button>
            <button type="button" onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-sm text-sm disabled:opacity-50">
              {creating ? 'Adding…' : 'Add to library'}
            </button>
          </div>
        </div>
      )}

      {scanOpen && (
        <BarcodeScanner onScan={handleScan} onClose={() => setScanOpen(false)} />
      )}
    </div>
  )
}
