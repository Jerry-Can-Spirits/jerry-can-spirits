'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PreviewPayload } from '@/app/api/pouriq/invoices/extract/route'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

interface Props {
  initial: PreviewPayload
  library: IngredientLibraryRow[]
}

interface LineState {
  applied: boolean
  unit_price_p: number       // editable; defaults to extracted_unit_price_p
  library_id: string | null  // when matched to an existing library entry
  // When creating a new library entry inline:
  create_new: boolean
  new_name: string
  new_type: IngredientType
  new_pricing_mode: 'bottle' | 'unit'
  new_bottle_size_ml: number | null
}

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']

export function InvoicePreview({ initial, library }: Props) {
  const router = useRouter()
  const [supplier, setSupplier] = useState(initial.supplier_name ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState(initial.invoice_number ?? '')
  const [invoiceDate, setInvoiceDate] = useState(initial.invoice_date ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lines, setLines] = useState<LineState[]>(() =>
    initial.lines.map((l): LineState => {
      let library_id: string | null = null
      if (l.match.kind === 'auto') library_id = l.match.library_id
      return {
        applied: l.match.kind === 'auto',
        unit_price_p: l.extracted_unit_price_p,
        library_id,
        create_new: false,
        new_name: l.extracted_name,
        new_type: 'spirit',
        new_pricing_mode: 'bottle',
        new_bottle_size_ml: null,
      }
    }),
  )

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const libraryById = useMemo(() => {
    const m = new Map<string, IngredientLibraryRow>()
    for (const e of library) m.set(e.id, e)
    return m
  }, [library])

  function currentCostFor(libraryId: string | null): number | null {
    if (!libraryId) return null
    const entry = libraryById.get(libraryId)
    if (!entry) return null
    return entry.unit_cost_p ?? entry.bottle_cost_p ?? null
  }

  async function handleSave() {
    setError(null)
    if (!lines.some((l) => l.applied)) {
      // Still allowed — saves an invoice record with applied_line_count=0
    }

    const body = {
      ticket: initial.ticket,
      supplier_name: supplier.trim() || null,
      invoice_number: invoiceNumber.trim() || null,
      invoice_date: invoiceDate.trim() || null,
      lines: lines.map((s, idx) => {
        const original = initial.lines[idx]
        const base = {
          extracted_name: original.extracted_name,
          extracted_quantity: original.extracted_quantity,
          extracted_unit_price_p: original.extracted_unit_price_p,
          extracted_line_total_p: original.extracted_line_total_p,
          applied: s.applied,
        }
        if (!s.applied) return base
        if (s.create_new) {
          return {
            ...base,
            new_library: {
              name: s.new_name.trim(),
              ingredient_type: s.new_type,
              bottle_size_ml: s.new_pricing_mode === 'bottle' ? s.new_bottle_size_ml : null,
              bottle_cost_p: s.new_pricing_mode === 'bottle' ? s.unit_price_p : null,
              unit_cost_p: s.new_pricing_mode === 'unit' ? s.unit_price_p : null,
            },
            new_cost_p: s.unit_price_p,
          }
        }
        return {
          ...base,
          library_id: s.library_id!,
          new_cost_p: s.unit_price_p,
        }
      }),
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/pouriq/invoices/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Save failed' })) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      const data = (await res.json()) as { invoice_id: string }
      const hasApplied = lines.some((l) => l.applied)
      if (hasApplied) {
        router.push(`/trade/pouriq/invoices/${data.invoice_id}/impact`)
      } else {
        router.push('/trade/pouriq/library')
      }
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
        <h2 className="text-lg font-serif font-bold text-white mb-4">Invoice details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-parchment-200 mb-2">Supplier</label>
            <input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-parchment-200 mb-2">Invoice number</label>
            <input id="number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-parchment-200 mb-2">Date (YYYY-MM-DD)</label>
            <input id="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} placeholder="2026-05-14" className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-jerry-green-900/40">
              <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                <th className="px-3 py-3">Apply</th>
                <th className="px-3 py-3">Extracted</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">New net £</th>
                <th className="px-3 py-3">Match</th>
                <th className="px-3 py-3">Current cost</th>
                <th className="px-3 py-3">Δ</th>
              </tr>
            </thead>
            <tbody>
              {initial.lines.map((line, idx) => {
                const s = lines[idx]
                const currentP = currentCostFor(s.library_id)
                const delta = currentP !== null ? s.unit_price_p - currentP : null
                return (
                  <tr key={idx} className="border-t border-gold-500/10 align-top">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={s.applied}
                        onChange={(e) => updateLine(idx, { applied: e.target.checked })}
                        className="h-4 w-4"
                        aria-label={`Apply line ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-parchment-100">
                      <div className="font-medium">{line.extracted_name}</div>
                      {line.extracted_line_total_p !== null && (
                        <div className="text-xs text-parchment-400 mt-1">Line total {formatMoney(line.extracted_line_total_p)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-parchment-300">{line.extracted_quantity ?? '—'}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={(s.unit_price_p / 100).toFixed(2)}
                        onChange={(e) => updateLine(idx, { unit_price_p: Math.round(parseFloat(e.target.value || '0') * 100) })}
                        className="w-24 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50"
                        aria-label={`New net price for line ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      {s.create_new ? (
                        <div className="space-y-2 min-w-[260px]">
                          <input value={s.new_name} onChange={(e) => updateLine(idx, { new_name: e.target.value })} placeholder="Name" className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm" />
                          <div className="flex gap-2">
                            <select value={s.new_type} onChange={(e) => updateLine(idx, { new_type: e.target.value as IngredientType })} className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm">
                              {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select value={s.new_pricing_mode} onChange={(e) => updateLine(idx, { new_pricing_mode: e.target.value as 'bottle' | 'unit' })} className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm">
                              <option value="bottle">Per bottle</option>
                              <option value="unit">Per unit</option>
                            </select>
                          </div>
                          {s.new_pricing_mode === 'bottle' && (
                            <input
                              type="number"
                              min={0}
                              step="1"
                              placeholder="Bottle size (ml)"
                              value={s.new_bottle_size_ml ?? ''}
                              onChange={(e) => updateLine(idx, { new_bottle_size_ml: e.target.value ? parseInt(e.target.value, 10) : null })}
                              className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
                            />
                          )}
                          <button type="button" onClick={() => updateLine(idx, { create_new: false })} className="text-xs text-parchment-400 hover:text-parchment-200 underline">
                            Cancel new entry
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-[220px]">
                          <select
                            value={s.library_id ?? ''}
                            onChange={(e) => updateLine(idx, { library_id: e.target.value || null })}
                            className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
                          >
                            <option value="">— select library entry —</option>
                            {line.match.kind === 'suggestions' && line.match.entries.map((e) => (
                              <option key={e.id} value={e.id}>{e.name} (suggested)</option>
                            ))}
                            {library.map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => updateLine(idx, { create_new: true, library_id: null })} className="text-xs text-gold-300 hover:text-gold-200 underline">
                            Create new library entry
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-parchment-200">
                      {currentP !== null ? formatMoney(currentP) : '—'}
                    </td>
                    <td className={`px-3 py-3 ${delta !== null && delta > 0 ? 'text-amber-300' : delta !== null && delta < 0 ? 'text-emerald-300' : 'text-parchment-300'}`}>
                      {delta === null ? '—' : `${delta > 0 ? '+' : ''}${formatMoney(delta)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg"
        >
          {submitting ? 'Saving…' : 'Save invoice'}
        </button>
      </div>
    </div>
  )
}
