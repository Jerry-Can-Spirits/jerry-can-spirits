import Link from 'next/link'
import type { MenuRollup, ProjectedCocktail } from '@/lib/pouriq/cost-impact'

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

interface Props {
  projected: ProjectedCocktail[]
  rollups: MenuRollup[]
  /** Override the default "isn't used in any drinks yet" empty-state copy. */
  emptyMessage?: string
}

export function RipplePreview({ projected, rollups, emptyMessage }: Props) {
  if (projected.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6 text-sm text-parchment-300">
        {emptyMessage ?? "This ingredient isn’t used in any drinks yet. Add it to a cocktail to see the impact."}
      </div>
    )
  }

  const projectedByMenu = new Map<string, ProjectedCocktail[]>()
  for (const p of projected) {
    if (!projectedByMenu.has(p.menu_id)) projectedByMenu.set(p.menu_id, [])
    projectedByMenu.get(p.menu_id)!.push(p)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rollups.map((r) => {
          const gpDelta = r.projected_avg_gp_pct - r.current_avg_gp_pct
          return (
            <div key={r.menu_id} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5">
              <Link href={`/trade/pouriq/${r.menu_id}`} className="text-base font-serif font-bold text-white hover:text-gold-200">
                {r.menu_name}
              </Link>
              <p className="text-xs text-parchment-400 mt-1">Target {r.menu_target_gp_pct}% · {r.cocktail_count} drink{r.cocktail_count === 1 ? '' : 's'}</p>
              <p className="text-sm mt-3 text-parchment-200">
                Avg GP: {formatPct(r.current_avg_gp_pct)}{' → '}
                <strong className={gpDelta < 0 ? 'text-amber-300' : gpDelta > 0 ? 'text-emerald-300' : 'text-parchment-100'}>
                  {formatPct(r.projected_avg_gp_pct)}
                </strong>
              </p>
              {r.newly_below_target > 0 && (
                <p className="text-xs text-red-300 mt-2">
                  {r.newly_below_target} drink{r.newly_below_target === 1 ? '' : 's'} would drop below target after this change.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {Array.from(projectedByMenu.entries()).map(([menuId, cocktails]) => (
        <div key={menuId} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gold-500/10">
            <Link href={`/trade/pouriq/${menuId}`} className="text-base font-serif font-bold text-white hover:text-gold-200">
              {cocktails[0].menu_name}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-jerry-green-900/40">
                <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                  <th className="px-4 py-3">Drink</th>
                  <th className="px-4 py-3">Sale</th>
                  <th className="px-4 py-3">Now: pour / GP</th>
                  <th className="px-4 py-3">After: pour / GP</th>
                </tr>
              </thead>
              <tbody>
                {cocktails.map((c) => (
                  <tr key={c.cocktail_id} className="border-t border-gold-500/10">
                    <td className="px-4 py-3 text-parchment-100">{c.cocktail_name}</td>
                    <td className="px-4 py-3 text-parchment-200">{formatMoney(c.sale_price_p)}</td>
                    <td className={`px-4 py-3 ${c.below_target_now ? 'text-red-300' : 'text-parchment-200'}`}>
                      {formatMoney(c.current_pour_cost_p)} · {formatPct(c.current_gp_pct)}
                    </td>
                    <td className={`px-4 py-3 ${c.below_target_after ? 'text-red-300' : (c.projected_gp_pct < c.current_gp_pct ? 'text-amber-200' : 'text-parchment-100')}`}>
                      {formatMoney(c.projected_pour_cost_p)} · {formatPct(c.projected_gp_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
