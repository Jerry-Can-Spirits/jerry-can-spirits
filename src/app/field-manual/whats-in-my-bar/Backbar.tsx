'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { BarIngredient, ShelfGroup, ShelfId } from '@/lib/bar/types'
import BottleSilhouette from './BottleSilhouette'

interface BackbarProps {
  shelves: ShelfGroup[]
  owned: Set<string>
  onToggle: (id: string) => void
  onAddRequest: (shelf: ShelfId) => void
  // ids the user added to a shelf via search (beyond the common set)
  extraByShelf: Record<string, string[]>
  // spotlight intensity, 0.2–1
  beam: number
}

const SLOT = 54
const GAP = 8
const PADDING = 36 // 18px each side

// Bar-cabinet surfaces Tailwind cannot express (layered wood grain, spotlight
// cones, recessed-light glows). Layout and colour tokens stay in Tailwind.
const cabinet: CSSProperties = {
  background:
    'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 2px, transparent 2px 6px),' +
    'repeating-linear-gradient(87deg, rgba(0,0,0,0.2) 0 3px, transparent 3px 24px),' +
    'linear-gradient(180deg, #4a3220, #33210f 55%, #231609)',
  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55), 0 24px 50px rgba(0,0,0,0.5)',
}
const valance: CSSProperties = {
  background: 'linear-gradient(180deg, #7c5230, #4a2e18 60%, #35200f)',
  boxShadow: 'inset 0 2px 0 rgba(255,224,168,0.3), 0 8px 14px rgba(0,0,0,0.5)',
}
const lipTop: CSSProperties = {
  background: 'linear-gradient(180deg, #9a6636, #6f4526)',
  boxShadow: 'inset 0 2px 0 rgba(255,232,184,0.6)',
}
const lipFace: CSSProperties = {
  background: 'linear-gradient(180deg, #43290f, #2c1b0d)',
  boxShadow: '0 11px 16px rgba(0,0,0,0.5), inset 0 4px 5px rgba(0,0,0,0.35)',
}
const contactShadow: CSSProperties = {
  background: 'radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 72%)',
}
const nameShadow: CSSProperties = { textShadow: '0 1px 0 rgba(0,0,0,0.7)' }

function downlight(lit: boolean, beam: number): CSSProperties {
  return lit
    ? {
        background: 'radial-gradient(circle at 50% 35%, #fff3d0, #ffcf7a 58%, #a9741f)',
        boxShadow: `0 0 12px 4px rgba(255,205,120,${0.7 * beam})`,
      }
    : {
        background: 'radial-gradient(circle at 50% 35%, #2b2019, #0d0a07)',
        boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.7)',
      }
}
function beamCone(beam: number): CSSProperties {
  return {
    clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)',
    background: `linear-gradient(180deg, rgba(255,214,140,${0.55 * beam}), rgba(255,214,140,0) 74%)`,
    filter: 'blur(1px)',
  }
}

type Cell = { kind: 'bottle'; ing: BarIngredient } | { kind: 'add' }

function chunk(cells: Cell[], size: number): Cell[][] {
  const rows: Cell[][] = []
  for (let i = 0; i < cells.length; i += size) rows.push(cells.slice(i, i + size))
  return rows
}

export default function Backbar({ shelves, owned, onToggle, onAddRequest, extraByShelf, beam }: BackbarProps) {
  const cabinetRef = useRef<HTMLDivElement>(null)
  const [perRow, setPerRow] = useState(8)

  useEffect(() => {
    const el = cabinetRef.current
    if (!el) return
    const compute = () => {
      const avail = el.clientWidth - PADDING
      setPerRow(Math.max(3, Math.floor((avail + GAP) / (SLOT + GAP))))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={cabinetRef} className="overflow-hidden rounded-xl border border-[#1c130a] px-[18px] pb-1" style={cabinet}>
      <div className="-mx-[18px] h-[15px]" style={valance} />
      {shelves.map((shelf) => {
        const byId = new Map(shelf.ingredients.map((i) => [i.id, i]))
        const extras = (extraByShelf[shelf.id] ?? [])
          .map((id) => byId.get(id))
          .filter((x): x is BarIngredient => Boolean(x))
          .filter((i) => !i.common)
        const shown: BarIngredient[] = [...shelf.ingredients.filter((i) => i.common), ...extras]
        const cells: Cell[] = [...shown.map((ing) => ({ kind: 'bottle' as const, ing })), { kind: 'add' as const }]
        const rows = chunk(cells, perRow)

        return (
          <section key={shelf.id}>
            {rows.map((row, ri) => (
              <div key={`${shelf.id}-${ri}`} className="relative">
                {ri === 0 && (
                  <span className="absolute left-1 top-1 z-[5] text-[9px] uppercase tracking-[0.14em] text-gold-300/70">
                    {shelf.label}
                  </span>
                )}

                {/* Downlights recessed into the underside of the shelf above. */}
                <div className="relative z-[2] flex justify-center gap-2 bg-gradient-to-b from-black/40 to-transparent pt-[7px] pb-0.5">
                  {row.map((cell) => (
                    <span key={cell.kind === 'bottle' ? cell.ing.id : 'add'} className="flex w-[54px] justify-center">
                      {cell.kind === 'bottle' && (
                        <span className="h-[6px] w-[13px] rounded-full transition" style={downlight(owned.has(cell.ing.id), beam)} />
                      )}
                    </span>
                  ))}
                </div>

                {/* Bottles, standing on the plank below. */}
                <div className="relative z-[1] flex items-end justify-center gap-2">
                  {row.map((cell) =>
                    cell.kind === 'bottle' ? (
                      <button
                        key={cell.ing.id}
                        type="button"
                        aria-pressed={owned.has(cell.ing.id)}
                        aria-label={cell.ing.name}
                        onClick={() => onToggle(cell.ing.id)}
                        className="relative flex h-20 w-[54px] items-end justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                      >
                        {owned.has(cell.ing.id) && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-[7px] left-1/2 z-0 h-[88px] w-[58px] -translate-x-1/2"
                            style={beamCone(beam)}
                          />
                        )}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-px left-1/2 z-0 h-[7px] w-8 -translate-x-1/2 rounded-full"
                          style={contactShadow}
                        />
                        <BottleSilhouette vessel={cell.ing.vessel} lit={owned.has(cell.ing.id)} />
                      </button>
                    ) : (
                      <button
                        key="add"
                        type="button"
                        onClick={() => onAddRequest(shelf.id)}
                        aria-label={`Add to ${shelf.label}`}
                        className="flex h-20 w-[54px] items-center justify-center rounded text-parchment-400/70 hover:text-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                      >
                        <span className="flex h-14 w-8 items-center justify-center rounded border border-dotted border-white/25 text-lg">
                          +
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {/* The shelf: a lit top edge the bottles stand on, and a front
                    face carrying the names. */}
                <div className="relative z-[3] -mx-[18px]">
                  <div className="h-[6px]" style={lipTop} />
                  <div className="flex justify-center gap-2 px-[18px] pt-[3px] pb-[7px]" style={lipFace}>
                    {row.map((cell) => (
                      <span
                        key={cell.kind === 'bottle' ? cell.ing.id : 'add'}
                        className={`flex h-[22px] w-[54px] items-center justify-center overflow-hidden text-center text-[10px] leading-[1.1] ${
                          cell.kind === 'bottle' && owned.has(cell.ing.id)
                            ? 'font-semibold text-gold-200'
                            : 'text-parchment-300/40'
                        }`}
                        style={nameShadow}
                      >
                        {cell.kind === 'bottle' ? cell.ing.name : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
