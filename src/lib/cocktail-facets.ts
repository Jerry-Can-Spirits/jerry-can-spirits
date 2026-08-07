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
 * Spirit facets. The `baseSpirit` field fragments categories that readers and
 * search engines treat as one: rum is split seven ways and whiskey five, so the
 * site had no page for either head term despite holding 54 and 74 cocktails.
 *
 * All six are equals sharing one template. Nothing here is specific to rum, so
 * a vodka expression needs no new code.
 *
 * `members` drives the orienting section: a facet covering more than one
 * baseSpirit explains its sub-types and links down to each, and a facet
 * covering exactly one has nothing to explain.
 *
 * Whiskey takes the "e" in its slug and covers Scotch, which is correctly
 * spelled without it. The rollup page explains why both spellings are right.
 *
 * An earlier version of this comment also claimed Japanese. MEASURED: there is
 * no Japanese member and no cocktail with a Japanese base spirit. A comment
 * claiming coverage the data does not have is a fact waiting to become copy.
 *
 * Not every base spirit gets a facet. multiple (20) and liqueur (18) are in
 * NEVER_INDEXED. sherry (5) and vermouth (1) sit below the floor and so have no
 * page: that is the floor working, not an omission.
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

/**
 * Raw baseSpirit values that earn a page without belonging to a rollup.
 *
 * These are not rollups and are not treated as such: they carry no head-term
 * exemption and must clear the floor like any other raw facet. They are listed
 * only because they would otherwise be unreachable, sitting outside all six
 * rollups. MEASURED: champagne 12, non-alcoholic 11.
 */
export const STANDALONE_SPIRITS: Record<string, { label: string; member: string }> = {
  champagne: { label: 'Champagne', member: 'champagne' },
  'non-alcoholic': { label: 'Non-Alcoholic', member: 'non-alcoholic' },
}

/** Every spirit facet slug that gets a page, rollups and standalones alike. */
export const SPIRIT_FACETS: Record<string, { label: string; members: string[]; isRollup: boolean }> = {
  ...Object.fromEntries(
    Object.entries(SPIRIT_ROLLUPS).map(([slug, v]) => [slug, { ...v, isRollup: true }])
  ),
  ...Object.fromEntries(
    Object.entries(STANDALONE_SPIRITS).map(([slug, v]) => [
      slug,
      { label: v.label, members: [v.member], isRollup: false },
    ])
  ),
}

/** Human labels for the raw baseSpirit values inside a rollup. */
export const MEMBER_LABELS: Record<string, string> = {
  'white-rum': 'White rum',
  'dark-rum': 'Dark rum',
  'aged-rum': 'Aged rum',
  'spiced-rum': 'Spiced rum',
  'overproof-rum': 'Overproof rum',
  'rhum-agricole': 'Rhum agricole',
  cachaca: 'Cachaça',
  bourbon: 'Bourbon',
  'rye-whiskey': 'Rye whiskey',
  scotch: 'Scotch',
  'irish-whiskey': 'Irish whiskey',
  'welsh-whisky': 'Welsh whisky',
  tequila: 'Tequila',
  mezcal: 'Mezcal',
  cognac: 'Cognac',
  brandy: 'Brandy',
}

/**
 * Short labels for use inside a sentence, where the link labels above would be
 * wrongly capitalised. Proper nouns keep their capital: "27 bourbon, 14 Scotch".
 */
export const MEMBER_SHORT: Record<string, string> = {
  "white-rum": "white rum",
  "dark-rum": "dark rum",
  "aged-rum": "aged rum",
  "spiced-rum": "spiced rum",
  "overproof-rum": "overproof",
  "rhum-agricole": "rhum agricole",
  cachaca: "cachaça",
  bourbon: "bourbon",
  "rye-whiskey": "rye",
  scotch: "Scotch",
  "irish-whiskey": "Irish",
  "welsh-whisky": "Welsh",
  tequila: "tequila",
  mezcal: "mezcal",
  cognac: "cognac",
  brandy: "other brandy",
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
  /** True for the six spirit rollups. False for styles and standalone spirits. */
  isRollup: boolean
  /** The raw baseSpirit values a spirit facet covers. Empty for a style. */
  members: string[]
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
 * Rollups are indexable whenever they hold anything, because they exist
 * precisely to answer the head term and are never thin by construction. A
 * standalone spirit carries no such exemption: champagne and non-alcoholic are
 * raw values that earn a page by clearing the floor, and would lose it if they
 * stopped clearing it.
 */
export function isIndexable(facet: Pick<Facet, 'value' | 'count' | 'isRollup'>): boolean {
  if (NEVER_INDEXED.has(facet.value)) return false
  if (facet.isRollup) return facet.count > 0
  return facet.count >= INDEXABLE_MIN_COCKTAILS
}

/** Which rollup, if any, a raw baseSpirit belongs to. Standalones are not rollups. */
export function rollupFor(baseSpirit: string): string | null {
  for (const [slug, { members }] of Object.entries(SPIRIT_ROLLUPS)) {
    if (members.includes(baseSpirit)) return slug
  }
  return null
}

/** Which spirit facet, if any, a raw baseSpirit belongs to, rollup or standalone. */
export function facetForBaseSpirit(baseSpirit: string): string | null {
  for (const [slug, { members }] of Object.entries(SPIRIT_FACETS)) {
    if (members.includes(baseSpirit)) return slug
  }
  return null
}

/** True when a facet covers more than one baseSpirit and so has styles to explain. */
export function hasSubTypes(facet: Pick<Facet, 'members'>): boolean {
  return facet.members.length > 1
}

/**
 * Facets that describe the same drinks as another facet.
 *
 * MEASURED: every one of the ten cocktails in the mocktails family is also
 * tagged non-alcoholic, and after the Michelada correction the two sets are
 * identical. Two indexable pages listing the same ten recipes compete with
 * each other and split whatever authority either would have earned.
 *
 * The duplicate keeps its URL, its grid and its links. It is noindexed and
 * canonicalises to the page it duplicates, which is what canonical is for. A
 * reader with the link still gets the drinks.
 *
 * non-alcoholic is the survivor rather than mocktails: it is the growing query,
 * and "mocktail" carries a diminutive the category has spent years shedding.
 */
export const DUPLICATE_OF: Record<string, { kind: FacetKind; value: string }> = {
  'style:mocktails': { kind: 'spirit', value: 'non-alcoholic' },
}

export function duplicateTarget(kind: FacetKind, value: string): { kind: FacetKind; value: string } | null {
  return DUPLICATE_OF[`${kind}:${value}`] ?? null
}

export function facetPath(kind: FacetKind, value: string, page = 1): string {
  const base = `/field-manual/cocktails/${kind}/${value}/`
  return page > 1 ? `${base}page/${page}/` : base
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / FACET_PAGE_SIZE))
}

/**
 * Whether a requested page number is real for a facet of this size.
 *
 * Number.isInteger comes first and is the point of the function. The page
 * number reaches the route as a string, so /page/abc/ arrives as NaN, and every
 * comparison against NaN is false: a bounds-only check passes it straight
 * through to an empty grid under a real-looking URL. That path was unreachable
 * while dynamicParams was false and became reachable when it had to be turned
 * on for the pages to serve at all.
 */
export function isValidPage(page: number, count: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= pageCount(count)
}

/**
 * Canonical URL for any facet page.
 *
 * Page 1 and pages 2+ are each self-canonical: later pages carry distinct
 * recipes, so pointing them at page 1 would ask Google to drop real content.
 * Non-indexable facets canonicalise up to the unfiltered hub instead.
 */
export function canonicalFor(facet: Pick<Facet, 'kind' | 'value' | 'count' | 'isRollup'>, page = 1): string {
  // A duplicate points at the facet it duplicates rather than at the hub: the
  // drinks are the same, so the other page is the better answer, not a broader
  // one. Page 1 of the target, because page 3 of a duplicate has no counterpart.
  const dupe = duplicateTarget(facet.kind, facet.value)
  if (dupe) return facetPath(dupe.kind, dupe.value)
  if (!isIndexable(facet)) return '/field-manual/cocktails/'
  return facetPath(facet.kind, facet.value, page)
}

/**
 * Whether a facet page is worth linking to and listing in the sitemap.
 *
 * Defined as "its own URL is its canonical" rather than as a second opinion
 * about thresholds, so it cannot drift from canonicalFor. A thin facet
 * canonicalises to the hub and a duplicate canonicalises to the facet it
 * duplicates; neither should be advertised, because a sitemap entry or a hub
 * link pointing at a URL that disclaims itself is a contradiction. Both stay
 * reachable through their own grids and stay `follow`.
 *
 * The sitemap, the hub link blocks and the cross-links on every cocktail page
 * all ask this one question, so the three cannot disagree about which pages
 * exist to be found.
 */
export function isSelfCanonical(
  facet: Pick<Facet, 'kind' | 'value' | 'count' | 'isRollup'>,
  page = 1
): boolean {
  return canonicalFor(facet, page) === facetPath(facet.kind, facet.value, page)
}

/**
 * robots directive for a facet page.
 *
 * A non-indexable facet is still followed: its cocktail links are real and
 * worth crawling even when the listing page itself should not rank.
 */
export function robotsFor(
  facet: Pick<Facet, 'kind' | 'value' | 'count' | 'isRollup'>
): { index: boolean; follow: boolean } {
  // A duplicate is never indexed, whatever its count. Its links are still
  // followed, because they lead to the same real recipes.
  if (duplicateTarget(facet.kind, facet.value)) return { index: false, follow: true }
  return { index: isIndexable(facet), follow: true }
}

/**
 * Page title. Pages 2+ are distinguished so no two pages share a title.
 * Comma rather than a dash: em-dashes are banned by VOICE.md, and a title is
 * customer-facing copy like any other.
 */
export function titleFor(facet: Pick<Facet, 'label' | 'kind'>, page = 1): string {
  const base = baseHeading(facet)
  return page > 1 ? `${base}, page ${page}` : base
}

/**
 * A style label is already the name of a family, so appending the noun gives
 * "Mocktails Cocktails" and "Flips Cocktails". A spirit label is an
 * ingredient and needs it: "Rum" alone does not name a page.
 *
 * Written copy overrides this on the 18 facets that have it. This is what the
 * other 13 render, and they are reachable even though they are noindexed.
 */
function baseHeading(facet: Pick<Facet, 'label' | 'kind'>): string {
  return facet.kind === 'style' ? facet.label : `${facet.label} Cocktails`
}

/**
 * The H1, which carries no count.
 *
 * Separate from the title tag so the two can differ: the title tag earns a
 * click in a results list and a number helps it, while the H1 names the page a
 * reader has already arrived on. Deriving both from one helper meant they could
 * never differ, which is why this exists.
 */
export function headingFor(facet: Pick<Facet, 'label' | 'kind'>, page = 1): string {
  const base = baseHeading(facet)
  return page > 1 ? `${base}, page ${page}` : base
}
