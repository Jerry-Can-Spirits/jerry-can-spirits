'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType, ServeUnitRow } from '@/lib/pouriq/types'
import { saveLibraryEntryAction, deleteLibraryEntryAction, saveServeUnitAction, deleteServeUnitAction, addPreparedComponentAction, removePreparedComponentAction, type LibraryEntryInput } from '@/lib/pouriq/server-actions'
import { BarcodeScanner } from '@/components/pouriq/BarcodeScanner'
import { RipplePreview } from '@/components/pouriq/RipplePreview'
import { RippleConfirmModal } from '@/components/pouriq/RippleConfirmModal'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import { ServeUnitPicker } from '@/components/pouriq/ServeUnitPicker'
import { costPerBaseUnitP, usableCostPerBaseUnitP } from '@/lib/pouriq/calculations'
import { BOTTLE_SIZES_ML, WEIGHT_SIZES_G, STANDARD_SERVE_UNITS, serveUnitsFor, recipeBaseAmount } from '@/lib/pouriq/measures'
import {
  COST_UPDATE_TOAST_KEY,
  getNewlyBelowTarget,
  projectCocktail,
  rollupByMenu,
  type CostImpactPayload,
  type CostUpdateToastPayload,
  type ProjectedCocktail,
} from '@/lib/pouriq/cost-impact'
import type { PreparedComponentWithCost } from '@/lib/pouriq/prepared'

type BaseUnit = 'ml' | 'g' | 'each'
type PurchaseMode = BaseUnit | 'prepared'

const INGREDIENT_TYPES: IngredientType[] = [
  'spirit', 'liqueur', 'wine', 'beer', 'cider', 'mixer',
  'syrup', 'juice', 'garnish', 'soft-drink', 'alcohol-free', 'food', 'other',
]

const INGREDIENT_TYPE_LABELS: Record<IngredientType, string> = {
  spirit: 'Spirit',
  liqueur: 'Liqueur',
  wine: 'Wine',
  beer: 'Beer',
  cider: 'Cider',
  mixer: 'Mixer',
  syrup: 'Syrup',
  juice: 'Juice',
  garnish: 'Garnish',
  'soft-drink': 'Soft drink',
  'alcohol-free': 'Alcohol-free',
  food: 'Food',
  other: 'Other',
}

const PACK_FORMATS = [
  'bottle', 'can', 'keg', 'bag-in-box', 'carton', 'pouch', 'case', 'crate', 'bag', 'tub', 'box', 'other',
] as const

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'
const chipClass = 'px-3 py-2 rounded-lg border text-sm transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'
const helperClass = 'text-xs text-parchment-400 mt-1.5'

function FieldHelper({ children }: { children: React.ReactNode }) {
  return <p className={helperClass}>{children}</p>
}

interface Props {
  entry: IngredientLibraryRow | null
  usageCount?: number
  impactPayload?: CostImpactPayload
  serveUnits?: ServeUnitRow[]
  components?: PreparedComponentWithCost[]
  libraryEntries?: IngredientLibraryRow[]
}

// Derive initial base_unit from a stored row.
function rowToBaseUnit(entry: IngredientLibraryRow | null): BaseUnit {
  if (!entry) return 'ml'
  return entry.base_unit
}

export function IngredientForm({ entry, usageCount = 0, impactPayload, serveUnits = [], components = [], libraryEntries = [] }: Props) {
  const router = useRouter()

  // --- Core identity ---
  const [name, setName] = useState(entry?.name ?? '')
  const [ingredient_type, setIngredientType] = useState<IngredientType>(entry?.ingredient_type ?? 'spirit')
  const [subcategory, setSubcategory] = useState(entry?.subcategory ?? '')

  // --- How you buy it ---
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(
    entry?.is_prepared ? 'prepared' : rowToBaseUnit(entry),
  )
  const [base_unit, setBaseUnit] = useState<BaseUnit>(rowToBaseUnit(entry))
  // Prepared mode: yield unit and yield amount (= pack_size when saved)
  const [yieldUnit, setYieldUnit] = useState<BaseUnit>(rowToBaseUnit(entry))
  const [yieldAmountStr, setYieldAmountStr] = useState(
    entry?.is_prepared && entry.pack_size > 0 ? entry.pack_size.toString() : '',
  )
  const [price_str, setPriceStr] = useState(
    entry && !entry.is_prepared && entry.price_p > 0 ? (entry.price_p / 100).toFixed(2) : '',
  )
  const [purchase_qty_str, setPurchaseQtyStr] = useState(
    entry?.purchase_qty?.toString() ?? '1',
  )
  const [pack_size_str, setPackSizeStr] = useState(
    entry && !entry.is_prepared && entry.pack_size > 0 ? entry.pack_size.toString() : '',
  )
  const [pack_format, setPackFormat] = useState<string>(entry?.pack_format ?? '')

  // --- Components (prepared mode) ---
  const [compPending, startCompTransition] = useTransition()
  const [compError, setCompError] = useState<string | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<IngredientLibraryRow | null>(null)
  const [compRecipeUnit, setCompRecipeUnit] = useState<string | null>(null)
  const [compRecipeQty, setCompRecipeQty] = useState<number | null>(null)

  // --- Advanced costing ---
  const [yield_pct_str, setYieldPctStr] = useState(
    entry?.yield_pct !== undefined && entry.yield_pct !== 100
      ? entry.yield_pct.toString()
      : '100',
  )
  const [advancedOpen, setAdvancedOpen] = useState(
    entry !== null && entry.yield_pct !== undefined && entry.yield_pct !== 100,
  )

  // --- Misc ---
  const [barcode, setBarcode] = useState(entry?.barcode ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')

  // --- UI state ---
  const [scanOpen, setScanOpen] = useState(false)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const [existingEntryHref, setExistingEntryHref] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingToast, setPendingToast] = useState<CostUpdateToastPayload | null>(null)
  const pendingValuesRef = useRef<LibraryEntryInput | null>(null)

  // --- Serve units ---
  const [suName, setSuName] = useState('')
  const [suQtyStr, setSuQtyStr] = useState('')
  const [suError, setSuError] = useState<string | null>(null)
  const [suPending, startSuTransition] = useTransition()

  // Parsed values for live readout
  const price_p_live = useMemo(() => {
    const n = Math.round(parseFloat(price_str) * 100)
    return Number.isFinite(n) ? n : null
  }, [price_str])

  const pack_size_live = useMemo(() => {
    const n = parseFloat(pack_size_str)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [pack_size_str])

  const purchase_qty_live = useMemo(() => {
    const n = Math.max(1, Math.round(Number(purchase_qty_str) || 1))
    return n
  }, [purchase_qty_str])

  const yield_pct_live = useMemo(() => {
    const n = parseFloat(yield_pct_str)
    return Number.isFinite(n) && n > 0 ? n : 100
  }, [yield_pct_str])

  // Cost readout
  const costReadout = useMemo((): string | null => {
    if (price_p_live === null) return null
    const effectivePackSize = base_unit === 'each' ? 1 : pack_size_live
    if (base_unit !== 'each' && effectivePackSize === null) return null

    const ps = effectivePackSize ?? 1
    const perBase = costPerBaseUnitP(price_p_live, purchase_qty_live, ps)
    const usablePerBase = usableCostPerBaseUnitP(price_p_live, purchase_qty_live, ps, yield_pct_live)

    const fmt = (p: number) => `£${(p / 100).toFixed(3)}`
    const fmt2 = (p: number) => `£${(p / 100).toFixed(2)}`

    if (base_unit === 'each') {
      const eachP = price_p_live / purchase_qty_live
      return `${fmt2(eachP)} each`
    }
    if (base_unit === 'g') {
      const per100g = usablePerBase * 100
      return `${fmt(usablePerBase)}/g  ·  ${fmt2(per100g)} per 100g`
    }
    // ml
    const per25ml = usablePerBase * 25
    const per50ml = usablePerBase * 50
    if (perBase !== usablePerBase) {
      return `${fmt(perBase)}/ml (usable ${fmt(usablePerBase)}/ml)  ·  ${fmt2(per25ml)} per 25ml  ·  ${fmt2(per50ml)} per 50ml`
    }
    return `${fmt(perBase)}/ml  ·  ${fmt2(per25ml)} per 25ml  ·  ${fmt2(per50ml)} per 50ml`
  }, [base_unit, price_p_live, pack_size_live, purchase_qty_live, yield_pct_live])

  // Impact projection (uses saved price as baseline)
  const savedPriceP = entry?.price_p ?? null

  const projection = useMemo(() => {
    if (!impactPayload || price_p_live === null) return null
    if (savedPriceP !== null && price_p_live === savedPriceP) return null
    const projected: ProjectedCocktail[] = impactPayload.affected.map((c) =>
      projectCocktail(
        { ...impactPayload.ingredient, purchase_qty: purchase_qty_live, pack_size: pack_size_live ?? impactPayload.ingredient.pack_size },
        c,
        price_p_live,
      ),
    )
    const rollups = rollupByMenu(projected)
    return { projected, rollups }
  }, [impactPayload, price_p_live, savedPriceP, purchase_qty_live, pack_size_live])

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
        catalogue: { name: string; ingredient_type: IngredientType; pack_size_ml: number | null; verified: boolean } | null
      }
      if (data.entry && data.entry.id !== entry?.id) {
        setExistingEntryHref(`/trade/pouriq/library/${data.entry.id}/edit`)
        setScanInfo(`This barcode is already on your library entry "${data.entry.name}".`)
        return
      }
      if (data.catalogue && !entry) {
        if (!name.trim()) setName(data.catalogue.name)
        setIngredientType(data.catalogue.ingredient_type)
        if (data.catalogue.pack_size_ml) {
          setBaseUnit('ml')
          setPackSizeStr(String(data.catalogue.pack_size_ml))
        }
        setScanInfo("Name, type and size came from the Pour IQ shared catalogue — sanity-check before saving.")
      }
    } catch { /* network blip — barcode field already populated */ }
  }

  function computeBasePerUnit(): number | null {
    const qty = parseFloat(suQtyStr)
    if (!Number.isFinite(qty) || qty <= 0) return null
    if (base_unit === 'each') {
      // qty = items per whole item; base_per_unit = fraction of one item
      return 1 / qty
    }
    // ml / g: 1 unit = qty base units
    return qty
  }

  function handleAddServeUnit() {
    if (!entry) return
    setSuError(null)
    const trimmedName = suName.trim()
    if (!trimmedName) { setSuError('Unit name is required'); return }
    const basePerUnit = computeBasePerUnit()
    if (basePerUnit === null) { setSuError('Enter a valid number greater than 0'); return }
    startSuTransition(async () => {
      try {
        await saveServeUnitAction(entry.id, trimmedName, basePerUnit)
        setSuName('')
        setSuQtyStr('')
        router.refresh()
      } catch (e) {
        setSuError((e as Error).message || 'Could not save serve unit')
      }
    })
  }

  function handleDeleteServeUnit(serveUnitId: string, unitName: string) {
    if (!confirm(`Remove "${unitName}"? This cannot be undone.`)) return
    setSuError(null)
    startSuTransition(async () => {
      try {
        await deleteServeUnitAction(serveUnitId)
        router.refresh()
      } catch (e) {
        setSuError((e as Error).message || 'Could not delete serve unit')
      }
    })
  }

  function buildInput(): LibraryEntryInput | null {
    setError(null)
    if (!name.trim()) { setError('Name is required'); return null }

    if (purchaseMode === 'prepared') {
      const yieldAmount = parseFloat(yieldAmountStr)
      if (!Number.isFinite(yieldAmount) || yieldAmount <= 0) {
        setError('Enter a valid yield amount greater than 0'); return null
      }
      return {
        name: name.trim(),
        ingredient_type,
        base_unit: yieldUnit,
        pack_size: yieldAmount,
        price_p: 0,
        purchase_qty: 1,
        yield_pct: 100,
        pack_format: null,
        subcategory: subcategory.trim() || null,
        barcode: barcode.trim() || null,
        notes: notes.trim() || null,
        is_prepared: true,
      }
    }

    const price_p = Math.round(parseFloat(price_str) * 100)
    if (!Number.isFinite(price_p) || price_p < 0) { setError('Enter a valid price'); return null }

    const pack_size_n = parseFloat(pack_size_str)
    if (base_unit !== 'each' && (!Number.isFinite(pack_size_n) || pack_size_n <= 0)) {
      setError(`Enter a valid ${base_unit === 'ml' ? 'volume' : 'weight'} per pack`); return null
    }
    const pack_size = base_unit === 'each' ? 1 : pack_size_n

    const purchase_qty = Math.max(1, Math.round(Number(purchase_qty_str) || 1))
    if (!Number.isInteger(purchase_qty) || purchase_qty < 1) { setError('Packs bought must be a whole number of 1 or more'); return null }

    const yield_pct = parseFloat(yield_pct_str)
    if (!Number.isFinite(yield_pct) || yield_pct <= 0 || yield_pct > 100) {
      setError('Yield must be between 1 and 100'); return null
    }

    return {
      name: name.trim(),
      ingredient_type,
      base_unit,
      pack_size,
      price_p,
      purchase_qty,
      yield_pct,
      pack_format: pack_format.trim() || null,
      subcategory: subcategory.trim() || null,
      barcode: barcode.trim() || null,
      notes: notes.trim() || null,
      is_prepared: false,
    }
  }

  async function commit(values: LibraryEntryInput, toastData: CostUpdateToastPayload | null) {
    setSubmitting(true)
    try {
      await saveLibraryEntryAction(entry?.id ?? null, values)
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
    const values = buildInput()
    if (!values) return

    // Prepared ingredients have server-derived prices — skip ripple flow.
    if (purchaseMode === 'prepared') {
      await commit(values, null)
      return
    }

    const isFirstCost = savedPriceP === null
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

  function handleDeleteComponent(componentRowId: string) {
    if (!confirm('Remove this component? This cannot be undone.')) return
    setCompError(null)
    startCompTransition(async () => {
      try {
        await removePreparedComponentAction(componentRowId)
        router.refresh()
      } catch (e) {
        setCompError((e as Error).message || 'Could not remove component')
      }
    })
  }

  function handleAddComponent() {
    if (!entry) return
    setCompError(null)
    if (!selectedComponent) { setCompError('Pick a component ingredient'); return }
    if (!compRecipeUnit || compRecipeQty === null || compRecipeQty <= 0) {
      setCompError('Enter a valid amount'); return
    }
    const unit = serveUnitsFor(selectedComponent.base_unit, serveUnits.filter((u) => u.library_ingredient_id === selectedComponent.id)).find((u) => u.name === compRecipeUnit)
    if (!unit) { setCompError('Unknown unit'); return }
    const amount_base = recipeBaseAmount(compRecipeQty, unit.base_per_unit)
    if (amount_base <= 0) { setCompError('Amount must be greater than 0'); return }
    startCompTransition(async () => {
      try {
        await addPreparedComponentAction(entry.id, selectedComponent.id, amount_base, compRecipeUnit, compRecipeQty)
        setSelectedComponent(null)
        setCompRecipeUnit(null)
        setCompRecipeQty(null)
        router.refresh()
      } catch (e) {
        setCompError((e as Error).message || 'Could not add component')
      }
    })
  }

  // Live batch cost readout for prepared mode.
  const batchCostP = useMemo(() => {
    return components.reduce((sum, c) => {
      return sum + Math.round(usableCostPerBaseUnitP(c.price_p, c.purchase_qty, c.pack_size, c.yield_pct) * c.amount_base)
    }, 0)
  }, [components])

  const yieldAmountLive = useMemo(() => {
    const n = parseFloat(yieldAmountStr)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [yieldAmountStr])

  const showRipple = projection !== null && impactPayload !== undefined && impactPayload.affected.length > 0

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name */}
        <div>
          <label htmlFor="ing-name" className={labelClass}>Name *</label>
          <input
            id="ing-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Expedition Spiced Rum"
          />
        </div>

        {/* Category + Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ing-type" className={labelClass}>Category *</label>
            <select
              id="ing-type"
              value={ingredient_type}
              onChange={(e) => setIngredientType(e.target.value as IngredientType)}
              className={inputClass}
            >
              {INGREDIENT_TYPES.map((t) => (
                <option key={t} value={t}>{INGREDIENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ing-subcategory" className={labelClass}>Subcategory</label>
            <input
              id="ing-subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className={inputClass}
              placeholder="e.g. Spiced rum, Elderflower"
            />
            <FieldHelper>Optional. Helps you filter and group ingredients.</FieldHelper>
          </div>
        </div>

        {/* How do you buy this? */}
        <fieldset>
          <legend className={labelClass}>How do you buy this? *</legend>
          <div className="flex flex-wrap gap-2">
            {([ 'ml', 'g', 'each' ] as const).map((u) => {
              const labels: Record<BaseUnit, string> = { ml: 'Liquid / volume', g: 'Weight', each: 'Count / each' }
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setPurchaseMode(u)
                    setBaseUnit(u)
                    if (u === 'each') setPackSizeStr('1')
                  }}
                  className={`${chipClass} ${purchaseMode === u ? chipActive : chipIdle}`}
                >
                  {labels[u]}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setPurchaseMode('prepared')}
              className={`${chipClass} ${purchaseMode === 'prepared' ? chipActive : chipIdle}`}
            >
              Made in-house
            </button>
          </div>
          <FieldHelper>
            {purchaseMode === 'ml' && 'Spirits, liqueurs, wine, beer, mixers, syrups — anything measured in ml.'}
            {purchaseMode === 'g' && 'Spices, sugars, dried ingredients, anything sold by weight.'}
            {purchaseMode === 'each' && 'Limes, eggs, garnishes, anything you count by the item.'}
            {purchaseMode === 'prepared' && 'A recipe made in-house (e.g. a house syrup). Cost is derived from its components.'}
          </FieldHelper>
        </fieldset>

        {/* Prepared mode: yield unit + yield amount */}
        {purchaseMode === 'prepared' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ing-yield-unit" className={labelClass}>Yield unit *</label>
              <select
                id="ing-yield-unit"
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value as BaseUnit)}
                className={inputClass}
              >
                <option value="ml">ml (volume)</option>
                <option value="g">g (weight)</option>
                <option value="each">each (count)</option>
              </select>
              <FieldHelper>The unit this recipe produces, e.g. ml for a syrup.</FieldHelper>
            </div>
            <div>
              <label htmlFor="ing-yield-amount" className={labelClass}>Yield amount *</label>
              <input
                id="ing-yield-amount"
                type="number"
                step="1"
                min={1}
                value={yieldAmountStr}
                onChange={(e) => setYieldAmountStr(e.target.value)}
                className={inputClass}
                placeholder="e.g. 1600"
              />
              <FieldHelper>How much one batch makes, e.g. 1600 for a 1.6L syrup.</FieldHelper>
            </div>
          </div>
        )}

        {/* Standard mode: Price + packs bought */}
        {purchaseMode !== 'prepared' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ing-price" className={labelClass}>Price paid (£) *</label>
              <input
                id="ing-price"
                type="number"
                step="0.01"
                min={0}
                value={price_str}
                onChange={(e) => setPriceStr(e.target.value)}
                className={inputClass}
                placeholder="e.g. 14.40"
              />
              <FieldHelper>The total you pay at the till, including VAT if applicable.</FieldHelper>
            </div>
            <div>
              <label htmlFor="ing-purchase-qty" className={labelClass}>Packs bought *</label>
              <input
                id="ing-purchase-qty"
                type="number"
                step="1"
                min={1}
                value={purchase_qty_str}
                onChange={(e) => setPurchaseQtyStr(e.target.value)}
                className={inputClass}
                placeholder="1"
              />
              <FieldHelper>
                How many packs this price covers. 1 bottle, 24 for a case, leave 1 for a single item.
              </FieldHelper>
            </div>
          </div>
        )}

        {/* Quantity per pack (ml / g only; each defaults to 1 but is editable) */}
        {purchaseMode !== 'prepared' && (
          <div>
            {base_unit === 'ml' && (
              <>
                <label htmlFor="ing-pack-size" className={labelClass}>Volume per pack (ml) *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {BOTTLE_SIZES_ML.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setPackSizeStr(String(s))}
                      className={`${chipClass} ${pack_size_str === String(s) ? chipActive : chipIdle}`}
                    >
                      {s}ml
                    </button>
                  ))}
                </div>
                <input
                  id="ing-pack-size"
                  type="number"
                  step="1"
                  min={1}
                  value={pack_size_str}
                  onChange={(e) => setPackSizeStr(e.target.value)}
                  className={inputClass}
                  placeholder="700 — or type any volume, e.g. 10000 for a 10L keg"
                />
                <FieldHelper>
                  The amount in one pack: 700 for a 700ml bottle, 24 for a case of 24, 5000 for a 5kg bag.
                </FieldHelper>
              </>
            )}

            {base_unit === 'g' && (
              <>
                <label htmlFor="ing-pack-size" className={labelClass}>Weight per pack (g) *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {WEIGHT_SIZES_G.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setPackSizeStr(String(s))}
                      className={`${chipClass} ${pack_size_str === String(s) ? chipActive : chipIdle}`}
                    >
                      {s}g
                    </button>
                  ))}
                </div>
                <input
                  id="ing-pack-size"
                  type="number"
                  step="1"
                  min={1}
                  value={pack_size_str}
                  onChange={(e) => setPackSizeStr(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 1000 for a 1kg bag"
                />
                <FieldHelper>
                  The amount in one pack: 700 for a 700ml bottle, 24 for a case of 24, 5000 for a 5kg bag.
                </FieldHelper>
              </>
            )}

            {base_unit === 'each' && (
              <>
                <label htmlFor="ing-pack-size" className={labelClass}>Items per pack</label>
                <input
                  id="ing-pack-size"
                  type="number"
                  step="1"
                  min={1}
                  value={pack_size_str}
                  onChange={(e) => setPackSizeStr(e.target.value)}
                  className={inputClass}
                  placeholder="1"
                />
                <FieldHelper>
                  How many individual items come in a pack. 1 for a single lime. 6 for a bag of 6.
                </FieldHelper>
              </>
            )}
          </div>
        )}

        {/* Pack format (standard mode only) */}
        {purchaseMode !== 'prepared' && (
          <div>
            <label htmlFor="ing-pack-format" className={labelClass}>Pack format</label>
            <select
              id="ing-pack-format"
              value={pack_format}
              onChange={(e) => setPackFormat(e.target.value)}
              className={inputClass}
            >
              <option value="">Not specified</option>
              {PACK_FORMATS.map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
            <FieldHelper>
              What it physically arrives as. We still cost on the measured quantity.
            </FieldHelper>
          </div>
        )}

        {/* Standard mode: Live cost readout */}
        {purchaseMode !== 'prepared' && costReadout !== null && (
          <p className="text-sm text-gold-200 tabular-nums">{costReadout}</p>
        )}

        {/* Components editor (prepared mode) */}
        {purchaseMode === 'prepared' && (
          <div className="border border-gold-500/20 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gold-500/20">
              <p className="text-sm font-medium text-parchment-200">Components</p>
            </div>
            <div className="px-4 py-4 space-y-4">
              {entry === null ? (
                <p className={helperClass}>Save this in-house recipe first, then add its components.</p>
              ) : (
                <>
                  {/* Component list */}
                  {components.length > 0 && (
                    <ul className="space-y-2">
                      {components.map((c) => {
                        const costP = Math.round(
                          usableCostPerBaseUnitP(c.price_p, c.purchase_qty, c.pack_size, c.yield_pct) * c.amount_base,
                        )
                        const measure = c.recipe_unit !== null && c.recipe_qty !== null
                          ? `${c.recipe_qty} ${c.recipe_unit}`
                          : `${c.amount_base} ${c.component_base_unit}`
                        return (
                          <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-parchment-100 font-medium">{c.component_name}</span>
                            <span className="text-parchment-400 text-xs tabular-nums">{measure}</span>
                            <span className="text-gold-200 text-xs tabular-nums">£{(costP / 100).toFixed(2)}</span>
                            <button
                              type="button"
                              disabled={compPending}
                              onClick={() => handleDeleteComponent(c.id)}
                              className="text-xs text-red-300 hover:text-red-200 underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {/* Live batch cost readout */}
                  {components.length > 0 && (
                    <div className="text-sm text-gold-200 tabular-nums space-y-1 pt-2 border-t border-gold-500/10">
                      <p>Batch cost: £{(batchCostP / 100).toFixed(2)}</p>
                      {yieldAmountLive !== null && yieldAmountLive > 0 && (
                        <>
                          <p>Cost per {yieldUnit}: £{((batchCostP / yieldAmountLive) / 100).toFixed(4)}</p>
                          {yieldUnit === 'ml' && (
                            <p>Per 25ml: £{((batchCostP / yieldAmountLive) * 25 / 100).toFixed(2)}</p>
                          )}
                          {yieldUnit === 'g' && (
                            <p>Per 100g: £{((batchCostP / yieldAmountLive) * 100 / 100).toFixed(2)}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Add component */}
                  <div className="pt-2 border-t border-gold-500/10">
                    <p className="text-sm font-medium text-parchment-200 mb-3">Add a component</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Ingredient</label>
                        <IngredientPicker
                          libraryEntries={libraryEntries.filter((e) => e.id !== entry.id)}
                          selectedEntryId={selectedComponent?.id ?? null}
                          onChange={(e) => {
                            setSelectedComponent(e)
                            setCompRecipeUnit(null)
                            setCompRecipeQty(null)
                          }}
                        />
                        <FieldHelper>Pick any library ingredient. Cycle detection runs server-side.</FieldHelper>
                      </div>
                      {selectedComponent !== null && (
                        <ServeUnitPicker
                          baseUnit={selectedComponent.base_unit}
                          customUnits={serveUnits.filter((u) => u.library_ingredient_id === selectedComponent.id)}
                          recipeUnit={compRecipeUnit}
                          recipeQty={compRecipeQty}
                          onChange={(next) => {
                            setCompRecipeUnit(next.recipe_unit)
                            setCompRecipeQty(next.recipe_qty)
                          }}
                          costPerBaseUnitP={usableCostPerBaseUnitP(
                            selectedComponent.price_p,
                            selectedComponent.purchase_qty,
                            selectedComponent.pack_size,
                            selectedComponent.yield_pct,
                          )}
                        />
                      )}
                      {compError && <p role="alert" className="text-sm text-red-300">{compError}</p>}
                      <button
                        type="button"
                        disabled={compPending || selectedComponent === null}
                        onClick={handleAddComponent}
                        className="px-4 py-2 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        {compPending ? 'Adding…' : 'Add component'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Ripple preview */}
        {showRipple && projection && (
          <div>
            <p className="text-sm text-parchment-300 mb-3">Impact on drinks using this ingredient:</p>
            <RipplePreview projected={projection.projected} rollups={projection.rollups} />
          </div>
        )}

        {/* Advanced costing (standard mode only) */}
        {purchaseMode !== 'prepared' && <div className="border border-gold-500/20 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="w-full flex justify-between items-center px-4 py-3 text-sm text-parchment-300 hover:text-parchment-100 transition-colors"
          >
            <span>Advanced costing</span>
            <span className="text-parchment-500 text-xs">{advancedOpen ? 'Hide' : 'Show'}</span>
          </button>
          {advancedOpen && (
            <div className="px-4 pb-4 border-t border-gold-500/20 pt-4">
              <label htmlFor="ing-yield" className={labelClass}>Yield %</label>
              <input
                id="ing-yield"
                type="number"
                step="1"
                min={1}
                max={100}
                value={yield_pct_str}
                onChange={(e) => setYieldPctStr(e.target.value)}
                className={inputClass}
                placeholder="100"
              />
              <FieldHelper>
                The usable proportion. 100 for spirits, around 75 for citrus juice, lower for kegs with line loss.
              </FieldHelper>
            </div>
          )}
        </div>}

        {/* Serve units (standard mode only) */}
        {purchaseMode !== 'prepared' && <div className="border border-gold-500/20 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gold-500/20">
            <p className="text-sm font-medium text-parchment-200">Serve units</p>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Standard (always-available) units */}
            <div>
              <p className={helperClass}>
                Always available:{' '}
                {STANDARD_SERVE_UNITS[base_unit].map((u) => u.name).join(', ')}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {STANDARD_SERVE_UNITS[base_unit].map((u) => (
                  <span key={u.name} className="px-3 py-1.5 rounded-lg border border-gold-500/20 bg-jerry-green-700/20 text-xs text-parchment-400">
                    {u.name}
                  </span>
                ))}
              </div>
            </div>

            {entry === null ? (
              <p className={helperClass}>Save this ingredient first, then add custom serve units.</p>
            ) : (
              <>
                {/* Existing custom units */}
                {serveUnits.length > 0 && (
                  <ul className="space-y-2">
                    {serveUnits.map((u) => {
                      const convLabel =
                        base_unit === 'each'
                          ? `${(1 / u.base_per_unit).toFixed(4).replace(/\.?0+$/, '')} per item`
                          : `1 ${u.name} = ${u.base_per_unit} ${base_unit}`
                      return (
                        <li key={u.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-parchment-100 font-medium">{u.name}</span>
                          <span className="text-parchment-400 text-xs tabular-nums">{convLabel}</span>
                          <button
                            type="button"
                            disabled={suPending}
                            onClick={() => handleDeleteServeUnit(u.id, u.name)}
                            className="text-xs text-red-300 hover:text-red-200 underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Add new unit */}
                <div className="pt-2 border-t border-gold-500/10">
                  <p className="text-sm font-medium text-parchment-200 mb-3">Add a serve unit</p>
                  {base_unit === 'each' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="su-name" className={labelClass}>Unit name</label>
                        <input
                          id="su-name"
                          value={suName}
                          onChange={(e) => setSuName(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. wedge"
                        />
                        <FieldHelper>What you call one portion of this item.</FieldHelper>
                      </div>
                      <div>
                        <label htmlFor="su-qty" className={labelClass}>How many per item</label>
                        <input
                          id="su-qty"
                          type="number"
                          step="any"
                          min="0.0001"
                          value={suQtyStr}
                          onChange={(e) => setSuQtyStr(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. 6"
                        />
                        <FieldHelper>How many of this unit you get from one whole item.</FieldHelper>
                      </div>
                    </div>
                  )}
                  {base_unit === 'ml' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="su-name" className={labelClass}>Unit name</label>
                        <input
                          id="su-name"
                          value={suName}
                          onChange={(e) => setSuName(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. shot"
                        />
                        <FieldHelper>What you call this serve unit.</FieldHelper>
                      </div>
                      <div>
                        <label htmlFor="su-qty" className={labelClass}>ml per unit</label>
                        <input
                          id="su-qty"
                          type="number"
                          step="any"
                          min="0.0001"
                          value={suQtyStr}
                          onChange={(e) => setSuQtyStr(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. 25"
                        />
                        <FieldHelper>The volume of one unit in ml.</FieldHelper>
                      </div>
                    </div>
                  )}
                  {base_unit === 'g' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="su-name" className={labelClass}>Unit name</label>
                        <input
                          id="su-name"
                          value={suName}
                          onChange={(e) => setSuName(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. bean"
                        />
                        <FieldHelper>What you call this serve unit.</FieldHelper>
                      </div>
                      <div>
                        <label htmlFor="su-qty" className={labelClass}>Grams per unit</label>
                        <input
                          id="su-qty"
                          type="number"
                          step="any"
                          min="0.0001"
                          value={suQtyStr}
                          onChange={(e) => setSuQtyStr(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. 0.2"
                        />
                        <FieldHelper>The weight of one unit in grams.</FieldHelper>
                      </div>
                    </div>
                  )}
                  {suError && <p role="alert" className="text-sm text-red-300 mt-2">{suError}</p>}
                  <button
                    type="button"
                    disabled={suPending}
                    onClick={handleAddServeUnit}
                    className="mt-3 px-4 py-2 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                  >
                    {suPending ? 'Saving…' : 'Add unit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>}

        {/* Barcode */}
        <div>
          <label htmlFor="ing-barcode" className={labelClass}>Barcode</label>
          <div className="flex gap-2">
            <input
              id="ing-barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className={inputClass}
              placeholder="Optional — scan or type the barcode"
            />
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="shrink-0 px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm"
            >
              Scan
            </button>
          </div>
          <FieldHelper>Once set, scanning this in the cocktail editor auto-selects this ingredient.</FieldHelper>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="ing-notes" className={labelClass}>Notes</label>
          <textarea
            id="ing-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass} resize-vertical`}
            placeholder="Optional — supplier, SKU, anything useful"
          />
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
          <BarcodeScanner onScan={handleScan} onClose={() => setScanOpen(false)} />
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
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg"
          >
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
