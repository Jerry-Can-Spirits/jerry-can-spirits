import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import BatchCard from '@/components/BatchCard'
import { getD1, getAllBatches, getBatchStats } from '@/lib/d1'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Check Your Bottle — Batch Tracker',
  description:
    'Verify your bottle of Jerry Can Spirits rum. View batch details, tasting notes, and production provenance for every batch we produce.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/batch/',
  },
  openGraph: {
    title: 'Check Your Bottle | Jerry Can Spirits\u00ae',
    description:
      'Verify your bottle of Jerry Can Spirits rum. View batch details, tasting notes, and production provenance.',
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
    <main className="min-h-screen py-20">
      <StructuredData data={itemListSchema} id="batch-list-schema" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Check Your Bottle' }]} />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Batch Tracker
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Check Your Bottle
          </h1>
          <p className="text-lg text-parchment-300 max-w-2xl mx-auto leading-relaxed">
            Every bottle of Jerry Can Spirits is tracked from distillation to your door.
            Select a batch below to view production details, tasting notes, and look up your individual bottle.
          </p>
        </div>

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
    </main>
  )
}
