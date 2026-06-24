import Link from 'next/link'
import type { MenuBalanceResult, MenuBalanceGroupKey } from '@/lib/pouriq/menu-balance'
import { MENU_BALANCE_LABELS, MENU_BALANCE_ORDER } from '@/lib/pouriq/menu-balance'

interface Props {
  result: MenuBalanceResult
  targetGpPct: number | null
  incompleteCount: number
  hasSalesData: boolean
}

const GROUP_COLOUR: Record<MenuBalanceGroupKey, string> = {
  strong: 'text-emerald-300',
  'popular-low-margin': 'text-amber-300',
  'high-margin-low-sales': 'text-sky-300',
  underperformers: 'text-red-400',
}

export function MenuBalance({ result, targetGpPct, incompleteCount, hasSalesData }: Props) {
  if (result.includedCount === 0) {
    return (
      <p className="text-sm text-parchment-400">
        Add costs and prices to your drinks to see your menu balance.
      </p>
    )
  }

  if (!hasSalesData) {
    return (
      <p className="text-sm text-parchment-400">
        Add sales data (
        <Link
          href="/trade/pouriq/settings/integrations"
          className="text-gold-300 hover:text-gold-200 underline underline-offset-2"
        >
          sync your POS or enter volumes
        </Link>
        ) to see your menu balance.
      </p>
    )
  }

  const usedAvg = !targetGpPct || targetGpPct <= 0
  const thresholdLabel = usedAvg
    ? `your average GP of ${result.marginThreshold}%`
    : `your target GP of ${result.marginThreshold}%`

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {MENU_BALANCE_ORDER.map((key) => {
          const drinks = result.groups[key]
          if (drinks.length === 0) return null
          const { title, action } = MENU_BALANCE_LABELS[key]
          return (
            <div
              key={key}
              className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5"
            >
              <p className={`text-xs uppercase tracking-widest mb-0.5 font-semibold ${GROUP_COLOUR[key]}`}>
                {title}
              </p>
              <p className="text-parchment-500 text-xs mb-3">{action}</p>
              <ul className="space-y-1.5">
                {drinks.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-parchment-200 truncate">{d.name}</span>
                    <span className="text-xs text-parchment-400 whitespace-nowrap shrink-0">
                      {d.gp_pct.toFixed(1)}% GP, {d.units} sold
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-parchment-500">
        Measured against {thresholdLabel} and {Math.ceil(result.popularityThreshold)}+ sales.
        {incompleteCount > 0 && (
          <> {incompleteCount} drink{incompleteCount === 1 ? '' : 's'} not shown (missing cost or price).</>
        )}
      </p>
    </div>
  )
}
