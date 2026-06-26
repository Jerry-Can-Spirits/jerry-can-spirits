'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { receiveStockAction, recordStockCountAction, recordProductionAction, setParAction } from '@/lib/pouriq/server-actions'
import type { RollingStockRow } from '@/lib/pouriq/stock-loader'
import { stockUnitWords } from '@/lib/pouriq/stock'

interface Props {
  rows: RollingStockRow[]
}

const inputClass =
  'w-24 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded-sm text-parchment-50 text-sm focus:border-gold-400 focus:outline-hidden'

const actionButtonClass =
  'px-3 py-1 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg transition-colors text-sm font-semibold disabled:opacity-40'

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function StockManager({ rows }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [receiveInputs, setReceiveInputs] = useState<Record<string, string>>({})
  const [countInputs, setCountInputs] = useState<Record<string, string>>({})
  const [batchInputs, setBatchInputs] = useState<Record<string, string>>({})
  const [parInputs, setParInputs] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <p className="text-sm text-parchment-300">
        No bottle-priced ingredients yet. Add ingredients with a bottle size and cost to track stock.
      </p>
    )
  }

  function handleReceive(id: string) {
    const raw = receiveInputs[id] ?? ''
    const qty = parseFloat(raw)
    if (!Number.isFinite(qty) || qty <= 0) return
    setError(null)
    startTransition(async () => {
      try {
        await receiveStockAction(id, qty)
        setReceiveInputs((prev) => { const next = { ...prev }; delete next[id]; return next })
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not record delivery.')
      }
    })
  }

  function handleCount(id: string) {
    const raw = countInputs[id] ?? ''
    const qty = parseFloat(raw)
    if (!Number.isFinite(qty) || qty < 0) return
    setError(null)
    startTransition(async () => {
      try {
        await recordStockCountAction(id, qty)
        setCountInputs((prev) => { const next = { ...prev }; delete next[id]; return next })
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not save count.')
      }
    })
  }

  function handleSetPar(id: string) {
    const trimmed = (parInputs[id] ?? '').trim()
    const par = trimmed === '' ? null : parseFloat(trimmed)
    if (par !== null && (!Number.isFinite(par) || par < 0)) return
    setError(null)
    startTransition(async () => {
      try {
        await setParAction(id, par)
        setParInputs((prev) => { const next = { ...prev }; delete next[id]; return next })
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not save par level.')
      }
    })
  }

  function handleMakeBatch(id: string) {
    const raw = batchInputs[id] ?? ''
    const batches = parseFloat(raw)
    if (!Number.isFinite(batches) || batches <= 0) return
    setError(null)
    startTransition(async () => {
      try {
        await recordProductionAction(id, batches)
        setBatchInputs((prev) => { const next = { ...prev }; delete next[id]; return next })
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not record batch.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex justify-end">
        <a href="/trade/pouriq/stock/order" className="text-sm text-gold-300 hover:text-gold-200 underline">Order report →</a>
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const id = row.library_ingredient_id
          const receiveVal = receiveInputs[id] ?? ''
          const countVal = countInputs[id] ?? ''
          const batchVal = batchInputs[id] ?? ''
          const parVal = parInputs[id] ?? (row.par_bottles != null ? String(row.par_bottles) : '')
          const receiveQty = parseFloat(receiveVal)
          const countQty = parseFloat(countVal)
          const batchQty = parseFloat(batchVal)
          const receiveEnabled = !pending && Number.isFinite(receiveQty) && receiveQty > 0
          const countEnabled = !pending && Number.isFinite(countQty) && countQty >= 0
          const batchEnabled = !pending && Number.isFinite(batchQty) && batchQty > 0
          const onHand = row.on_hand_bottles !== null ? Math.max(0, row.on_hand_bottles) : null
          const isNegative = row.on_hand_bottles !== null && row.on_hand_bottles < 0
          const unit = stockUnitWords(row.pack_format)

          return (
            <div key={id} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-4">
              <div className="mb-3">
                <span className="text-parchment-100 font-medium">{row.library_name}</span>
                <span className="text-parchment-400 text-sm ml-1">({row.pack_size}ml)</span>
              </div>

              {row.needs_opening_count ? (
                <p className="text-sm text-amber-300 mb-3">
                  Set an opening count to start tracking on-hand stock.
                </p>
              ) : (
                <div className="text-sm text-parchment-300 mb-3 space-y-0.5">
                  <p>
                    <span className="text-parchment-100">{onHand?.toFixed(1)} {unit.many}</span>
                    {isNegative && (
                      <span className="text-parchment-400 ml-2">(check stock)</span>
                    )}
                  </p>
                  {row.needs_reorder && (
                    <p className="text-amber-300 text-xs">Low · order {row.reorder_qty} {row.reorder_qty === 1 ? unit.one : unit.many}</p>
                  )}
                  {row.anchor_count_at && (
                    <p className="text-parchment-400 text-xs">estimate, last counted {formatShortDate(row.anchor_count_at)}</p>
                  )}
                  {(row.receipts_since > 0 || row.expected_usage_bottles > 0) && (
                    <p className="text-parchment-400 text-xs">
                      {row.receipts_since > 0 && `+${row.receipts_since.toFixed(1)} received`}
                      {row.receipts_since > 0 && row.expected_usage_bottles > 0 && ' · '}
                      {row.expected_usage_bottles > 0 && `${row.expected_usage_bottles.toFixed(1)} used`}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {!row.needs_opening_count && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={receiveVal}
                      onChange={(e) => setReceiveInputs((prev) => ({ ...prev, [id]: e.target.value }))}
                      className={inputClass}
                      placeholder={unit.many}
                      aria-label={`${row.library_name} delivery quantity`}
                    />
                    <button
                      type="button"
                      onClick={() => handleReceive(id)}
                      disabled={!receiveEnabled}
                      className={actionButtonClass}
                    >
                      Receive
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={countVal}
                    onChange={(e) => setCountInputs((prev) => ({ ...prev, [id]: e.target.value }))}
                    className={inputClass}
                    placeholder={unit.many}
                    aria-label={`${row.library_name} count`}
                  />
                  <button
                    type="button"
                    onClick={() => handleCount(id)}
                    disabled={!countEnabled}
                    className={actionButtonClass}
                  >
                    {row.needs_opening_count ? 'Set opening count' : 'Save count'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={parVal}
                    onChange={(e) => setParInputs((prev) => ({ ...prev, [id]: e.target.value }))}
                    className={inputClass}
                    placeholder="par"
                    aria-label={`${row.library_name} par level`}
                  />
                  <button
                    type="button"
                    onClick={() => handleSetPar(id)}
                    disabled={pending}
                    className={actionButtonClass}
                  >
                    Set par
                  </button>
                </div>

                {row.is_prepared === 1 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={batchVal}
                        onChange={(e) => setBatchInputs((prev) => ({ ...prev, [id]: e.target.value }))}
                        className={inputClass}
                        placeholder="batches"
                        aria-label={`${row.library_name} batch quantity`}
                      />
                      <button
                        type="button"
                        onClick={() => handleMakeBatch(id)}
                        disabled={!batchEnabled}
                        className={actionButtonClass}
                      >
                        Make batch
                      </button>
                    </div>
                    <p className="text-parchment-400 text-xs">
                      Records a batch. Tops up this recipe&apos;s stock and draws down its components.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
