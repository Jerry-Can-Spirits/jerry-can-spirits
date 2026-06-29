'use client'
import { useId, useMemo, useRef, useState, useEffect } from 'react'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

const inputClass =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden'

interface Props {
  libraryEntries: Array<Pick<IngredientLibraryRow, 'id' | 'name' | 'ingredient_type'>>
  onPick: (entry: { id: string; name: string; ingredient_type: IngredientType }) => void
  onRequestCreate: (query: string) => void
  inferredType?: IngredientType
  catalogueSuggestion?: { id: string; name: string } | null
  onAdoptCatalogue?: () => void
  placeholder?: string
  initialQuery?: string
}

export function LibrarySearchSelect({
  libraryEntries,
  onPick,
  onRequestCreate,
  inferredType,
  catalogueSuggestion,
  onAdoptCatalogue,
  placeholder = 'Search your library...',
  initialQuery = '',
}: Props) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)

  // Re-sync the displayed query when the parent changes the selected entry
  // (e.g. a second pick within the same mount), so the selected name shows.
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const matches = useMemo(() => {
    const q = query.toLowerCase()
    const filtered = q
      ? libraryEntries.filter((e) => e.name.toLowerCase().includes(q))
      : libraryEntries.slice(0, 20)
    if (!inferredType) return filtered.slice(0, 20)
    const typed = filtered.filter((e) => e.ingredient_type === inferredType)
    const others = filtered.filter((e) => e.ingredient_type !== inferredType)
    return [...typed, ...others].slice(0, 20)
  }, [libraryEntries, query, inferredType])

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        role="textbox"
        aria-label="Search library"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        placeholder={placeholder}
        className={inputClass}
      />

      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {catalogueSuggestion && onAdoptCatalogue && (
            <button
              type="button"
              onClick={onAdoptCatalogue}
              className="block w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-slate-50 border-b border-slate-200"
            >
              Adopt: {catalogueSuggestion.name} — set your price
            </button>
          )}
          {matches.map((entry) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => {
                onPick({ id: entry.id, name: entry.name, ingredient_type: entry.ingredient_type as IngredientType })
                setQuery('')
                setOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              <span className="font-medium">{entry.name}</span>
              <span className="text-xs text-slate-500 ml-2">{entry.ingredient_type}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { onRequestCreate(query); setOpen(false) }}
            className="block w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-slate-50 border-t border-slate-200"
          >
            + Create new ingredient{query.trim() ? `: "${query.trim()}"` : ''}
          </button>
        </div>
      )}
    </div>
  )
}
