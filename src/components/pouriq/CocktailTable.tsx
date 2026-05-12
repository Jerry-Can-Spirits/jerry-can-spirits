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
  rows.sort((a, b) => b.m.margin_p - a.m.margin_p)

  return (
    <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-jerry-green-900/40">
          <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
            <th className="px-4 py-3">Drink</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Pour cost</th>
            <th className="px-4 py-3">Margin</th>
            <th className="px-4 py-3">GP %</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ cocktail, m }) => {
            const belowTarget = m.gp_pct < targetGpPct
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
