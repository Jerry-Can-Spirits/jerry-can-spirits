'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
import type { VolumeCadence } from '@/lib/pouriq/types'

interface VarianceRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number
  bottle_cost_p: number
  start_count: number | null
  end_count: number | null
  theoretical_used_ml: number
  actual_used_ml: number | null
  variance_ml: number | null
  variance_pct: number | null
  variance_cost_p: number | null
}

interface RecentPeriod {
  period_start: string
  period_end: string
  total_abs_cost_p: number
}

interface VarianceResponse {
  cadence: VolumeCadence
  current_period: { start: string; end: string }
  rows: VarianceRow[]
  recent_periods: RecentPeriod[]
}

interface Props {
  menuId: string
  initialCadence: VolumeCadence
}

const inputClass = 'w-20 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'

function formatMoney(p: number | null): string {
  if (p === null) return '—'
  const sign = p > 0 ? '+' : p < 0 ? '−' : ''
  return `${sign}£${(Math.abs(p) / 100).toFixed(2)}`
}

function formatMl(ml: number | null): string {
  if (ml === null) return '—'
  const rounded = Math.round(ml)
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded.toLocaleString('en-GB')} ml`
}

function formatPct(pct: number | null): string {
  if (pct === null) return '—'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function colourForVariance(pct: number | null): string {
  if (pct === null) return 'text-parchment-300'
  const abs = Math.abs(pct)
  if (abs < 10) return 'text-parchment-100'
  if (abs <= 20) return 'text-amber-300'
  return 'text-red-300'
}

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function VarianceEditor({ menuId, initialCadence }: Props) {
  const router = useRouter()
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null)
  const [data, setData] = useState<VarianceResponse | null>(null)
  const [edits, setEdits] = useState<Record<string, { start: string; end: string }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setPeriod(null)
  }, [initialCadence])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setInfo(null)
    const params = new URLSearchParams({ cadence: initialCadence })
    if (period) {
      params.set('period_start', period.start)
      params.set('period_end', period.end)
    }
    fetch(`/api/pouriq/menus/${encodeURIComponent(menuId)}/variance?${params.toString()}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<VarianceResponse>) : Promise.reject(new Error('Could not load variance')),
      )
      .then((d) => {
        if (cancelled) return
        setData(d)
        const seed: Record<string, { start: string; end: string }> = {}
        for (const r of d.rows) {
          seed[r.library_ingredient_id] = {
            start: r.start_count !== null ? String(r.start_count) : '',
            end: r.end_count !== null ? String(r.end_count) : '',
          }
        }
        setEdits(seed)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [menuId, initialCadence, period])

  function updateEdit(id: string, patch: Partial<{ start: string; end: string }>) {
    setEdits((s) => ({ ...s, [id]: { ...(s[id] ?? { start: '', end: '' }), ...patch } }))
  }

  function save() {
    if (!data) return
    setError(null)
    setInfo(null)
    const entries: Array<{ library_ingredient_id: string; start_count: number; end_count: number }> = []
    for (const r of data.rows) {
      const e = edits[r.library_ingredient_id]
      if (!e || e.start === '' || e.end === '') continue
      const startN = parseFloat(e.start)
      const endN = parseFloat(e.end)
      if (!Number.isFinite(startN) || startN < 0) {
        setError(`${r.library_name}: start count must be a non-negative number`)
        return
      }
      if (!Number.isFinite(endN) || endN < 0) {
        setError(`${r.library_name}: end count must be a non-negative number`)
        return
      }
      entries.push({
        library_ingredient_id: r.library_ingredient_id,
        start_count: startN,
        end_count: endN,
      })
    }
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/menus/${encodeURIComponent(menuId)}/variance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: data.current_period.start,
          period_end: data.current_period.end,
          entries,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Save failed' }))) as { error?: string }
        setError(err.error ?? 'Save failed')
        return
      }
      const updated = (await res.json()) as VarianceResponse
      setData(updated)
      setInfo(`Saved ${entries.length} ingredient count${entries.length === 1 ? '' : 's'}.`)
      router.refresh()
    })
  }

  if (loading) return <p className="text-sm text-parchment-300">Loading variance…</p>
  if (error && !data) return <p role="alert" className="text-sm text-red-300">{error}</p>
  if (!data) return null

  const anyTheoretical = data.rows.some((r) => r.theoretical_used_ml > 0)
  const visibleRows = data.rows.filter((r) => r.theoretical_used_ml > 0 || r.start_count !== null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-white">Stock variance</h2>
          <p className="text-xs text-parchment-400 mt-1">
            Current period: {formatDateRange(data.current_period.start, data.current_period.end)}
          </p>
        </div>
        <p className="text-xs text-parchment-400 max-w-md">
          Enter the bottle count at the start of the period and what is left at the end. Pour IQ compares that against what sales should have used.
        </p>
      </div>

      {!anyTheoretical && (
        <div className="bg-jerry-green-800/40 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
          Enter sales volumes above first. Variance compares stock used against what sales should have used.
        </div>
      )}

      {visibleRows.length === 0 ? (
        <p className="text-sm text-parchment-300">No bottle-priced ingredients on this menu yet.</p>
      ) : (
        <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-jerry-green-900/40">
              <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                <th className="px-4 py-3">Ingredient</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Theoretical</th>
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const e = edits[r.library_ingredient_id] ?? { start: '', end: '' }
                const startN = e.start === '' ? null : parseFloat(e.start)
                const endN = e.end === '' ? null : parseFloat(e.end)
                const liveUsedMl =
                  startN !== null && endN !== null && Number.isFinite(startN) && Number.isFinite(endN)
                    ? (startN - endN) * r.bottle_size_ml
                    : null
                const liveVarianceMl =
                  liveUsedMl !== null ? liveUsedMl - r.theoretical_used_ml : null
                const liveVariancePct =
                  liveVarianceMl !== null && r.theoretical_used_ml > 0
                    ? (liveVarianceMl / r.theoretical_used_ml) * 100
                    : null
                const liveCostP =
                  liveVarianceMl !== null
                    ? Math.round(liveVarianceMl * (r.bottle_cost_p / r.bottle_size_ml))
                    : null
                const endExceedsStart = startN !== null && endN !== null && endN > startN
                return (
                  <tr key={r.library_ingredient_id} className="border-t border-gold-500/10 align-top">
                    <td className="px-4 py-3 text-parchment-100">
                      {r.library_name}
                      <span className="block text-xs text-parchment-400">({r.bottle_size_ml} ml)</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={e.start}
                        onChange={(ev) => updateEdit(r.library_ingredient_id, { start: ev.target.value })}
                        className={inputClass}
                        placeholder="0"
                        aria-label={`${r.library_name} start count`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={e.end}
                        onChange={(ev) => updateEdit(r.library_ingredient_id, { end: ev.target.value })}
                        className={inputClass}
                        placeholder="0"
                        aria-label={`${r.library_name} end count`}
                      />
                      {endExceedsStart && (
                        <p className="text-xs text-amber-300 mt-1">
                          Stock went up. Add deliveries to the start count, or check your figures.
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-parchment-200">{formatMl(liveUsedMl)}</td>
                    <td className="px-4 py-3 text-parchment-200">{formatMl(r.theoretical_used_ml)}</td>
                    <td className={`px-4 py-3 ${colourForVariance(liveVariancePct)}`}>
                      {formatMl(liveVarianceMl)}
                      {liveVariancePct !== null && (
                        <span className="block text-xs">{formatPct(liveVariancePct)}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${colourForVariance(liveVariancePct)}`}>{formatMoney(liveCostP)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {info && <p role="status" className="text-sm text-emerald-300">{info}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={pending || loading || visibleRows.length === 0} className={PRIMARY_BUTTON}>
          {pending ? 'Saving…' : 'Save counts'}
        </button>
      </div>

      {data.recent_periods.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-parchment-100 mb-3">Recent periods</h3>
          <ul className="space-y-1.5">
            {data.recent_periods.map((p) => (
              <li key={`${p.period_start}-${p.period_end}`}>
                <button
                  type="button"
                  onClick={() => setPeriod({ start: p.period_start, end: p.period_end })}
                  className="text-sm text-gold-300 hover:text-gold-200 underline text-left"
                >
                  {formatDateRange(p.period_start, p.period_end)}
                </button>
                <span className="text-parchment-400 text-sm">
                  {' · '}Total cost variance: £{(p.total_abs_cost_p / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          {period && (
            <button
              type="button"
              onClick={() => setPeriod(null)}
              className="mt-3 text-xs text-parchment-400 hover:text-parchment-200 underline"
            >
              Back to current period
            </button>
          )}
        </div>
      )}
    </div>
  )
}
