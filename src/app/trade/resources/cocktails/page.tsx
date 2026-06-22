import Link from 'next/link'
import Image from 'next/image'
import * as Sentry from '@sentry/nextjs'
import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TRADE_COCKTAIL_SLUGS } from '@/lib/trade-portal/cocktail-cards'
import { client as sanityClient } from '@/sanity/lib/client'
import { cocktailsByTradeSlugsQuery } from '@/sanity/queries'

export const dynamic = 'force-dynamic'

interface CocktailListItem {
  _id: string
  name: string
  slug: string
  description: string
  difficulty: string
  family: string
  image: string | null
  imageAlt: string | null
}

async function fetchTradeCocktails(): Promise<CocktailListItem[]> {
  try {
    const slugs: string[] = [...TRADE_COCKTAIL_SLUGS]
    const results = await sanityClient.fetch<CocktailListItem[]>(cocktailsByTradeSlugsQuery, { slugs })
    // Preserve the curated order from TRADE_COCKTAIL_SLUGS rather than Sanity's default ordering.
    const orderIndex = new Map<string, number>(slugs.map((s, i) => [s, i]))
    return [...results].sort((a, b) => (orderIndex.get(a.slug) ?? 0) - (orderIndex.get(b.slug) ?? 0))
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-cocktails', phase: 'sanity-fetch' } })
    return []
  }
}

function formatDifficulty(d: string): string {
  if (!d) return ''
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export default async function TradeCocktailsListPage() {
  await requireTradeSession()
  const cocktails = await fetchTradeCocktails()

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/resources" className="text-sm text-parchment-400 hover:text-parchment-200">
          ← Trade resources
        </Link>
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mt-3 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Trade Portal</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Cocktail recipe cards</h1>
        <p className="text-parchment-300 text-base leading-relaxed mb-10">
          Print-friendly recipe cards for the Jerry Can house serves. Each card opens to a single page with ingredients, method, glass, garnish, and any variants. Print individually for service drawers.
        </p>

        {cocktails.length === 0 ? (
          <p className="text-parchment-300">No cocktail cards available right now. Check back shortly.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {cocktails.map((c) => (
              <Link
                key={c._id}
                href={`/trade/resources/cocktails/${c.slug}`}
                className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20 hover:border-gold-400/50 transition-colors"
                prefetch={false}
              >
                {c.image && (
                  <div className="relative w-full aspect-3/2">
                    <Image
                      src={c.image}
                      alt={c.imageAlt ?? c.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 360px"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-xl font-serif font-bold text-white mb-1 group-hover:text-gold-200 transition-colors">
                    {c.name}
                  </h2>
                  <p className="text-xs text-gold-300 uppercase tracking-widest mb-3">
                    {formatDifficulty(c.difficulty)} build
                  </p>
                  <p className="text-sm text-parchment-300 leading-relaxed">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
