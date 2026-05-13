'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction, deleteLibraryEntryAction } from '@/lib/pouriq/server-actions'
import { BarcodeScanner } from '@/components/pouriq/BarcodeScanner'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const COMMON_BOTTLE_SIZES = [500, 700, 750, 1000]

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'
const chipClass = 'px-3 py-2 rounded-lg border text-sm transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

interface Props {
  entry: IngredientLibraryRow | null
  usageCount?: number
}

export function IngredientForm({ entry, usageCount = 0 }: Props) {
  const router = useRouter()
  const [name, setName] = useState(entry?.name ?? '')
  const [ingredient_type, setIngredientType] = useState<IngredientType>(entry?.ingredient_type ?? 'spirit')
  const [pricing_mode, setPricingMode] = useState<'bottle' | 'unit'>(
    entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined ? 'unit' : 'bottle'
  )
  const [bottle_size_ml, setBottleSize] = useState(entry?.bottle_size_ml?.toString() ?? '')
  const [bottle_cost_pounds, setBottleCostPounds] = useState(
    entry?.bottle_cost_p !== null && entry?.bottle_cost_p !== undefined
      ? (entry.bottle_cost_p / 100).toFixed(2) : ''
  )
  const [unit_cost_pounds, setUnitCostPounds] = useState(
    entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined
      ? (entry.unit_cost_p / 100).toFixed(2) : ''
  )
  const [barcode, setBarcode] = useState(entry?.barcode ?? '')
  const [scanOpen, setScanOpen] = useState(false)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Name is required'); return }

    let bottle_size_ml_n: number | null = null
    let bottle_cost_p: number | null = null
    let unit_cost_p: number | null = null
    if (pricing_mode === 'bottle') {
      bottle_size_ml_n = parseFloat(bottle_size_ml)
      bottle_cost_p = Math.round(parseFloat(bottle_cost_pounds) * 100)
      if (!Number.isFinite(bottle_size_ml_n) || bottle_size_ml_n <= 0) {
        setError('Bottle size must be a positive number'); return
      }
      if (!Number.isFinite(bottle_cost_p) || bottle_cost_p < 0) {
        setError('Bottle cost must be a non-negative number'); return
      }
    } else {
      unit_cost_p = Math.round(parseFloat(unit_cost_pounds) * 100)
      if (!Number.isFinite(unit_cost_p) || unit_cost_p < 0) {
        setError('Unit cost must be a non-negative number'); return
      }
    }

    setSubmitting(true)
    try {
      await saveLibraryEntryAction(entry?.id ?? null, {
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: bottle_size_ml_n,
        bottle_cost_p,
        unit_cost_p,
        barcode: barcode.trim() || null,
        notes: notes.trim() || null,
      })
      router.push('/trade/pouriq/library')
      router.refresh()
    } catch (e) {
      setError((e as Error).message || 'Could not save')
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!entry) return
    if (usageCount > 0) return
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return
    await deleteLibraryEntryAction(entry.id)
    router.push('/trade/pouriq/library')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className={labelClass}>Name *</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Tito's Vodka" />
      </div>

      <div>
        <label htmlFor="ingredient_type" className={labelClass}>Type *</label>
        <select id="ingredient_type" value={ingredient_type} onChange={(e) => setIngredientType(e.target.value as IngredientType)} className={inputClass}>
          {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Pricing mode *</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPricingMode('bottle')} className={`${chipClass} ${pricing_mode === 'bottle' ? chipActive : chipIdle}`}>
            Per bottle
          </button>
          <button type="button" onClick={() => setPricingMode('unit')} className={`${chipClass} ${pricing_mode === 'unit' ? chipActive : chipIdle}`}>
            Per unit
          </button>
        </div>
      </div>

      {pricing_mode === 'bottle' ? (
        <>
          <div>
            <label htmlFor="bottle_size_ml" className={labelClass}>Bottle size (ml) *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_BOTTLE_SIZES.map((s) => (
                <button type="button" key={s} onClick={() => setBottleSize(String(s))} className={`${chipClass} ${bottle_size_ml === String(s) ? chipActive : chipIdle}`}>
                  {s}ml
                </button>
              ))}
            </div>
            <input id="bottle_size_ml" type="number" step="1" min={0} value={bottle_size_ml} onChange={(e) => setBottleSize(e.target.value)} className={inputClass} placeholder="700" />
          </div>
          <div>
            <label htmlFor="bottle_cost_pounds" className={labelClass}>Bottle cost (£) *</label>
            <input id="bottle_cost_pounds" type="number" step="0.01" min={0} value={bottle_cost_pounds} onChange={(e) => setBottleCostPounds(e.target.value)} className={inputClass} placeholder="25.00" />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="unit_cost_pounds" className={labelClass}>Unit cost (£) *</label>
          <input id="unit_cost_pounds" type="number" step="0.01" min={0} value={unit_cost_pounds} onChange={(e) => setUnitCostPounds(e.target.value)} className={inputClass} placeholder="1.00" />
          <p className="text-xs text-parchment-400 mt-2">e.g., the cost of one whole lime, one bunch of mint, one jar of cherries.</p>
        </div>
      )}

      <div>
        <label htmlFor="barcode" className={labelClass}>Barcode</label>
        <div className="flex gap-2">
          <input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputClass} placeholder="Optional — scan or type the bottle's barcode" />
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="shrink-0 px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm"
          >
            Scan
          </button>
        </div>
        <p className="text-xs text-parchment-400 mt-2">Once set, scanning this bottle in the cocktail editor auto-selects this ingredient.</p>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-vertical`} placeholder="Optional — supplier, SKU, anything useful" />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {scanOpen && (
        <BarcodeScanner
          onScan={(code) => { setBarcode(code); setScanOpen(false) }}
          onClose={() => setScanOpen(false)}
        />
      )}

      <div className="flex justify-between items-center">
        {entry ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={usageCount > 0}
            title={usageCount > 0 ? `Used in ${usageCount} drink${usageCount === 1 ? '' : 's'}. Remove from those first.` : undefined}
            className="text-sm text-red-300 hover:text-red-200 underline disabled:text-parchment-500 disabled:no-underline disabled:cursor-not-allowed"
          >
            {usageCount > 0 ? `Used in ${usageCount} drink${usageCount === 1 ? '' : 's'} — can't delete` : 'Delete ingredient'}
          </button>
        ) : <span />}
        <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Saving…' : entry ? 'Save changes' : 'Add ingredient'}
        </button>
      </div>
    </form>
  )
}
