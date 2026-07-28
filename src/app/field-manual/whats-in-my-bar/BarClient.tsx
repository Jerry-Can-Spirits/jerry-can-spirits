'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarData, BarIngredient, ShelfId } from '@/lib/bar/types'
import { match } from '@/lib/bar/match-engine'
import Backbar from './Backbar'
import Results from './Results'

const STORAGE_KEY = 'jcs:bar'

export default function BarClient({ data }: { data: BarData }) {
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [extraByShelf, setExtraByShelf] = useState<Record<string, string[]>>({})
  const [picker, setPicker] = useState<{ shelf: ShelfId | 'all'; query: string } | null>(null)

  // Load persisted bar on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setOwned(new Set(JSON.parse(raw) as string[]))
    } catch {
      // ignore malformed storage
    }
  }, [])

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned]))
    } catch {
      // ignore write failures (private mode etc.)
    }
  }, [owned])

  const allIngredients = useMemo<BarIngredient[]>(
    () => data.shelves.flatMap((s) => s.ingredients),
    [data.shelves],
  )
  const nameById = useMemo(() => new Map(allIngredients.map((i) => [i.id, i.name])), [allIngredients])

  const result = useMemo(() => match(owned, data.index), [owned, data.index])

  function toggle(id: string) {
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // When a bottle is added from the picker, own it and pin it to its shelf.
  function addIngredient(i: BarIngredient) {
    setExtraByShelf((prev) => {
      const list = prev[i.shelf] ?? []
      return list.includes(i.id) ? prev : { ...prev, [i.shelf]: [...list, i.id] }
    })
    setOwned((prev) => new Set(prev).add(i.id))
    setPicker(null)
  }

  const pickerMatches = useMemo<BarIngredient[]>(() => {
    if (!picker) return []
    const q = picker.query.trim().toLowerCase()
    return allIngredients
      .filter((i) => (picker.shelf === 'all' ? true : i.shelf === picker.shelf))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .slice(0, 40)
  }, [picker, allIngredients])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPicker({ shelf: 'all', query: '' })}
          className="text-sm text-gold-300 hover:text-gold-200 underline decoration-dotted"
        >
          Search all ingredients
        </button>
        {owned.size > 0 && (
          <button type="button" onClick={() => setOwned(new Set())} className="text-sm text-parchment-400/70 hover:text-parchment-200">
            Clear my bar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 md:flex-row">
        <div className="md:basis-[56%]">
          <Backbar
            shelves={data.shelves}
            owned={owned}
            onToggle={toggle}
            onAddRequest={(shelf) => setPicker({ shelf, query: '' })}
            extraByShelf={extraByShelf}
          />
        </div>
        <div className="md:flex-1">
          <Results result={result} nameById={nameById} />
        </div>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24" onClick={() => setPicker(null)}>
          <div className="w-full max-w-md rounded-xl border border-gold-500/30 bg-jerry-green-900 p-4" onClick={(e) => e.stopPropagation()}>
            <label htmlFor="bar-add-search" className="sr-only">Search ingredients</label>
            <input
              id="bar-add-search"
              autoFocus
              value={picker.query}
              onChange={(e) => setPicker({ ...picker, query: e.target.value })}
              placeholder={picker.shelf === 'all' ? 'Search any ingredient…' : 'Search this shelf…'}
              className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-parchment-100"
            />
            <ul className="mt-3 max-h-72 overflow-y-auto">
              {pickerMatches.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => addIngredient(i)}
                    className="flex w-full items-center justify-between px-2 py-2 text-left text-sm text-parchment-200 hover:bg-white/5 rounded"
                  >
                    <span>{i.name}</span>
                    <span className="text-[10px] text-parchment-400/60">{owned.has(i.id) ? 'in bar' : 'add'}</span>
                  </button>
                </li>
              ))}
              {pickerMatches.length === 0 && <li className="px-2 py-3 text-sm text-parchment-400/60">No matches.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
