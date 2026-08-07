import type { Metadata } from 'next'
import CocktailFacetPage from '@/components/CocktailFacetPage'
import { getFacets } from '@/lib/facet-data'
import { canonicalFor, robotsFor, titleFor } from '@/lib/cocktail-facets'

const KIND = 'spirit' as const

export const revalidate = 3600

// Only the facets that exist are generated, and dynamicParams is off, so any
// other value 404s rather than rendering an empty listing for any string
// someone types.
export async function generateStaticParams() {
  const facets = await getFacets(KIND)
  return facets.map((f) => ({ value: f.value }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ value: string }> }): Promise<Metadata> {
  const { value } = await params
  const facet = (await getFacets(KIND)).find((f) => f.value === value)
  if (!facet) return { title: 'Not Found' }

  return {
    title: titleFor(facet),
    description: `${facet.count} ${facet.label.toLowerCase()} cocktail recipes from the Jerry Can Spirits Field Manual.`,
    alternates: { canonical: `https://jerrycanspirits.co.uk${canonicalFor(facet)}` },
    robots: robotsFor(facet),
  }
}

export default async function Page({ params }: { params: Promise<{ value: string }> }) {
  const { value } = await params
  return <CocktailFacetPage kind={KIND} value={value} />
}
