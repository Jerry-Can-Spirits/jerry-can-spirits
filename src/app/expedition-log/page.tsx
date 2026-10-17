import type { Metadata } from 'next'
import { getD1, getExpeditionLogEntries } from '@/lib/d1'
import ExpeditionLogForm from '@/components/ExpeditionLogForm'
import ExpeditionLogMapClient from '@/components/ExpeditionLogMapClient'
import SectionHeading from '@/components/SectionHeading'
import { baseOpenGraph } from '@/lib/og'
import { CURRENT_BATCH_ID } from '@/lib/d1'
import { bottleMapHeadline, type BottleMapSummary } from '@/lib/bottle-map'
import { getBottleMap } from '@/lib/bottle-map-d1'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Expedition Log',
  description: 'A public record of the people who bought the first bottles. Names, places, and bottle numbers.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'The Expedition Log | Jerry Can Spirits®',
    description: 'A public record of the people who bought the first bottles. Names, places, and bottle numbers.',
    url: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
}

export default async function ExpeditionLogPage() {
  const db = await getD1()
  let entries: Awaited<ReturnType<typeof getExpeditionLogEntries>> = []
  try {
    entries = await getExpeditionLogEntries(db)
  } catch (err) {
    console.error('[expedition-log] D1 query failed:', err)
  }
  // Where every bottle went. Every number is Shopify's, through bottle_map;
  // before the backfill the summary is empty and the headline stays hidden.
  let bottleMap: BottleMapSummary = { bottles: 0, districts: 0, countries: 0, points: [] }
  try {
    bottleMap = await getBottleMap(db)
  } catch (err) {
    console.error('[expedition-log] bottle map query failed:', err)
  }
  const headline = bottleMapHeadline(CURRENT_BATCH_ID.replace('batch-', 'Batch '), bottleMap)
  return (
    <main>
      {/* Header */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="The Expedition Log"
            intro="A record of the people who carried the first bottles. Opt-in. Each entry is a choice."
          >
            The Expedition Log
          </SectionHeading>

          {/* Map. The className is the map's height: the client component puts
              it on the container and fills it with h-full, so without one the
              map rendered at zero pixels — present on this page since launch,
              visible never. Taller than the old homepage instance had it; on
              the log's own page the map is the exhibit, not a teaser. */}
          {headline && (
            <p className="text-gold-300 text-base sm:text-lg text-center mb-6">{headline}</p>
          )}
          <ExpeditionLogMapClient entries={entries} points={bottleMap.points} className="w-full h-96 sm:h-[32rem] rounded-xl" />
          {bottleMap.points.length > 0 && (
            <>
              <p className="text-parchment-400 text-sm mt-4">
                Each dot is a postcode district, or a town abroad, where Batch 001 bottles have been delivered. No names, no streets.
              </p>
              {/* Required by the data licences: OS Code-Point Open (OGL v3) for
                  the UK districts, GeoNames (CC BY 4.0) for Northern Ireland
                  and for towns and countries abroad. */}
              <p className="text-parchment-500 text-xs mt-2">
                Contains OS data © Crown copyright and database right 2026. Contains Royal Mail data © Royal Mail copyright and database right 2026. Contains National Statistics data © Crown copyright and database right 2026. Town and country positions from{' '}
                <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-parchment-300">GeoNames</a>, CC BY 4.0.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Entry list */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <p className="text-parchment-500 text-xs shrink-0">
                      {new Date(entry.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {entry.bottle_type && (
                    <p className="text-parchment-500 text-xs mt-1">
                      {entry.bottle_type === 'standard' ? entry.batch_id.replace('batch-', 'Batch ') : entry.bottle_type === 'premium' ? 'Premium' : 'Founder'}
                      {entry.bottle_number ? ` · #${entry.bottle_number}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-parchment-500 text-sm">No entries yet. Be the first.</p>
          )}
        </div>
      </section>

      {/* Form section */}
      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Join the Log</h2>
            <p className="text-parchment-300 text-sm mb-6">
              If you bought a bottle and want to be on the record, add your name.
            </p>
            <ExpeditionLogForm batchId={CURRENT_BATCH_ID} />
          </div>
        </div>
      </section>
    </main>
  )
}
