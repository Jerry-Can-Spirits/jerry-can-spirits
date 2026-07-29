'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarData, BarIngredient, ShelfId } from '@/lib/bar/types'
import { match } from '@/lib/bar/match-engine'
import Backbar from './Backbar'
import Results from './Results'

const STORAGE_KEY = 'jcs:bar'
const SPOTLIGHT_KEY = 'jcs:bar:spotlight'

export default function BarClient({ data }: { data: BarData }) {
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [extraByShelf, setExtraByShelf] = useState<Record<string, string[]>>({})
  const [picker, setPicker] = useState<{ shelf: ShelfId | 'all'; query: string } | null>(null)
  const [beam, setBeam] = useState(0.5)

  // Load persisted bar on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setOwned(new Set(JSON.parse(raw) as string[]))
      const savedBeam = localStorage.getItem(SPOTLIGHT_KEY)
      if (savedBeam) setBeam(Number(savedBeam) || 0.5)
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  // Persist on change, once the initial load has applied.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned]))
      localStorage.setItem(SPOTLIGHT_KEY, String(beam))
    } catch {
      // ignore write failures (private mode etc.)
    }
  }, [owned, beam, hydrated])

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
      .sort((a, b) => a.name.localeCompare(b.name))
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
          <button type="button" onClick={() => { setOwned(new Set()); setExtraByShelf({}) }} className="text-sm text-parchment-400/70 hover:text-parchment-200">
            Clear my bar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 md:flex-row">
        <div className="md:basis-[56%]">
          <div className="mb-2 flex items-center gap-3">
            <label htmlFor="bar-spotlight" className="text-[11px] uppercase tracking-wider text-parchment-400/70">
              Spotlight
            </label>
            <input
              id="bar-spotlight"
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={beam}
              onChange={(e) => setBeam(Number(e.target.value))}
              className="w-32 accent-gold-500"
            />
          </div>
          <Backbar
            shelves={data.shelves}
            owned={owned}
            onToggle={toggle}
            onAddRequest={(shelf) => setPicker({ shelf, query: '' })}
            extraByShelf={extraByShelf}
            beam={beam}
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
