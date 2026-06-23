'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction, deleteLibraryEntryAction } from '@/lib/pouriq/server-actions'
import { BarcodeScanner } from '@/components/pouriq/BarcodeScanner'
import { RipplePreview } from '@/components/pouriq/RipplePreview'
import { RippleConfirmModal } from '@/components/pouriq/RippleConfirmModal'
import { formatPurchaseBasis } from '@/lib/pouriq/calculations'
import { BOTTLE_SIZES_ML } from '@/lib/pouriq/measures'
import {
  COST_UPDATE_TOAST_KEY,
  getNewlyBelowTarget,
  projectCocktail,
  rollupByMenu,
  type CostImpactPayload,
  type CostUpdateToastPayload,
  type ProjectedCocktail,
} from '@/lib/pouriq/cost-impact'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'
const chipClass = 'px-3 py-2 rounded-lg border text-sm transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

interface Props {
  entry: IngredientLibraryRow | null
  usageCount?: number
  impactPayload?: CostImpactPayload
}

interface PendingValues {
  bottle_size_ml_n: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
}

export function IngredientForm({ entry, usageCount = 0, impactPayload }: Props) {
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
  const [purchase_qty_str, setPurchaseQty] = useState(entry?.purchase_qty?.toString() ?? '1')
  const purchase_qty = Math.max(1, Math.round(Number(purchase_qty_str) || 1))
  const [barcode, setBarcode] = useState(entry?.barcode ?? '')
  const [scanOpen, setScanOpen] = useState(false)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const [existingEntryHref, setExistingEntryHref] = useState<string | null>(null)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingToast, setPendingToast] = useState<CostUpdateToastPayload | null>(null)
  const pendingValuesRef = useRef<PendingValues | null>(null)

  const savedCostP =
    pricing_mode === 'unit' ? entry?.unit_cost_p ?? null : entry?.bottle_cost_p ?? null

  const newCostP = useMemo(() => {
    const raw = pricing_mode === 'unit' ? unit_cost_pounds : bottle_cost_pounds
    if (raw === '') return null
    const n = Math.round(parseFloat(raw) * 100)
    return Number.isFinite(n) ? n : null
  }, [pricing_mode, unit_cost_pounds, bottle_cost_pounds])

  const projection = useMemo(() => {
    if (!impactPayload || newCostP === null) return null
    if (savedCostP !== null && newCostP === savedCostP) return null
    const projected: ProjectedCocktail[] = impactPayload.affected.map((c) =>
      projectCocktail({ ...impactPayload.ingredient, purchase_qty }, c, newCostP),
    )
    const rollups = rollupByMenu(projected)
    return { projected, rollups }
  }, [impactPayload, newCostP, savedCostP, purchase_qty])

  async function handleScan(code: string) {
    setScanOpen(false)
    setScanInfo(null)
    setExistingEntryHref(null)
    setBarcode(code)
    try {
      const res = await fetch(`/api/pouriq/library/by-barcode?code=${encodeURIComponent(code)}`)
      if (!res.ok) return
      const data = await res.json() as {
        entry: IngredientLibraryRow | null
        catalogue: { name: string; ingredient_type: IngredientType; bottle_size_ml: number | null; verified: boolean } | null
      }
      if (data.entry && data.entry.id !== entry?.id) {
        setExistingEntryHref(`/trade/pouriq/library/${data.entry.id}/edit`)
        setScanInfo(`This barcode is already on your library entry "${data.entry.name}".`)
        return
      }
      if (data.catalogue && !entry) {
        if (!name.trim()) setName(data.catalogue.name)
        setIngredientType(data.catalogue.ingredient_type)
        if (data.catalogue.bottle_size_ml) {
          setPricingMode('bottle')
          setBottleSize(String(data.catalogue.bottle_size_ml))
        }
        setScanInfo("Name, type and size came from the Pour IQ shared catalogue — sanity-check before saving.")
      }
    } catch { /* network blip — just leave the barcode populated */ }
  }

  function validate(): PendingValues | null {
    setError(null)
    if (!name.trim()) { setError('Name is required'); return null }
    let bottle_size_ml_n: number | null = null
    let bottle_cost_p: number | null = null
    let unit_cost_p: number | null = null
    if (pricing_mode === 'bottle') {
      bottle_size_ml_n = parseFloat(bottle_size_ml)
      bottle_cost_p = Math.round(parseFloat(bottle_cost_pounds) * 100)
      if (!Number.isFinite(bottle_size_ml_n) || bottle_size_ml_n <= 0) {
        setError('Bottle size must be a positive number'); return null
      }
      if (!Number.isFinite(bottle_cost_p) || bottle_cost_p < 0) {
        setError('Bottle cost must be a non-negative number'); return null
      }
    } else {
      unit_cost_p = Math.round(parseFloat(unit_cost_pounds) * 100)
      if (!Number.isFinite(unit_cost_p) || unit_cost_p < 0) {
        setError('Unit cost must be a non-negative number'); return null
      }
    }
    return { bottle_size_ml_n, bottle_cost_p, unit_cost_p }
  }

  async function commit(values: PendingValues, toastData: CostUpdateToastPayload | null) {
    setSubmitting(true)
    try {
      await saveLibraryEntryAction(entry?.id ?? null, {
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: values.bottle_size_ml_n,
        bottle_cost_p: values.bottle_cost_p,
        unit_cost_p: values.unit_cost_p,
        purchase_qty,
        barcode: barcode.trim() || null,
        notes: notes.trim() || null,
      })
      if (toastData) {
        sessionStorage.setItem(COST_UPDATE_TOAST_KEY, JSON.stringify(toastData))
      }
      router.push('/trade/pouriq/library')
      router.refresh()
    } catch (e) {
      setError((e as Error).message || 'Could not save')
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const values = validate()
    if (!values) return

    // First-cost case: savedCostP is null. Skip the gate entirely; commit
    // straight through. No toast either — there's no "newly below"
    // comparison to make against a non-existent baseline.
    const isFirstCost = savedCostP === null
    if (isFirstCost || !projection) {
      await commit(values, null)
      return
    }

    const newlyBelow = getNewlyBelowTarget(projection.projected)
    if (newlyBelow.length === 0) {
      await commit(values, null)
      return
    }

    const toastData: CostUpdateToastPayload = {
      ingredientName: name.trim(),
      newlyBelowTarget: newlyBelow.map((p) => ({
        cocktail_id: p.cocktail_id,
        cocktail_name: p.cocktail_name,
        menu_id: p.menu_id,
        menu_name: p.menu_name,
        projected_gp_pct: p.projected_gp_pct,
        target_gp_pct: p.menu_target_gp_pct,
      })),
    }
    setPendingToast(toastData)
    pendingValuesRef.current = values
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!entry) return
    if (usageCount > 0) return
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return
    await deleteLibraryEntryAction(entry.id)
    router.push('/trade/pouriq/library')
    router.refresh()
  }

  const showRipple = projection !== null && impactPayload !== undefined && impactPayload.affected.length > 0

  return (
    <>
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

        {/* How you buy it: price + how many that buys (+ size for poured) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="purchase_price" className={labelClass}>Price you pay (£) *</label>
            <input
              id="purchase_price" type="number" step="0.01" min={0}
              value={pricing_mode === 'bottle' ? bottle_cost_pounds : unit_cost_pounds}
              onChange={(e) => pricing_mode === 'bottle' ? setBottleCostPounds(e.target.value) : setUnitCostPounds(e.target.value)}
              className={inputClass} placeholder="14.40"
            />
          </div>
          <div>
            <label htmlFor="purchase_qty" className={labelClass}>How many does that buy? *</label>
            <input id="purchase_qty" type="number" step="1" min={1} value={purchase_qty_str} onChange={(e) => setPurchaseQty(e.target.value)} className={inputClass} placeholder="1" />
            <p className="text-xs text-parchment-400 mt-1">
              {pricing_mode === 'bottle' ? 'e.g. 24 for a case' : 'e.g. 6 for a 6-pack'} — leave 1 for a single {pricing_mode === 'bottle' ? 'bottle' : 'item'}.
            </p>
          </div>
        </div>

        {pricing_mode === 'bottle' ? (
          <div>
            <label htmlFor="bottle_size_ml" className={labelClass}>Size of each (ml) *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BOTTLE_SIZES_ML.map((s) => (
                <button type="button" key={s} onClick={() => setBottleSize(String(s))} className={`${chipClass} ${bottle_size_ml === String(s) ? chipActive : chipIdle}`}>
                  {s}ml
                </button>
              ))}
            </div>
            <input id="bottle_size_ml" type="number" step="1" min={0} value={bottle_size_ml} onChange={(e) => setBottleSize(e.target.value)} className={inputClass} placeholder="700 — or type any size, e.g. 10000 for a 10L keg/BIB" />
          </div>
        ) : (
          <p className="text-xs text-parchment-400">Whole-item pricing — e.g. one lime, one jar of cherries. Recipes use a count (¼, ½, 1).</p>
        )}

        {newCostP !== null && (() => {
          const sizeN = parseFloat(bottle_size_ml)
          const basis = formatPurchaseBasis({
            bottle_cost_p: pricing_mode === 'bottle' ? newCostP : null,
            bottle_size_ml: pricing_mode === 'bottle' && Number.isFinite(sizeN) ? sizeN : null,
            unit_cost_p: pricing_mode === 'unit' ? newCostP : null,
            purchase_qty,
          })
          return basis === '—' ? null : <p className="text-sm text-gold-200">= {basis}</p>
        })()}

        {showRipple && projection && (
          <div>
            <p className="text-sm text-parchment-300 mb-3">Impact on drinks using this ingredient:</p>
            <RipplePreview projected={projection.projected} rollups={projection.rollups} />
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

        {scanInfo && (
          <p className="text-xs text-gold-200">
            {scanInfo}{' '}
            {existingEntryHref && (
              <a href={existingEntryHref} className="underline hover:text-gold-100">Open it</a>
            )}
          </p>
        )}

        {scanOpen && (
          <BarcodeScanner
            onScan={handleScan}
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
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
            {submitting ? 'Saving…' : entry ? 'Save changes' : 'Add ingredient'}
          </button>
        </div>
      </form>

      <RippleConfirmModal
        isOpen={modalOpen}
        ingredientName={name.trim()}
        newlyBelowTarget={projection ? getNewlyBelowTarget(projection.projected) : []}
        submitting={submitting}
        onCancel={() => { setModalOpen(false); setPendingToast(null); pendingValuesRef.current = null }}
        onConfirm={() => {
          setModalOpen(false)
          if (pendingValuesRef.current) {
            void commit(pendingValuesRef.current, pendingToast)
          }
        }}
      />
    </>
  )
}
