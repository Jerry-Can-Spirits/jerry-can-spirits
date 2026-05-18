// Curated allow-list of Sanity cocktail slugs surfaced as trade cocktail cards.
// Order here is the order they render in the listing.
// To add a new card: add the cocktail's Sanity slug, ensure baseSpirit is set,
// confirm the cocktail document has an image, ingredients, and instructions.

export const TRADE_COCKTAIL_SLUGS = [
  'storm-and-spice',
  'explorers-gold-rum-and-honey',
  'the-old-standard',
  'jerry-can-julep',
] as const

export type TradeCocktailSlug = (typeof TRADE_COCKTAIL_SLUGS)[number]

export function isTradeCocktailSlug(s: string): s is TradeCocktailSlug {
  return (TRADE_COCKTAIL_SLUGS as readonly string[]).includes(s)
}
