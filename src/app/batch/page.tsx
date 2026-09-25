import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import BatchCard from '@/components/BatchCard'
import { getD1, getAllBatches, getBatchStats } from '@/lib/d1'
import { baseOpenGraph } from '@/lib/og'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Check Your Bottle — Batch Tracker',
  description:
    'Verify your bottle of Jerry Can Spirits rum. View batch details, tasting notes, and production provenance for every batch we produce.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/batch/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Check Your Bottle | Jerry Can Spirits®',
    description: 'Verify your bottle of Jerry Can Spirits rum. View batch details, tasting notes, and production provenance.',
    url: 'https://jerrycanspirits.co.uk/batch/',
  },
}

export default async function BatchIndexPage() {
  const db = await getD1()
  const batches = await getAllBatches(db)

  const batchesWithStats = await Promise.all(
    batches.map(async (batch) => ({
      batch,
      stats: await getBatchStats(db, batch.id),
    })),
  )

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Batches',
    description: 'All production batches from Jerry Can Spirits',
    itemListElement: batches.map((batch, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: batch.name,
      url: `https://jerrycanspirits.co.uk/batch/${batch.id.replace('batch-', '')}/`,
    })),
  }

  return (
    <main>
      <StructuredData data={itemListSchema} id="batch-list-schema" />

      {/* One band. The batch cards carry the amber, emerald and red status
          pills, which have no light-band tokens, so the grid stays on the
          hero's dark ground rather than opening a light band of its own. */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumbs items={[{ label: 'Check Your Bottle' }]} />
          </div>

          {/* Header */}
          <SectionHeading
            as="h1"
            eyebrow="Batch Tracker"
            intro={
              <>
                Every bottle of Jerry Can Spirits is tracked from production to your door.
                Select a batch below to view production details, tasting notes, and look up your individual bottle.
              </>
            }
          >
            Check Your Bottle
          </SectionHeading>

          {/* Batch Grid */}
          {batchesWithStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchesWithStats.map(({ batch, stats }) => (
                <BatchCard key={batch.id} batch={batch} stats={stats} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-parchment-400 text-lg">No batches available yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
