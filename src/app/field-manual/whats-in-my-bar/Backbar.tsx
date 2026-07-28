'use client'

import type { BarIngredient, ShelfGroup, ShelfId } from '@/lib/bar/types'
import BottleSilhouette from './BottleSilhouette'

interface BackbarProps {
  shelves: ShelfGroup[]
  owned: Set<string>
  onToggle: (id: string) => void
  onAddRequest: (shelf: ShelfId) => void
  // ids the user added to a shelf via search (beyond the common set)
  extraByShelf: Record<string, string[]>
}

function BottleButton({
  ingredient,
  lit,
  onToggle,
}: {
  ingredient: BarIngredient
  lit: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={lit}
      onClick={() => onToggle(ingredient.id)}
      className="flex w-[52px] flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded"
    >
      <span className={`text-[8px] mb-0.5 ${lit ? 'text-gold-300' : 'text-transparent'}`} aria-hidden="true">✓</span>
      <BottleSilhouette vessel={ingredient.vessel} lit={lit} />
      <span className={`mt-1 text-[9px] leading-tight text-center ${lit ? 'text-gold-200 font-semibold' : 'text-parchment-400/60'}`}>
        {ingredient.name}
      </span>
    </button>
  )
}

export default function Backbar({ shelves, owned, onToggle, onAddRequest, extraByShelf }: BackbarProps) {
  return (
    <div className="rounded-xl bg-[#140d08] p-4 sm:p-6">
      {shelves.map((shelf) => {
        const byId = new Map(shelf.ingredients.map((i) => [i.id, i]))
        const extras = (extraByShelf[shelf.id] ?? [])
          .map((id) => byId.get(id))
          .filter((x): x is BarIngredient => Boolean(x))
        const shown = [
          ...shelf.ingredients.filter((i) => i.common),
          ...extras.filter((i) => !i.common),
        ]
        return (
          <section key={shelf.id} className="mb-6 last:mb-0">
            <h2 className="text-[10px] uppercase tracking-[0.14em] text-gold-300/85 mb-2">{shelf.label}</h2>
            <div className="flex flex-wrap items-end gap-3 border-b-2 border-gold-500/30 pb-3">
              {shown.map((i) => (
                <BottleButton key={i.id} ingredient={i} lit={owned.has(i.id)} onToggle={onToggle} />
              ))}
              <button
                type="button"
                onClick={() => onAddRequest(shelf.id)}
                className="flex w-[44px] flex-col items-center text-parchment-400/70 hover:text-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded"
              >
                <span className="flex h-16 w-8 items-center justify-center rounded border border-dotted border-white/25 text-lg">+</span>
                <span className="mt-1 text-[9px]">add</span>
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
