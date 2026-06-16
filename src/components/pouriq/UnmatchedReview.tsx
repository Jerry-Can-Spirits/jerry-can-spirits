'use client'

import { useState, useTransition } from 'react'
import { PRIMARY_BUTTON, DESTRUCTIVE_BUTTON } from '@/lib/pouriq/button-styles'

interface UnmatchedItem {
  normalised_name: string
  raw_name: string
  total_quantity: number
  last_seen: string
  suggestion: { cocktail_id: string; name: string } | null
}

interface Props {
  items: UnmatchedItem[]
  cocktails: Array<{ id: string; name: string }>
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function UnmatchedReview({ items, cocktails }: Props) {
  const [rows, setRows] = useState(items)
  const [selection, setSelection] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.normalised_name, i.suggestion?.cocktail_id ?? ''])),
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function remove(name: string) {
    setRows((rs) => rs.filter((r) => r.normalised_name !== name))
  }

  function confirm(name: string) {
    const cocktailId = selection[name]
    if (!cocktailId) { setError('Pick a cocktail first.'); return }
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/pouriq/integrations/unmatched/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalisedName: name, cocktailId }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { error?: string }
        setError(e.error ?? 'Could not save the mapping.')
        return
      }
      remove(name)
    })
  }

  function ignore(name: string) {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/pouriq/integrations/unmatched/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalisedName: name }),
      })
      if (!res.ok) { setError('Could not update that item.'); return }
      remove(name)
    })
  }

  if (rows.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-12 text-center">
        <p className="text-parchment-200 font-medium mb-1">Nothing to review.</p>
        <p className="text-parchment-400 text-sm">Every till item from your POS is matched to a cocktail.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {rows.map((row) => (
        <div key={row.normalised_name} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 className="text-lg font-serif font-bold text-white">{row.raw_name}</h2>
            <span className="text-xs text-parchment-400">
              {row.total_quantity} {row.total_quantity === 1 ? 'sale' : 'sales'} waiting · last seen {formatDate(row.last_seen)}
            </span>
          </div>
          <label htmlFor={`map-${row.normalised_name}`} className="block text-xs font-medium text-parchment-300 mb-2">
            This is
          </label>
          <select
            id={`map-${row.normalised_name}`}
            value={selection[row.normalised_name] ?? ''}
            onChange={(e) => setSelection((s) => ({ ...s, [row.normalised_name]: e.target.value }))}
            disabled={pending}
            className="w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none mb-4"
          >
            <option value="">— Select a cocktail —</option>
            {cocktails.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => confirm(row.normalised_name)} disabled={pending} className={PRIMARY_BUTTON}>
              {pending ? 'Saving…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => ignore(row.normalised_name)} disabled={pending} className={DESTRUCTIVE_BUTTON}>
              Not a cocktail
            </button>
          </div>
        </div>
      ))}
      <p className="text-xs text-parchment-500">
        Confirming a match also recovers the waiting sales (up to 90 days) and remembers the mapping for next time.
      </p>
    </div>
  )
}
