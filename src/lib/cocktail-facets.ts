/**
 * Facet configuration for the cocktail hub.
 *
 * Single source of truth for which facet pages exist, which are indexable, and
 * what each one canonicalises to. Kept as data rather than conditionals spread
 * through the route so the indexability rule can be read, tested and changed in
 * one place.
 */

export const FACET_PAGE_SIZE = 24

// A facet needs this many cocktails to earn an indexable page. Below it the
// page still exists and still renders — it is reachable by filtering — but it
// is noindexed, because a page listing three recipes is thin whatever is
// written around it. A floor, not a ceiling: promote on search evidence.
export const INDEXABLE_MIN_COCKTAILS = 10

// Never indexable regardless of count. These are not queries anyone types.
// `multiple` means "no single base spirit", `other` is a bucket, and `liqueur`
// is too broad to answer a search with.
export const NEVER_INDEXED = new Set(['multiple', 'other', 'liqueur'])

/**
 * Spirit rollups. The `baseSpirit` field fragments categories that readers and
 * search engines treat as one: rum is split five ways and whiskey four, so the
 * site has no page for either head term despite holding 53 and 74 cocktails.
 *
 * All six are equals sharing one template. Nothing here is specific to rum, so
 * a vodka expression needs no new code.
 *
 * Whiskey takes the "e" in its slug and covers Scotch and Japanese, which are
 * correctly spelled without it. The rollup page explains why both are right.
 */
export const SPIRIT_ROLLUPS: Record<string, { label: string; members: string[] }> = {
  rum: {
    label: 'Rum',
    members: ['white-rum', 'dark-rum', 'aged-rum', 'spiced-rum', 'overproof-rum', 'rhum-agricole', 'cachaca'],
  },
  whiskey: {
    label: 'Whiskey',
    members: ['bourbon', 'rye-whiskey', 'scotch', 'irish-whiskey', 'welsh-whisky'],
  },
  gin: { label: 'Gin', members: ['gin'] },
  vodka: { label: 'Vodka', members: ['vodka'] },
  tequila: { label: 'Tequila', members: ['tequila', 'mezcal'] },
  brandy: { label: 'Brandy', members: ['cognac', 'brandy'] },
}

export type FacetKind = 'style' | 'spirit'

export interface Facet {
  kind: FacetKind
  /** URL segment, e.g. "sours" or "rum" */
  value: string
  /** Human label for headings and titles */
  label: string
  /** How many cocktails it holds */
  count: number
  /** True when this is a rollup rather than a raw baseSpirit value */
  isRollup: boolean
}

/** Title case a slug: "old-fashioneds" -> "Old Fashioneds" */
export function labelFor(value: string): string {
  return value
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * The indexability rule, in one place.
 *
 * Rollups are always indexable when they hold anything, because they exist
 * precisely to answer the head term and are never thin by construction.
 */
export function isIndexable(facet: Pick<Facet, 'value' | 'count' | 'isRollup'>): boolean {
  if (NEVER_INDEXED.has(facet.value)) return false
  if (facet.isRollup) return facet.count > 0
  return facet.count >= INDEXABLE_MIN_COCKTAILS
}

/** Which rollup, if any, a raw baseSpirit belongs to. */
export function rollupFor(baseSpirit: string): string | null {
  for (const [slug, { members }] of Object.entries(SPIRIT_ROLLUPS)) {
    if (members.includes(baseSpirit)) return slug
  }
  return null
}

export function facetPath(kind: FacetKind, value: string, page = 1): string {
  const base = `/field-manual/cocktails/${kind}/${value}/`
  return page > 1 ? `${base}page/${page}/` : base
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / FACET_PAGE_SIZE))
}

/**
 * Canonical URL for any facet page.
 *
 * Page 1 and pages 2+ are each self-canonical: later pages carry distinct
 * recipes, so pointing them at page 1 would ask Google to drop real content.
 * Non-indexable facets canonicalise up to the unfiltered hub instead.
 */
export function canonicalFor(facet: Pick<Facet, 'kind' | 'value' | 'count' | 'isRollup'>, page = 1): string {
  if (!isIndexable(facet)) return '/field-manual/cocktails/'
  return facetPath(facet.kind, facet.value, page)
}
