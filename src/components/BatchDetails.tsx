import type { Batch, BatchStats } from '@/lib/d1'

function TastingNotesDisplay({ notes }: { notes: string }) {
  const sections = notes.match(/(Nose|Palate|Finish):\s*([^]*?)(?=(?:Nose|Palate|Finish):|$)/g)

  if (!sections || sections.length === 0) {
    return <p className="text-parchment-300 leading-relaxed">{notes}</p>
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const match = section.match(/^(Nose|Palate|Finish):\s*(.+)/)
        if (!match) return null
        return (
          <div key={match[1]}>
            <h3 className="text-gold-300 font-semibold mb-1">{match[1]}</h3>
            <p className="text-parchment-300 leading-relaxed">{match[2].trim()}</p>
          </div>
        )
      })}
    </div>
  )
}

interface BatchDetailsProps {
  batch: Batch
  stats: BatchStats | null
}

export default function BatchDetails({ batch, stats }: BatchDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Production Details */}
      <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-serif font-bold text-white mb-6">Production Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {batch.cask_type && (
            <div>
              <dt className="text-parchment-500 text-sm uppercase tracking-wider">Cask Type</dt>
              <dd className="text-white font-medium mt-1">{batch.cask_type}</dd>
            </div>
          )}
          {batch.distillation_date && (
            <div>
              <dt className="text-parchment-500 text-sm uppercase tracking-wider">Distillation Date</dt>
              <dd className="text-white font-medium mt-1">
                {new Date(batch.distillation_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </dd>
            </div>
          )}
          {batch.bottling_date && (
            <div>
              <dt className="text-parchment-500 text-sm uppercase tracking-wider">Bottling Date</dt>
              <dd className="text-white font-medium mt-1">
                {new Date(batch.bottling_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </dd>
            </div>
          )}
          {batch.abv && (
            <div>
              <dt className="text-parchment-500 text-sm uppercase tracking-wider">ABV</dt>
              <dd className="text-white font-medium mt-1">{batch.abv}%</dd>
            </div>
          )}
          {stats && (
            <>
              <div>
                <dt className="text-parchment-500 text-sm uppercase tracking-wider">Total Bottles</dt>
                <dd className="text-white font-medium mt-1">{stats.total_bottles}</dd>
              </div>
              <div>
                <dt className="text-parchment-500 text-sm uppercase tracking-wider">Ageing</dt>
                <dd className="text-white font-medium mt-1">{stats.days_aged > 0 ? `${stats.days_aged} days` : 'Unaged'}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Tasting Notes */}
      {batch.tasting_notes && (
        <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">Tasting Notes</h2>
          <TastingNotesDisplay notes={batch.tasting_notes} />
        </div>
      )}

      {/* Founder's Notes */}
      {batch.founder_notes && (
        <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">Founder&apos;s Notes</h2>
          <blockquote className="border-l-4 border-gold-500/40 pl-4">
            <p className="text-parchment-300 leading-relaxed italic">{batch.founder_notes}</p>
          </blockquote>
        </div>
      )}
    </div>
  )
}
