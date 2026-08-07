// The order categories appear in on the Field Manual hubs, and the headings
// they render under.
//
// Both hubs already grouped by category — `order(category asc, name asc)` —
// but `category asc` sorts the internal slug, so the reader got
// anise-herbal, aromatics, bitters, creme-liqueurs, fortified, fresh,
// garnishes, liqueurs, mixers, spirits, wine. Spirits, the group most people
// arrive looking for, was tenth of eleven; mixers, the largest at 90, was
// ninth. And because the hub rendered a flat grid with no headings, the
// grouping was invisible: an order with a reason behind it that no reader
// could infer, which is worse than no order at all.
//
// Ingredients run base spirit outward — what a drink is built on, what
// modifies it, what finishes it. Equipment runs by how much of the set each
// group accounts for, then by the order a drink is actually made in.
//
// The GROQ ranking below is generated from these arrays, so the sort and the
// headings cannot drift apart.

export const INGREDIENT_CATEGORY_ORDER = [
  'spirits',
  'liqueurs',
  'fortified',
  'bitters',
  'wine',
  'aromatics',
  'mixers',
  'fresh',
  'garnishes',
] as const

export const EQUIPMENT_CATEGORY_ORDER = [
  'glassware',
  'tools',
  'shaking',
  'straining',
  'measuring',
  'garnish',
] as const

export const INGREDIENT_CATEGORY_TITLES: Record<string, string> = {
  spirits: 'Spirits',
  liqueurs: 'Liqueurs',
  fortified: 'Fortified Wine',
  bitters: 'Bitters',
  wine: 'Wine & Champagne',
  aromatics: 'Aromatics & Essences',
  mixers: 'Mixers',
  fresh: 'Fresh Ingredients',
  garnishes: 'Garnishes',
}

export const EQUIPMENT_CATEGORY_TITLES: Record<string, string> = {
  glassware: 'Glassware',
  tools: 'Bar Tools',
  shaking: 'Shaking & Mixing',
  straining: 'Straining',
  measuring: 'Measuring',
  garnish: 'Garnish Tools',
}

/**
 * A GROQ expression ranking a document by its category, for use in an order
 * clause. Anything not listed sorts last rather than first, so a category
 * added to the schema and forgotten here appears at the end of the page
 * instead of silently displacing spirits from the top.
 */
export function categoryRank(order: readonly string[]): string {
  const cases = order.map((c, i) => `category == "${c}" => ${i}`).join(', ')
  return `select(${cases}, ${order.length})`
}

export function categoryTitle(titles: Record<string, string>, category: string): string {
  return titles[category] ?? category
}

/**
 * A GROQ expression ranking parent ingredients ahead of everything else in
 * their group, for use between the category rank and the name.
 *
 * Grouping alone puts Rum and Whisky in Spirits but leaves them at R and W
 * among thirty-five bottles. A parent is the page that explains the group and
 * links down into it, so it belongs at the top of the group rather than
 * wherever its initial happens to fall.
 *
 * Derived from the data — a parent is an ingredient something else is filed
 * under — so it needs no list to maintain and no flag to set. Expressed with
 * select() rather than a boolean because GROQ rejects `boolean desc` in an
 * order clause.
 */
export function parentFirstRank(): string {
  return 'select(count(*[_type == "ingredient" && parent._ref == ^._id]) > 0 => 0, 1)'
}
