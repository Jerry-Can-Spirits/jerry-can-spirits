'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BarData, BarIngredient, ShelfId } from '@/lib/bar/types'
import { match } from '@/lib/bar/match-engine'
import Backbar from './Backbar'
import Results from './Results'
import ShareButton from '@/components/ShareButton'

const STORAGE_KEY = 'jcs:bar'
const SPOTLIGHT_KEY = 'jcs:bar:spotlight'

// ?bar=slug,slug opens someone else's shared bar without touching the visitor's
// saved one until they change it. ?add=slug adds bottles to the visitor's own
// bar (the product page links here with the rum ticked). Both are cleared from
// the address bar once applied, so a refresh does not re-apply them.
const SHARE_PARAM = 'bar'
const ADD_PARAM = 'add'

export default function BarClient({ data }: { data: BarData }) {
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [extraByShelf, setExtraByShelf] = useState<Record<string, string[]>>({})
  const [picker, setPicker] = useState<{ shelf: ShelfId | 'all'; query: string } | null>(null)
  const [beam, setBeam] = useState(0.5)
  const [viewingShared, setViewingShared] = useState(false)
  const [hasSavedBar, setHasSavedBar] = useState(false)
  // The URL is read and then cleared, so the load must run exactly once even
  // where React runs effects twice (development Strict Mode).
  const loaded = useRef(false)

  const allIngredients = useMemo<BarIngredient[]>(
    () => data.shelves.flatMap((s) => s.ingredients),
    [data.shelves],
  )
  const nameById = useMemo(() => new Map(allIngredients.map((i) => [i.id, i.name])), [allIngredients])
  const byId = useMemo(() => new Map(allIngredients.map((i) => [i.id, i])), [allIngredients])
  const idBySlug = useMemo(() => new Map(allIngredients.map((i) => [i.slug, i.id])), [allIngredients])

  // Owned bottles that are not on a shelf by default still need to stand on one.
  function pinExtras(ids: Iterable<string>) {
    setExtraByShelf((prev) => {
      const next = { ...prev }
      for (const id of ids) {
        const i = byId.get(id)
        if (!i || i.common) continue
        const list = next[i.shelf] ?? []
        if (!list.includes(id)) next[i.shelf] = [...list, id]
      }
      return next
    })
  }

  // Load the saved bar on mount, then apply a shared or added bar from the URL.
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    let saved: string[] = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) saved = JSON.parse(raw) as string[]
      const savedBeam = localStorage.getItem(SPOTLIGHT_KEY)
      if (savedBeam) setBeam(Number(savedBeam) || 0.5)
    } catch {
      // ignore malformed storage
    }
    setHasSavedBar(saved.length > 0)

    const params = new URLSearchParams(window.location.search)
    const fromSlugs = (key: string) =>
      (params.get(key) ?? '').split(',').map((s) => idBySlug.get(s.trim())).filter((id): id is string => !!id)
    const shared = fromSlugs(SHARE_PARAM)
    const added = fromSlugs(ADD_PARAM)

    let initial = saved
    if (shared.length > 0) {
      initial = shared
      setViewingShared(true)
    } else if (added.length > 0) {
      initial = [...new Set([...saved, ...added])]
    }
    setOwned(new Set(initial))
    pinExtras(initial)
    if (params.has(SHARE_PARAM) || params.has(ADD_PARAM)) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on change, once the initial load has applied. A shared bar is only
  // a view until the visitor changes it.
  useEffect(() => {
    if (!hydrated || viewingShared) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned]))
      localStorage.setItem(SPOTLIGHT_KEY, String(beam))
    } catch {
      // ignore write failures (private mode etc.)
    }
  }, [owned, beam, hydrated, viewingShared])

  const result = useMemo(
    () => match(owned, data.index, data.implies),
    [owned, data.index, data.implies],
  )

  function toggle(id: string) {
    setViewingShared(false)
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // When a bottle is added from the picker, own it and pin it to its shelf.
  function addIngredient(i: BarIngredient) {
    setViewingShared(false)
    setExtraByShelf((prev) => {
      const list = prev[i.shelf] ?? []
      return list.includes(i.id) ? prev : { ...prev, [i.shelf]: [...list, i.id] }
    })
    setOwned((prev) => new Set(prev).add(i.id))
    setPicker(null)
  }

  function backToMyBar() {
    let saved: string[] = []
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
    } catch {
      // ignore malformed storage
    }
    setExtraByShelf({})
    setOwned(new Set(saved))
    pinExtras(saved)
    setViewingShared(false)
  }

  const shareUrl = useMemo(() => {
    const slugs = [...owned].map((id) => byId.get(id)?.slug).filter(Boolean).sort()
    return `https://jerrycanspirits.co.uk/field-manual/whats-in-my-bar/?${SHARE_PARAM}=${slugs.join(',')}`
  }, [owned, byId])

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
          <button type="button" onClick={() => { setViewingShared(false); setOwned(new Set()); setExtraByShelf({}) }} className="text-sm text-parchment-400/70 hover:text-parchment-200">
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
          {viewingShared && (
            <p className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-500/30 px-3 py-2 text-sm text-parchment-200">
              You are looking at a shared bar.
              {hasSavedBar && (
                <button type="button" onClick={backToMyBar} className="text-gold-300 hover:text-gold-200 underline decoration-dotted">
                  Back to my bar
                </button>
              )}
            </p>
          )}
          {owned.size > 0 && (
            <div className="mb-3 flex justify-end">
              <ShareButton
                title="What's in my bar"
                text={`I can make ${result.makeable.length} ${result.makeable.length === 1 ? 'cocktail' : 'cocktails'} from my bar. What can you make?`}
                url={shareUrl}
                buttonText="Share my bar"
                variant="ghost"
              />
            </div>
          )}
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
