import Link from 'next/link'
import type { CocktailMetrics, CocktailRow } from '@/lib/pouriq/types'

function formatMoney(p: number) { return `£${(p / 100).toFixed(2)}` }

interface Props {
  menuId: string
  cocktails: CocktailRow[]
  metrics: CocktailMetrics[]
  targetGpPct: number
}

export function CocktailTable({ menuId, cocktails, metrics, targetGpPct }: Props) {
  const byId = new Map(metrics.map((m) => [m.cocktail_id, m]))
  const rows = cocktails.map((c) => ({ cocktail: c, m: byId.get(c.id)! })).filter((r) => r.m)

  const anyPromo = rows.some((r) => r.m.promo)
  const anyVolume = rows.some((r) => r.m.volume)

  // When volumes exist, contribution is the meaningful sort. Falls back
  // to absolute margin order otherwise (current behaviour).
  if (anyVolume) {
    rows.sort((a, b) => (b.m.volume?.contribution_p ?? -1) - (a.m.volume?.contribution_p ?? -1))
  } else {
    rows.sort((a, b) => b.m.margin_p - a.m.margin_p)
  }

  const extraCols = (anyPromo ? 1 : 0) + (anyVolume ? 2 : 0)
  const minWidth = extraCols >= 2 ? 'min-w-[1000px]' : extraCols === 1 ? 'min-w-[860px]' : 'min-w-[640px]'

  return (
    <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-x-auto">
      <table className={`w-full text-sm ${minWidth}`}>
        <thead className="bg-jerry-green-900/40">
          <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
            <th className="px-4 py-3">Drink</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Pour cost</th>
            <th className="px-4 py-3">Margin</th>
            <th className="px-4 py-3">GP %</th>
            {anyPromo && <th className="px-4 py-3">Promo · GP %</th>}
            {anyVolume && <th className="px-4 py-3">Units</th>}
            {anyVolume && <th className="px-4 py-3">Contribution</th>}
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ cocktail, m }) => {
            const belowTarget = m.gp_pct < targetGpPct
            const promo = m.promo
            const volume = m.volume
            const promoBelowTarget = promo ? promo.gp_pct < targetGpPct : false
            return (
              <tr key={cocktail.id} className="border-t border-gold-500/10">
                <td className="px-4 py-3 text-parchment-100">
                  {cocktail.name}
                  {cocktail.field_manual_slug && (
                    <a href={`/field-manual/cocktails/${cocktail.field_manual_slug}`} className="ml-2 text-xs text-gold-300 hover:text-gold-200 underline">
                      Field Manual
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-parchment-200">{formatMoney(m.sale_price_p)}</td>
                <td className="px-4 py-3 text-parchment-200">{formatMoney(m.pour_cost_p)}</td>
                <td className="px-4 py-3 text-parchment-100">{formatMoney(m.margin_p)}</td>
                <td className={`px-4 py-3 ${belowTarget ? 'text-red-300' : 'text-parchment-100'}`}>{m.gp_pct.toFixed(1)}%</td>
                {anyPromo && (
                  <td className="px-4 py-3">
                    {promo ? (
                      <span className={promoBelowTarget ? 'text-red-300' : 'text-amber-200'}>
                        {formatMoney(promo.sale_price_p)} · {promo.gp_pct.toFixed(1)}%
                        {promo.label && <span className="block text-[10px] text-parchment-400 mt-0.5">{promo.label}</span>}
                      </span>
                    ) : (
                      <span className="text-parchment-500">—</span>
                    )}
                  </td>
                )}
                {anyVolume && (
                  <td className="px-4 py-3 text-parchment-200">
                    {volume ? volume.units_sold : <span className="text-parchment-500">—</span>}
                  </td>
                )}
                {anyVolume && (
                  <td className="px-4 py-3 text-parchment-100">
                    {volume ? formatMoney(volume.contribution_p) : <span className="text-parchment-500">—</span>}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <Link href={`/trade/pouriq/${menuId}/edit?cocktail=${cocktail.id}`} className="text-gold-300 hover:text-gold-200 underline text-xs">Edit</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
