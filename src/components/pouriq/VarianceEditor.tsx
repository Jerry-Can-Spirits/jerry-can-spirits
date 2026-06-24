'use client'

import { useEffect, useState, useTransition } from 'react'
import { VARIANCE_REASONS } from '@/lib/pouriq/types'

interface RollingTrendPoint {
  counted_at: string
  variance_cost_p: number | null
  reason: string | null
}

interface RollingVarianceRow {
  library_ingredient_id: string
  library_name: string
  pack_size: number
  price_p: number
  purchase_qty: number
  latest_count_at: string | null
  latest_count_qty: number | null
  previous_count_at: string | null
  theoretical_used_ml: number
  actual_used_ml: number | null
  variance_ml: number | null
  variance_pct: number | null
  variance_cost_p: number | null
  severity: 'none' | 'within-tolerance' | 'amber' | 'red'
  impact_p: number
  unmatched_in_window: number
  latest_reason: string | null
  persistent_loss: boolean
  trend: RollingTrendPoint[]
}

interface VarianceApiResponse {
  rows: RollingVarianceRow[]
}

const inputClass =
  'w-24 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded-sm text-parchment-50 text-sm focus:border-gold-400 focus:outline-hidden'

const selectClass =
  'px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded-sm text-parchment-50 text-sm focus:border-gold-400 focus:outline-hidden'

function formatMoney(p: number): string {
  const sign = p < 0 ? '-' : ''
  return `${sign}£${(Math.abs(p) / 100).toFixed(2)}`
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function severityClass(severity: RollingVarianceRow['severity']): string {
  switch (severity) {
    case 'within-tolerance': return 'text-parchment-300'
    case 'amber': return 'text-amber-300'
    case 'red': return 'text-red-300'
    default: return 'text-parchment-400'
  }
}

export function VarianceEditor() {
  const [rows, setRows] = useState<RollingVarianceRow[] | null>(null)
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [openTrend, setOpenTrend] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch('/api/pouriq/variance')
      .then((r) =>
        r.ok
          ? (r.json() as Promise<VarianceApiResponse>)
          : Promise.reject(new Error('Could not load variance data')),
      )
      .then((d) => setRows(d.rows))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function saveCount(id: string) {
    const raw = counts[id]
    const qty = parseFloat(raw)
    if (!Number.isFinite(qty) || qty < 0) return
    startTransition(async () => {
      setError(null)
      const res = await fetch('/api/pouriq/variance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          library_ingredient_id: id,
          count_qty: qty,
          reason: reasons[id] || undefined,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Save failed' }))) as { error?: string }
        setError(err.error ?? 'Save failed')
        return
      }
      const data = (await res.json()) as VarianceApiResponse
      setRows(data.rows)
      setCounts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setReasons((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    })
  }

  if (loading) return <p className="text-sm text-parchment-300">Loading variance data…</p>
  if (error && !rows) return <p role="alert" className="text-sm text-red-300">{error}</p>
  if (!rows) return null
  if (rows.length === 0) {
    return (
      <p className="text-sm text-parchment-300">
        No bottle-priced ingredients in your library yet. Add ingredients before counting stock.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="space-y-3">
        {rows.map((row) => {
          const id = row.library_ingredient_id
          const countVal = counts[id] ?? ''
          const countNum = parseFloat(countVal)
          const saveEnabled = !pending && Number.isFinite(countNum) && countNum >= 0
          const showVariance =
            row.variance_cost_p !== null && row.unmatched_in_window === 0
          const showReason = row.severity === 'amber' || row.severity === 'red'
          const isTrendOpen = openTrend === id

          return (
            <div
              key={id}
              className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-parchment-100 font-medium">{row.library_name}</span>
                  <span className="text-parchment-400 text-sm ml-1">({row.pack_size}ml)</span>
                  {row.persistent_loss && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded-sm bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] uppercase tracking-widest">
                      persistent loss
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenTrend(isTrendOpen ? null : id)}
                  className="text-xs text-parchment-400 hover:text-parchment-200 underline"
                >
                  {isTrendOpen ? 'Hide trend' : 'Trend'}
                </button>
              </div>

              <div className="text-sm text-parchment-400 mb-3 space-y-0.5">
                {row.latest_count_at ? (
                  <p>
                    Last count: {formatShortDate(row.latest_count_at)}
                    {row.latest_count_qty !== null && (
                      <span className="text-parchment-200 ml-1">· {row.latest_count_qty} bottles</span>
                    )}
                  </p>
                ) : (
                  <p>Never counted</p>
                )}
                {row.previous_count_at && (
                  <p>Expected used since last count: {Math.round(row.theoretical_used_ml)} ml</p>
                )}
              </div>

              {showVariance && (
                <div className={`text-sm mb-3 ${severityClass(row.severity)}`}>
                  {row.severity === 'within-tolerance' ? (
                    <span>Within tolerance</span>
                  ) : (
                    <>
                      {row.variance_ml !== null && <span>{Math.round(row.variance_ml)} ml</span>}
                      {row.variance_pct !== null && (
                        <span className="ml-2">({row.variance_pct.toFixed(1)}%)</span>
                      )}
                      <span className="ml-2">{formatMoney(row.variance_cost_p as number)}</span>
                    </>
                  )}
                </div>
              )}

              {row.unmatched_in_window > 0 && (
                <p className="text-sm text-amber-300 mb-3">
                  <a href="/trade/pouriq/unmatched" className="underline hover:text-amber-200">
                    Usage understated, {row.unmatched_in_window} unmapped sales this period
                  </a>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={countVal}
                  onChange={(e) => setCounts((prev) => ({ ...prev, [id]: e.target.value }))}
                  className={inputClass}
                  placeholder="bottles"
                  aria-label={`${row.library_name} count now`}
                />
                {showReason && (
                  <select
                    value={reasons[id] ?? ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [id]: e.target.value }))}
                    className={selectClass}
                    aria-label={`${row.library_name} reason`}
                  >
                    <option value="">reason (optional)</option>
                    {VARIANCE_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => saveCount(id)}
                  disabled={!saveEnabled}
                  className="px-3 py-1 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg transition-colors text-sm font-semibold disabled:opacity-40"
                >
                  Save count
                </button>
              </div>

              {isTrendOpen && row.trend.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gold-500/10 space-y-1">
                  {row.trend.map((point, i) => (
                    <div key={i} className="text-xs text-parchment-400 flex gap-3">
                      <span className="text-parchment-300">{formatShortDate(point.counted_at)}</span>
                      {point.variance_cost_p !== null && (
                        <span className={point.variance_cost_p < 0 ? 'text-red-300' : 'text-parchment-200'}>
                          {formatMoney(point.variance_cost_p)}
                        </span>
                      )}
                      {point.reason && <span>{point.reason}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
