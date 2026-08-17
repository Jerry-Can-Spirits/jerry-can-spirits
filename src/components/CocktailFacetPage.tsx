import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import BackToTop from '@/components/BackToTop'
import StructuredData from '@/components/StructuredData'
import FacetFilter from '@/components/FacetFilter'
import {
  FACET_PAGE_SIZE,
  MEMBER_LABELS,
  facetPath,
  hasSubTypes,
  headingFor,
  isIndexable,
  isValidPage,
  pageCount,
  titleFor,
  type FacetKind,
} from '@/lib/cocktail-facets'
import { getFacet, getFacetCocktails, getFacetSearchIndex, getMemberCounts } from '@/lib/facet-data'
import { copyFor, renderCopy } from '@/lib/facet-copy'

/**
 * One template for every facet page: eleven styles, six spirit rollups and two
 * standalone spirits, page 1 and every page after it. No facet gets special
 * treatment — rum renders through exactly the same component as vodka, so a
 * change to the template reaches all of them and none of them can drift.
 *
 * The written introduction is deliberately absent from the repo. Facet copy is
 * customer-facing and goes through the same approval as any other copy; the
 * template renders it when it exists rather than generating filler.
 */

export default async function CocktailFacetPage({
  kind,
  value,
  page = 1,
}: {
  kind: FacetKind
  value: string
  page?: number
}) {
  const facet = await getFacet(kind, value)

  // An unknown facet value is a 404, not an empty listing. A page that renders
  // "0 cocktails" for any string anyone types is an infinite surface of thin
  // pages, and it tells a reader a category exists when it does not.
  if (!facet) notFound()

  const pages = pageCount(facet.count)
  if (!isValidPage(page, facet.count)) notFound()

  const [cocktails, searchIndex, memberCounts] = await Promise.all([
    getFacetCocktails(facet, page),
    getFacetSearchIndex(facet),
    getMemberCounts(facet),
  ])

  const copy = copyFor(facet.kind, facet.value)
  // Tokens resolve against the same counts the grid below is built from, so
  // the prose cannot disagree with the page it sits on.
  const ctx = { count: facet.count, split: memberCounts }
  // Introduction on page 1 only. Page 3 is the same facet, not a new subject,
  // and repeating the intro would duplicate it across every paginated URL.
  const intro = page === 1 && copy?.intro ? renderCopy(copy.intro, ctx) : null

  const indexable = isIndexable(facet)
  const showOrientingSection = hasSubTypes(facet) && memberCounts.length > 1 && page === 1

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: titleFor(facet, page),
    numberOfItems: cocktails.length,
    itemListElement: cocktails.map((c, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * FACET_PAGE_SIZE + i + 1,
      url: `https://jerrycanspirits.co.uk/field-manual/cocktails/${c.slug.current}/`,
      name: c.name,
    })),
  }

  return (
    <main className="min-h-screen py-20">
      {/* ItemList only when the page is indexable: describing a page to a
          crawler that has been told not to index it is a mixed signal. */}
      {indexable && <StructuredData data={itemListSchema} id="facet-itemlist" />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Field Manual', href: '/field-manual' },
            { label: 'Cocktails', href: '/field-manual/cocktails' },
            { label: facet.label },
          ]}
        />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
          {copy?.h1 && page === 1 ? copy.h1 : headingFor(facet, page)}
        </h1>
        <p className="text-parchment-400">
          {facet.count} {facet.count === 1 ? 'recipe' : 'recipes'}
          {pages > 1 ? `, page ${page} of ${pages}` : ''}
        </p>

        {/* Rendered only where approved copy exists. A facet nobody has written
            gets its heading and its grid and nothing invented in between. */}
        {intro && (
          <div className="mt-6 max-w-3xl space-y-4">
            {intro.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="text-parchment-300 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* The orienting section. Every facet covering more than one base spirit
          explains what it covers and links down to each, so a reader who
          arrived on "whiskey" can reach bourbon or rye without going back to
          the index. Page 1 only: it is orientation, not pagination. */}
      {showOrientingSection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">
              What counts as {facet.label.toLowerCase()} here
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {memberCounts.map(({ member, count }) => (
                <Link
                  key={member}
                  href={`/field-manual/cocktails/?spirit=${member}`}
                  className="flex items-center justify-between gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                >
                  <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">
                    {MEMBER_LABELS[member] ?? member}
                  </span>
                  <span className="text-parchment-400 text-sm shrink-0">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FacetFilter index={searchIndex} label={facet.label} />

        {cocktails.length === 0 ? (
          <p className="text-parchment-300">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cocktails.map((c) => (
              <Link
                key={c._id}
                href={`/field-manual/cocktails/${c.slug.current}/`}
                className="group bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300"
              >
                {c.image && (
                  <div className="relative aspect-4/3 bg-jerry-green-800/20">
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Every page links to every other, rather than Previous and Next
            alone. With sequential links only, page 4 was reachable solely
            through page 3 through page 2: one internal link each, and a crawl
            depth to match. That matters here more than on most paginated
            listings, because the hub renders its first sixteen recipes and then
            loads the rest on click, so these pages are the crawlable route to
            the recipes deep in a facet. Numbering them puts every page one
            click from the first. The counts are small enough (four pages at the
            widest) that a full list needs no windowing. */}
        {pages > 1 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
            {page > 1 && (
              <Link
                href={facetPath(facet.kind, facet.value, page - 1)}
                rel="prev"
                className="px-5 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors font-semibold"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
              n === page ? (
                <span
                  key={n}
                  aria-current="page"
                  className="px-4 py-3 bg-gold-500/40 border border-gold-400/60 text-gold-200 rounded-lg font-semibold"
                >
                  {n}
                </span>
              ) : (
                <Link
                  key={n}
                  href={facetPath(facet.kind, facet.value, n)}
                  aria-label={`Page ${n} of ${pages}`}
                  className="px-4 py-3 bg-jerry-green-800/30 border border-gold-500/20 text-parchment-300 rounded-lg hover:bg-jerry-green-800/50 hover:text-gold-300 transition-colors font-semibold"
                >
                  {n}
                </Link>
              )
            )}
            {page < pages && (
              <Link
                href={facetPath(facet.kind, facet.value, page + 1)}
                rel="next"
                className="px-5 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors font-semibold"
              >
                Next
              </Link>
            )}
          </nav>
        )}

        <div className="mt-12 pt-6">
          <Link
            href="/field-manual/cocktails/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors font-semibold"
          >
            All cocktails
          </Link>
        </div>
      </section>

      <BackToTop />
    </main>
  )
}
