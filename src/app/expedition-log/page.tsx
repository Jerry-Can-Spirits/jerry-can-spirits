import type { Metadata } from 'next'
import { getD1 } from '@/lib/d1'
import ExpeditionLogMapClient from '@/components/ExpeditionLogMapClient'
import SectionHeading from '@/components/SectionHeading'
import { baseOpenGraph } from '@/lib/og'
import { CURRENT_BATCH_ID } from '@/lib/d1'
import { bottleMapHeadline, type BottleMapSummary } from '@/lib/bottle-map'
import { getBottleMap } from '@/lib/bottle-map-d1'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Expedition Log',
  description: 'Where every bottle of Batch 001 has gone, by postcode district.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'The Expedition Log | Jerry Can Spirits®',
    description: 'Where every bottle of Batch 001 has gone, by postcode district.',
    url: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
}

export default async function ExpeditionLogPage() {
  const db = await getD1()
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
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="The Expedition Log"
            intro="Where the bottles went."
          >
            The Expedition Log
          </SectionHeading>

          {/* Map. The className is the map's height: the client component puts
              it on the container and fills it with h-full, so without one the
              map renders at zero pixels. On the log's own page the map is the
              exhibit, not a teaser. */}
          {headline && (
            <p className="text-gold-300 text-base sm:text-lg text-center mb-6">{headline}</p>
          )}
          <ExpeditionLogMapClient points={bottleMap.points} className="w-full h-96 sm:h-[32rem] rounded-xl" />
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
    </main>
  )
}
