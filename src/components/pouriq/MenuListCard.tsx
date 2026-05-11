import Link from 'next/link'
import type { MenuRow } from '@/lib/pouriq/types'

export function MenuListCard({ menu }: { menu: MenuRow }) {
  const updated = new Date(menu.updated_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <Link
      href={`/trade/pouriq/${menu.id}`}
      className="block bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 hover:border-gold-400/40 transition-colors"
    >
      <h3 className="text-lg font-serif font-bold text-white mb-1">{menu.name}</h3>
      <p className="text-parchment-400 text-xs uppercase tracking-widest mb-3">
        {menu.venue_type ?? 'Menu'}{menu.city && ` · ${menu.city}`}
      </p>
      <p className="text-parchment-300 text-sm">
        Target GP {menu.target_gp_pct}% · Updated {updated}
      </p>
    </Link>
  )
}
