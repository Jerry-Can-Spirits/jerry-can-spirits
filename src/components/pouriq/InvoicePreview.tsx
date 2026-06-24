'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PreviewPayload } from '@/app/api/pouriq/invoices/extract/route'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'
import { InvoiceLineRow, type LineState } from './InvoiceLineRow'

interface Props {
  initial: PreviewPayload
  library: IngredientLibraryRow[]
}

export function InvoicePreview({ initial, library }: Props) {
  const router = useRouter()
  const [supplier, setSupplier] = useState(initial.supplier_name ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState(initial.invoice_number ?? '')
  const [invoiceDate, setInvoiceDate] = useState(initial.invoice_date ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lines, setLines] = useState<LineState[]>(() =>
    initial.lines.map((l): LineState => {
      if (l.match.kind === 'auto') {
        return {
          applied: true,
          unit_price_p: l.extracted_unit_price_p,
          match: { kind: 'existing', library_id: l.match.library_id },
        }
      }
      return {
        applied: false,
        unit_price_p: l.extracted_unit_price_p,
        match: { kind: 'existing', library_id: null },
      }
    }),
  )

  const handleChange = useCallback((index: number, patch: Partial<LineState>) => {
    setLines((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }, [])

  const handleToggleCreateNew = useCallback((index: number, toNew: boolean) => {
    setLines((prev) => {
      const next = [...prev]
      const current = next[index]
      if (toNew) {
        const seedName = initial.lines[index].extracted_name
        next[index] = {
          ...current,
          match: {
            kind: 'new',
            new_name: seedName,
            new_type: 'spirit',
            new_pricing_mode: 'bottle',
            new_pack_size: null,
          },
        }
      } else {
        next[index] = {
          ...current,
          match: { kind: 'existing', library_id: null },
        }
      }
      return next
    })
  }, [initial.lines])

  const libraryById = useMemo(() => {
    const m = new Map<string, IngredientLibraryRow>()
    for (const e of library) m.set(e.id, e)
    return m
  }, [library])

  async function handleSave() {
    setError(null)

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
        if (s.match.kind === 'new') {
          const isUnit = s.match.new_pricing_mode === 'unit'
          return {
            ...base,
            new_library: {
              name: s.match.new_name.trim(),
              ingredient_type: s.match.new_type,
              base_unit: isUnit ? 'each' as const : 'ml' as const,
              pack_size: isUnit ? 1 : (s.match.new_pack_size ?? 700),
              price_p: s.unit_price_p,
            },
            new_cost_p: s.unit_price_p,
          }
        }
        return {
          ...base,
          library_id: s.match.library_id,
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
    } finally {
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
            <input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-hidden" />
          </div>
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-parchment-200 mb-2">Invoice number</label>
            <input id="number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-hidden" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-parchment-200 mb-2">Date (YYYY-MM-DD)</label>
            <input id="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} placeholder="2026-05-14" className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-hidden" />
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
              {initial.lines.map((line, idx) => (
                <InvoiceLineRow
                  key={idx}
                  index={idx}
                  line={line}
                  state={lines[idx]}
                  library={library}
                  libraryById={libraryById}
                  onChange={handleChange}
                  onToggleCreateNew={handleToggleCreateNew}
                />
              ))}
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
          className="px-6 py-3 bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg"
        >
          {submitting ? 'Saving…' : 'Save invoice'}
        </button>
      </div>
    </div>
  )
}
