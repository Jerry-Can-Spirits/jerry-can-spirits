'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'
import { formatPurchaseBasis } from '@/lib/pouriq/calculations'
import { bulkDeleteLibraryEntriesAction } from '@/lib/pouriq/server-actions'
import { DESTRUCTIVE_BUTTON, SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'

interface Props {
  entries: IngredientLibraryRow[]
  usageCounts: Map<string, number>
}

function formatCost(entry: IngredientLibraryRow): string {
  return formatPurchaseBasis(entry)
}

export function IngredientList({ entries, usageCounts }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (entries.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
        <p className="text-parchment-300 mb-2">No ingredients yet.</p>
        <p className="text-parchment-400 text-sm">
          Add your first ingredient to begin building your library, or import a menu to populate automatically.
        </p>
      </div>
    )
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleBulkDelete() {
    const ids = [...selected]
    if (!window.confirm(`Delete ${ids.length} ingredient${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      try {
        await bulkDeleteLibraryEntriesAction(ids)
        setSelected(new Set())
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-jerry-green-800/60 border border-gold-500/30 rounded-xl">
          <span className="text-parchment-200 text-sm flex-1">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className={SECONDARY_BUTTON_SM}
            disabled={isPending}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            className={DESTRUCTIVE_BUTTON}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : `Delete ${selected.size} selected`}
          </button>
        </div>
      )}
      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => {
          const count = usageCounts.get(entry.id) ?? 0
          const isUnused = count === 0
          const isChecked = selected.has(entry.id)

          return (
            <div key={entry.id} className="relative">
              <Link
                href={`/trade/pouriq/library/${entry.id}/edit`}
                className="block bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-5 border border-gold-500/20 hover:border-gold-400/40 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-base font-serif font-bold text-white truncate">{entry.name}</h3>
                  <span className="text-xs uppercase tracking-widest text-parchment-400 shrink-0">{entry.ingredient_type}</span>
                </div>
                <p className="text-parchment-200 text-sm">{formatCost(entry)}</p>
                <p className="text-parchment-500 text-xs mt-2">
                  {count === 0 ? 'Not used yet' : `Used in ${count} drink${count === 1 ? '' : 's'}`}
                </p>
              </Link>
              {isUnused && (
                <button
                  type="button"
                  aria-label={isChecked ? `Deselect ${entry.name}` : `Select ${entry.name}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleSelected(entry.id)
                  }}
                  className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded border border-gold-400/60 bg-jerry-green-900/80 hover:border-gold-300 transition-colors"
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-gold-400" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
