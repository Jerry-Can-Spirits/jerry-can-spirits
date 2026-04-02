import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { getD1, getExpeditionLogEntries } from '@/lib/d1'
import ExpeditionLogForm from '@/components/ExpeditionLogForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Expedition Log | Jerry Can Spirits®',
  description: 'A public record of the people who bought the first bottles. Names, places, and notes from the field.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
}

const ExpeditionLogMap = nextDynamic(() => import('@/components/ExpeditionLogMap'), { ssr: false })

export default async function ExpeditionLogPage() {
  const db = await getD1()
  const entries = await getExpeditionLogEntries(db)
  const hasCoords = entries.some((e) => e.location_lat !== null)

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              The Expedition Log
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            The Expedition Log
          </h1>
          <p className="text-parchment-300 leading-relaxed max-w-xl mx-auto">
            A record of the people who carried the first bottles. Opt-in — each entry is a choice.
          </p>
        </div>

        {/* Map */}
        {hasCoords && (
          <div className="mb-12">
            <ExpeditionLogMap entries={entries} />
          </div>
        )}

        {/* Entry list */}
        <div className="mb-16">
          {entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{entry.name}</p>
                      {entry.location && (
                        <p className="text-parchment-400 text-sm mt-0.5">{entry.location}</p>
                      )}
                    </div>
                    <p className="text-parchment-500 text-xs flex-shrink-0">
                      {new Date(entry.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {entry.message && (
                    <p className="text-parchment-300 text-sm leading-relaxed italic mt-3 border-t border-gold-500/10 pt-3">
                      {entry.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-parchment-500 text-sm">No entries yet. Be the first.</p>
          )}
        </div>

        {/* Form section */}
        <div className="bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Join the Log</h2>
          <p className="text-parchment-300 text-sm mb-6">
            If you bought a bottle and want to be on the record, add your name.
          </p>
          <ExpeditionLogForm batchId="batch-001" />
        </div>

      </div>
    </main>
  )
}
