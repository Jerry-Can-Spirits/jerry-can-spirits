import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import BatchDetails from '@/components/BatchDetails'
import BottleLookup from '@/components/BottleLookup'
import ShareButton from '@/components/ShareButton'
import { getD1, getBatch, getBatchStats } from '@/lib/d1'
import { client } from '@/sanity/client'
import { featuredCocktailsQuery } from '@/sanity/queries'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ batchNumber: string }>
}

interface FeaturedCocktail {
  _id: string
  name: string
  slug: { current: string }
  description: string
  difficulty: string
  image: string | null
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { batchNumber } = await params
  const db = await getD1()
  const batch = await getBatch(db, `batch-${batchNumber}`)

  if (!batch) {
    return { title: 'Batch Not Found' }
  }

  return {
    title: `${batch.name} — Check Your Bottle`,
    description: `${batch.tasting_notes || `Production details and tasting notes for ${batch.name}.`} View bottle provenance and verify your bottle of Jerry Can Spirits rum.`,
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/batch/${batchNumber}/`,
    },
    openGraph: {
      title: `${batch.name} | Jerry Can Spirits\u00ae`,
      description: batch.tasting_notes || `Production details for ${batch.name}.`,
    },
  }
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { batchNumber } = await params
  const batchId = `batch-${batchNumber}`

  const db = await getD1()
  const [batch, stats, cocktails] = await Promise.all([
    getBatch(db, batchId),
    getBatchStats(db, batchId),
    client.fetch<FeaturedCocktail[]>(featuredCocktailsQuery),
  ])

  if (!batch) notFound()

  const pageUrl = `https://jerrycanspirits.co.uk/batch/${batchNumber}/`

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Check Your Bottle', href: '/batch/' },
              { label: `Batch ${batchNumber}` },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              {batch.name}
            </h1>
            {statusBadge(batch.status)}
          </div>

          {/* Stats row */}
          {stats && (
            <div className="flex flex-wrap gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-gold-400 text-2xl font-bold">{stats.total_bottles}</span>
                <span className="text-parchment-500 text-sm">bottles</span>
              </div>
              {batch.abv && (
                <div className="flex items-baseline gap-2">
                  <span className="text-gold-400 text-2xl font-bold">{batch.abv}%</span>
                  <span className="text-parchment-500 text-sm">ABV</span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-gold-400 text-2xl font-bold">{stats.days_aged}</span>
                <span className="text-parchment-500 text-sm">days aged</span>
              </div>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main content */}
          <div className="lg:col-span-2">
            <BatchDetails batch={batch} stats={stats} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BottleLookup batchNumber={batchNumber} />

            <div className="flex gap-4">
              <ShareButton
                title={batch.name}
                text={`Check out ${batch.name} from Jerry Can Spirits`}
                url={pageUrl}
                buttonText="Share This Batch"
              />
            </div>
          </div>
        </div>

        {/* Featured Cocktails */}
        {cocktails && cocktails.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">
              Cocktails to Try with This Batch
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cocktails.map((cocktail) => (
                <Link
                  key={cocktail._id}
                  href={`/field-manual/cocktails/${cocktail.slug.current}/`}
                  className="group block bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-500/40 transition-all duration-300"
                >
                  {cocktail.image && (
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={cocktail.image}
                        alt={cocktail.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-white font-semibold group-hover:text-gold-300 transition-colors mb-1">
                      {cocktail.name}
                    </h3>
                    {cocktail.description && (
                      <p className="text-parchment-400 text-sm line-clamp-2">{cocktail.description}</p>
                    )}
                    {cocktail.difficulty && (
                      <span className="inline-block mt-2 text-xs text-gold-400 uppercase tracking-wider">
                        {cocktail.difficulty}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Shop CTA */}
        <section className="text-center py-12 bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">
            Get Your Own Bottle
          </h2>
          <p className="text-parchment-300 mb-6 max-w-lg mx-auto">
            Expedition Spiced Rum — crafted by veterans, aged in American oak, and ready for adventure.
          </p>
          <Link
            href="/shop/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Shop Now
          </Link>
        </section>
      </div>
    </main>
  )
}
