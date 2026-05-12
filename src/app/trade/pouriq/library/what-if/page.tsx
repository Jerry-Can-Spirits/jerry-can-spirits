'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CostImpactPanel } from '@/components/pouriq/CostImpactPanel'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

export default function WhatIfPage() {
  return (
    <Suspense fallback={null}>
      <WhatIfContent />
    </Suspense>
  )
}

function WhatIfContent() {
  const searchParams = useSearchParams()
  const initialIngredient = searchParams.get('ingredient')
  const [entries, setEntries] = useState<IngredientLibraryRow[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(initialIngredient)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/pouriq/library')
      .then((r) => (r.ok ? (r.json() as Promise<{ entries: IngredientLibraryRow[] }>) : Promise.reject(new Error('Could not load library'))))
      .then((d) => {
        if (cancelled) return
        setEntries(d.entries)
        if (!selectedId && d.entries.length > 0) setSelectedId(d.entries[0].id)
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
    // intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-3 mb-2">Cost change what-if</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Pick an ingredient, change its cost, and see how every drink that uses it would shift. Nothing is saved.
        </p>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-6">
          <label htmlFor="ingredient" className="block text-sm font-medium text-parchment-200 mb-2">Ingredient</label>
          {entries === null ? (
            <p className="text-sm text-parchment-300">Loading your library…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-parchment-300">
              Your library is empty. <Link href="/trade/pouriq/library/new" className="text-gold-300 hover:text-gold-200 underline">Add an ingredient</Link> first.
            </p>
          ) : (
            <select
              id="ingredient"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value || null)}
              className="w-full max-w-md px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none"
            >
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </select>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-300 mb-4">{error}</p>}

        {selectedId && <CostImpactPanel key={selectedId} ingredientId={selectedId} />}
      </div>
    </main>
  )
}
