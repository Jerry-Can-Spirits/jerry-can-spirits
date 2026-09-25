import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import BatchDetails from '@/components/BatchDetails'
import BatchIngredients from '@/components/BatchIngredients'
import BottleLookup from '@/components/BottleLookup'
import ShareButton from '@/components/ShareButton'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'
import { getD1, getBatch, getBatchStats, getBatchIngredients } from '@/lib/d1'
import { client } from '@/sanity/lib/client'
import { featuredCocktailsQuery } from '@/sanity/queries'
import { baseOpenGraph } from '@/lib/og'

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

  const truncateNotes = (notes: string, maxLen: number) => {
    if (notes.length <= maxLen) return notes
    return notes.slice(0, maxLen).replace(/\s\S*$/, '') + '...'
  }

  const shortNotes = batch.tasting_notes
    ? truncateNotes(batch.tasting_notes, 100)
    : `Production details and tasting notes for ${batch.name}.`

  return {
    title: `${batch.name} — Check Your Bottle`,
    description: `${shortNotes} Verify your bottle of Jerry Can Spirits rum.`,
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/batch/${batchNumber}/`,
    },
    openGraph: {
      ...baseOpenGraph,
      title: `${batch.name} | Jerry Can Spirits\u00ae`,
      description: shortNotes,
      url: `https://jerrycanspirits.co.uk/batch/${batchNumber}/`,
    },
  }
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { batchNumber } = await params
  const batchId = `batch-${batchNumber}`

  const db = await getD1()
  const [batch, stats, ingredients] = await Promise.all([
    getBatch(db, batchId),
    getBatchStats(db, batchId),
    getBatchIngredients(db, batchId),
  ])

  if (!batch) notFound()

  // Non-essential CMS data: a Sanity outage must not 500 the passport (a page
  // reached by scanning a bottle QR — all its real data is in D1). Degrade to no
  // featured cocktails rather than taking the whole page down.
  const cocktails = await client
    .fetch<FeaturedCocktail[]>(featuredCocktailsQuery)
    .catch(() => [] as FeaturedCocktail[])

  const pageUrl = `https://jerrycanspirits.co.uk/batch/${batchNumber}/`

  return (
    <main>
      {/* The passport on dark: the status pill's amber, emerald and red have
          no light-band tokens, and the bottle lookup's field is a green panel
          inside a green panel, which only reads on the dark ground. */}
      <section className="band-dark pt-20 pb-16">
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
          <SectionHeading as="h1" intro={statusBadge(batch.status)}>
            {batch.name}
          </SectionHeading>

          {/* Stats row */}
          {stats && (
            <div className="flex flex-wrap justify-center gap-6 mb-16">
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
                <span className="text-gold-400 text-2xl font-bold">{stats.days_aged > 0 ? stats.days_aged : 'Unaged'}</span>
                {stats.days_aged > 0 && <span className="text-parchment-500 text-sm">days aged</span>}
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <BatchDetails batch={batch} stats={stats} />
              {ingredients.length > 0 && (
                <div className="mt-8">
                  <BatchIngredients ingredients={ingredients} />
                </div>
              )}
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
        </div>
      </section>

      <section className="band-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Cocktails */}
          {cocktails && cocktails.length > 0 && (
            <section className="mb-16">
              <SectionHeading>Cocktails to Try with This Batch</SectionHeading>
              <ScrollRow
                ariaLabel="Cocktails to Try with This Batch"
                cols="md:grid-cols-2 lg:grid-cols-4"
                items={cocktails.map((cocktail) => (
                  <Link
                    key={cocktail._id}
                    href={`/field-manual/cocktails/${cocktail.slug.current}/`}
                    className="group block h-full bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-500/40 transition-all duration-300"
                  >
                    {cocktail.image && (
                      <div className="aspect-4/3 relative overflow-hidden">
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
              />
            </section>
          )}

          {/* Shop CTA */}
          <section className="text-center py-12 bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              Get Your Own Bottle
            </h2>
            <p className="text-parchment-300 mb-6 max-w-lg mx-auto">
              Expedition Spiced Rum — crafted by veterans, blended with real botanicals, and ready for adventure.
            </p>
            <Link
              href="/shop/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </Link>
          </section>
        </div>
      </section>
    </main>
  )
}
