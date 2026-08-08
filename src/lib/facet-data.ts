import { client } from '@/sanity/lib/client'
import {
  FACET_PAGE_SIZE,
  SPIRIT_FACETS,
  labelFor,
  type Facet,
  type FacetIndexItem,
  type FacetKind,
} from '@/lib/cocktail-facets'

/**
 * Reading the facet dimensions out of Sanity.
 *
 * Which facets exist is a question about the content, not a list in code: the
 * style facet is every distinct `family`, and the spirit facet is every entry
 * in SPIRIT_FACETS whose members are actually used. Counting them here means a
 * family added in Sanity gets a page without a deploy, and a family that empties
 * out stops claiming one.
 */

export interface FacetCocktail {
  _id: string
  name: string
  slug: { current: string }
  description: string
  image?: string
  family?: string
  baseSpirit?: string
}

const CARD_PROJECTION = `{
  _id,
  name,
  slug,
  description,
  family,
  baseSpirit,
  "image": image.asset->url
}`

/** Every style facet with its count, including the ones below the floor. */
export async function getStyleFacets(): Promise<Facet[]> {
  // GROQ has no group-by, so the values come back flat and are counted here.
  // One field for 348 documents is a small payload and it runs at build time.
  const values = await client.fetch<string[]>(`*[_type == "cocktail" && defined(family)].family`)
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)

  return [...counts.entries()]
    .map(([value, count]) => ({
      kind: 'style' as FacetKind,
      value,
      label: labelFor(value),
      count,
      isRollup: false,
      members: [],
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

/** Every spirit facet with its count, summed across the members it covers. */
export async function getSpiritFacets(): Promise<Facet[]> {
  const values = await client.fetch<string[]>(`*[_type == "cocktail" && defined(baseSpirit)].baseSpirit`)
  const raw = new Map<string, number>()
  for (const v of values) raw.set(v, (raw.get(v) ?? 0) + 1)

  return Object.entries(SPIRIT_FACETS)
    .map(([value, { label, members, isRollup }]) => ({
      kind: 'spirit' as FacetKind,
      value,
      label,
      isRollup,
      count: members.reduce((sum, m) => sum + (raw.get(m) ?? 0), 0),
      members,
    }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export async function getFacets(kind: FacetKind): Promise<Facet[]> {
  return kind === 'style' ? getStyleFacets() : getSpiritFacets()
}

/** A single facet by kind and value, or null when nothing matches. */
export async function getFacet(kind: FacetKind, value: string): Promise<Facet | null> {
  const facets = await getFacets(kind)
  return facets.find((f) => f.value === value) ?? null
}

/**
 * One page of cocktails for a facet, ordered by name so pagination is stable:
 * a creation-date order reshuffles pages whenever a recipe is added, which
 * changes what page 2 contains without page 2 changing.
 */
export async function getFacetCocktails(facet: Facet, page: number): Promise<FacetCocktail[]> {
  const start = (page - 1) * FACET_PAGE_SIZE
  const end = start + FACET_PAGE_SIZE

  if (facet.kind === 'style') {
    return client.fetch<FacetCocktail[]>(
      `*[_type == "cocktail" && family == $value] | order(name asc) [$start...$end] ${CARD_PROJECTION}`,
      { value: facet.value, start, end }
    )
  }
  return client.fetch<FacetCocktail[]>(
    `*[_type == "cocktail" && baseSpirit in $members] | order(name asc) [$start...$end] ${CARD_PROJECTION}`,
    { members: facet.members, start, end }
  )
}

/**
 * Name and slug for every cocktail in a facet, for the in-page filter.
 *
 * Deliberately two fields. The card payload carries descriptions and image
 * URLs and runs to several hundred bytes per recipe; a filter only needs
 * something to match against and somewhere to go. MEASURED across the whole
 * corpus this is roughly 25 kB, against roughly 340 kB for the same list with
 * card fields attached.
 */
export async function getFacetSearchIndex(facet: Facet): Promise<FacetIndexItem[]> {
  // baseSpirit and difficulty ride along so the page can filter on them without
  // a second request. Two short strings per cocktail against a name and a slug
  // already being sent; the alternative is shipping the card data, which is the
  // payload this index exists to avoid.
  const projection = `{ "n": name, "s": slug.current, "b": baseSpirit, "d": difficulty }`
  if (facet.kind === 'style') {
    return client.fetch(`*[_type == "cocktail" && family == $value] | order(name asc) ${projection}`, {
      value: facet.value,
    })
  }
  return client.fetch(`*[_type == "cocktail" && baseSpirit in $members] | order(name asc) ${projection}`, {
    members: facet.members,
  })
}

/** The raw baseSpirit values inside a spirit facet, with counts, for the orienting section. */
export async function getMemberCounts(facet: Facet): Promise<Array<{ member: string; count: number }>> {
  if (facet.members.length < 2) return []
  const values = await client.fetch<string[]>(
    `*[_type == "cocktail" && baseSpirit in $members].baseSpirit`,
    { members: facet.members }
  )
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return facet.members
    .map((member) => ({ member, count: counts.get(member) ?? 0 }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)
}
