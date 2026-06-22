import Link from 'next/link'
import type { MenuRow } from '@/lib/pouriq/types'
import { MakeActiveButton } from './MakeActiveButton'

const ACTIVE_BADGE =
  'inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[10px] uppercase tracking-widest'

export function MenuListCard({ menu }: { menu: MenuRow }) {
  const updated = new Date(menu.updated_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 hover:border-gold-400/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <Link href={`/trade/pouriq/${menu.id}`} className="text-lg font-serif font-bold text-white hover:text-gold-300 transition-colors">
          {menu.name}
        </Link>
        {menu.is_active === 1
          ? <span className={ACTIVE_BADGE}>Active</span>
          : <MakeActiveButton menuId={menu.id} />}
      </div>
      <Link href={`/trade/pouriq/${menu.id}`} className="block">
        <p className="text-parchment-400 text-xs uppercase tracking-widest mb-3">
          {menu.venue_type ?? 'Menu'}{menu.city && ` · ${menu.city}`}
        </p>
        <p className="text-parchment-300 text-sm">
          Target GP {menu.target_gp_pct}% · Updated {updated}
        </p>
      </Link>
    </div>
  )
}
