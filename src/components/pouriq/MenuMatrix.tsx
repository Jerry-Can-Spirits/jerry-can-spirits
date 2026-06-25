import type { MenuPerformance } from '@/lib/pouriq/menu-performance'

const TONES = {
  winner: { card: 'border-emerald-500/50 bg-emerald-500/5', label: 'text-emerald-200', chip: 'border-emerald-500/40' },
  promote: { card: 'border-sky-500/40', label: 'text-sky-200', chip: 'border-sky-500/40' },
  fix: { card: 'border-amber-400/45 bg-amber-500/5', label: 'text-amber-200', chip: 'border-amber-400/40' },
  review: { card: 'border-red-500/35', label: 'text-red-200', chip: 'border-red-500/40' },
} as const

function Quadrant({ label, tone, drinks }: { label: string; tone: keyof typeof TONES; drinks: Array<{ cocktail_id: string; name: string }> }) {
  const t = TONES[tone]
  return (
    <div className={`rounded-lg border p-3 min-h-[92px] ${t.card}`}>
      <p className={`text-[11px] uppercase tracking-widest ${t.label}`}>{label}</p>
      {drinks.length === 0 ? (
        <p className="text-parchment-500 text-sm mt-2">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {drinks.map((d) => (
            <span key={d.cocktail_id} className={`text-xs rounded-full border px-2 py-0.5 text-parchment-100 ${t.chip}`}>{d.name}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuMatrix({ quadrants }: { quadrants: MenuPerformance['quadrants'] }) {
  const colHead = 'text-[11px] uppercase tracking-widest text-parchment-400 text-center'
  const rowHead = 'text-[11px] uppercase tracking-widest text-parchment-400 flex items-center'
  return (
    <div>
      <div className="grid grid-cols-[5rem_1fr_1fr] gap-2 items-end mb-1.5">
        <div />
        <div className={colHead}>Popular sellers</div>
        <div className={colHead}>Slow sellers</div>
      </div>
      <div className="grid grid-cols-[5rem_1fr_1fr] gap-2 mb-2">
        <div className={rowHead}>Good margin</div>
        <Quadrant label={'Winners · feature & protect'} tone="winner" drinks={quadrants.winner} />
        <Quadrant label="Promote · good margin, under-sold" tone="promote" drinks={quadrants.promote} />
      </div>
      <div className="grid grid-cols-[5rem_1fr_1fr] gap-2">
        <div className={rowHead}>Thin margin</div>
        <Quadrant label="Fix the margin · popular but thin" tone="fix" drinks={quadrants.fixMargin} />
        <Quadrant label="Review or cut" tone="review" drinks={quadrants.review} />
      </div>
      <p className="text-xs text-parchment-400 mt-3">
        A popular seller sells at least 70% of what an average drink on this menu sells. Good margin is at or above your Target GP.
      </p>
    </div>
  )
}
