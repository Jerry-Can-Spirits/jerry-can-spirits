import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { homepageServesQuery, HOMEPAGE_SERVE_SLUGS } from '@/sanity/queries'

interface Serve {
  name: string
  slug: { current: string }
  description?: string
  image?: string
  imageAlt?: string
}

// First sentence of the recipe's own description, so the card says what the
// recipe page says and there is no second copy to drift.
function firstSentence(text?: string): string {
  if (!text) return ''
  const m = /^(.*?[.!?])(\s|$)/.exec(text.trim())
  return (m ? m[1] : text.trim()).replace(/!/g, '.')
}

// Three serves built on the rum, after the reviews. The homepage restructure
// of 28 Aug 2026 removed the Field Manual preview as a detour from the one
// CTA; this is its replacement, reinstated 24 Sep 2026 by Dan's decision,
// narrowed to the rum's own serves so it answers "what would I do with the
// bottle" rather than opening the whole library. Each card links to its
// recipe; one line links to the Field Manual. Degrades to nothing on a failed
// fetch.
export default async function RumServesTeaser() {
  let serves: Serve[] = []
  try {
    const found = await client.fetch<Serve[]>(homepageServesQuery, { slugs: HOMEPAGE_SERVE_SLUGS })
    // Sanity returns in document order; keep the order the slugs were chosen in.
    serves = HOMEPAGE_SERVE_SLUGS.map((s) => found.find((c) => c.slug.current === s)).filter((c): c is Serve => Boolean(c))
  } catch (error) {
    console.error('[RumServesTeaser] fetch failed:', error)
  }
  if (serves.length === 0) return null

  return (
    <section className="py-16" aria-labelledby="serves-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 id="serves-heading" className="text-3xl md:text-4xl font-serif font-bold text-white">
            What to make with it.
          </h2>
          <p className="mt-3 text-parchment-300 max-w-2xl mx-auto">
            Three serves built on Expedition Spiced Rum, measured in 25ml and 50ml, written up in the Field Manual.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {serves.map((serve) => (
            <Link
              key={serve.slug.current}
              href={`/field-manual/cocktails/${serve.slug.current}/`}
              className="group rounded-xl border border-gold-500/20 hover:border-gold-400/40 bg-jerry-green-900/40 overflow-hidden transition-colors"
            >
              {serve.image && (
                <div className="relative aspect-[4/3]">
                  <Image
                    src={serve.image}
                    alt={serve.imageAlt || serve.name}
                    fill
                    loading="lazy"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">{serve.name}</h3>
                <p className="mt-2 text-sm text-parchment-300 leading-relaxed">{firstSentence(serve.description)}</p>
                <span className="mt-3 inline-block text-sm text-gold-400">The recipe</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/field-manual/cocktails/" className="text-gold-300 hover:text-gold-200 underline underline-offset-4 text-sm font-semibold">
            Every serve, in the Field Manual
          </Link>
        </div>
      </div>
    </section>
  )
}
