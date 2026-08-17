import type { Metadata } from 'next'
import CocktailFacetPage from '@/components/CocktailFacetPage'
import { getFacets, getMemberCounts } from '@/lib/facet-data'
import { copyFor, renderCopy } from '@/lib/facet-copy'
import { canonicalFor, robotsFor, titleFor } from '@/lib/cocktail-facets'
import { OG_IMAGE_COCKTAIL, baseOpenGraph } from '@/lib/og'

const KIND = 'spirit' as const

export const revalidate = 3600

// Only the facets that exist are generated. An unknown value still 404s, but
// the 404 comes from notFound() in CocktailFacetPage rather than from the
// router. See the style route for why dynamicParams must stay true.
export async function generateStaticParams() {
  const facets = await getFacets(KIND)
  return facets.map((f) => ({ value: f.value }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ value: string }> }): Promise<Metadata> {
  const { value } = await params
  const facet = (await getFacets(KIND)).find((f) => f.value === value)
  if (!facet) return { title: 'Not Found' }

  // Tokens resolve here as well as in the body. Accurate prose under a stale
  // title is the failure the tokens exist to prevent, so the same renderer runs
  // in metadata, against the same live counts.
  const copy = copyFor(KIND, value)
  const ctx = { count: facet.count, split: await getMemberCounts(facet) }

  return {
    title: copy?.title ? renderCopy(copy.title, ctx) : titleFor(facet),
    description: copy?.description
      ? renderCopy(copy.description, ctx)
      : `${facet.count} ${facet.label.toLowerCase()} cocktail recipes from the Jerry Can Spirits Field Manual.`,
    alternates: { canonical: `https://jerrycanspirits.co.uk${canonicalFor(facet)}` },
    // og:url is required by the Open Graph protocol and was absent, which is
    // why the crawl reported these cards invalid while every other attribute
    // was present. Title and description resolve from the fields above.
    openGraph: {
      ...baseOpenGraph,
      url: `https://jerrycanspirits.co.uk${canonicalFor(facet)}`,
      images: OG_IMAGE_COCKTAIL,
    },
    robots: robotsFor(facet),
  }
}

export default async function Page({ params }: { params: Promise<{ value: string }> }) {
  const { value } = await params
  return <CocktailFacetPage kind={KIND} value={value} />
}
