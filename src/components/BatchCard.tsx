import Link from 'next/link'
import type { Batch, BatchStats } from '@/lib/d1'

interface BatchCardProps {
  batch: Batch
  stats: BatchStats | null
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ageing: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    bottled: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    released: 'bg-gold-500/20 text-gold-300 border-gold-500/30',
    sold_out: 'bg-red-500/20 text-red-300 border-red-500/30',
  }
  const labels: Record<string, string> = {
    ageing: 'Ageing',
    bottled: 'Bottled',
    released: 'Released',
    sold_out: 'Sold Out',
  }
  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${styles[status] || styles.ageing}`}>
      {labels[status] || status}
    </span>
  )
}

export default function BatchCard({ batch, stats }: BatchCardProps) {
  const batchNumber = batch.id.replace('batch-', '')

  return (
    <Link
      href={`/batch/${batchNumber}/`}
      className="group block bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6 hover:border-gold-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/5"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
          {batch.name}
        </h3>
        {statusBadge(batch.status)}
      </div>

      {batch.tasting_notes && (
        <p className="text-parchment-400 text-sm mb-4 line-clamp-2">
          {batch.tasting_notes}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gold-500/10">
        <div>
          <p className="text-gold-400 text-2xl font-bold">{stats?.total_bottles ?? batch.bottle_count ?? '—'}</p>
          <p className="text-parchment-500 text-xs uppercase tracking-wider">Bottles</p>
        </div>
        <div>
          <p className="text-gold-400 text-2xl font-bold">{batch.abv ? `${batch.abv}%` : '—'}</p>
          <p className="text-parchment-500 text-xs uppercase tracking-wider">ABV</p>
        </div>
        <div>
          <p className="text-gold-400 text-2xl font-bold">{stats ? (stats.days_aged > 0 ? stats.days_aged : 'Unaged') : '—'}</p>
          <p className="text-parchment-500 text-xs uppercase tracking-wider">{stats?.days_aged ? 'Days Aged' : 'Ageing'}</p>
        </div>
      </div>
    </Link>
  )
}
