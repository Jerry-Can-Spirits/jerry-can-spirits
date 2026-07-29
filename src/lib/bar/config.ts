import type { ShelfId, VesselType } from './types'

export const SHELVES: { id: ShelfId; label: string }[] = [
  { id: 'spirits', label: 'Spirits' },
  { id: 'wines-liqueurs', label: 'Wines & Liqueurs' },
  { id: 'mixers', label: 'Mixers & syrups' },
  { id: 'fresh', label: 'Fresh & juice' },
  { id: 'bitters', label: 'Bitters & aromatics' },
]

// Ingredient category -> shelf. Categories absent here (garnishes) are excluded.
export const CATEGORY_TO_SHELF: Record<string, ShelfId> = {
  spirits: 'spirits',
  liqueurs: 'wines-liqueurs',
  'creme-liqueurs': 'wines-liqueurs',
  'anise-herbal': 'wines-liqueurs',
  wine: 'wines-liqueurs',
  // The Champagne ingredient carries its own `champagne` category; without this
  // it would be non-shelvable and silently drop out of every sparkling cocktail.
  champagne: 'wines-liqueurs',
  fortified: 'wines-liqueurs',
  mixers: 'mixers',
  fresh: 'fresh',
  bitters: 'bitters',
  aromatics: 'bitters',
}

// Ingredient category -> bottle silhouette shape.
export const CATEGORY_TO_VESSEL: Record<string, VesselType> = {
  spirits: 'spirit',
  wine: 'wine',
  champagne: 'wine',
  fortified: 'wine',
  liqueurs: 'liqueur',
  'creme-liqueurs': 'liqueur',
  'anise-herbal': 'liqueur',
  fresh: 'carton',
  mixers: 'can',
  bitters: 'dash',
  aromatics: 'dash',
}

// Branded soft-drink products aliased to a generic ingredient in the tool only.
// Recipes still reference the specific product a serve intends (a signature keeps
// its Fever-Tree pairing); the tool shows one generic bottle per mixer and treats
// it as satisfying any of these, so owning "Ginger Beer" makes both the branded
// serve and the generic classic. The branded key is hidden from the shelf; the
// generic value is shown. Specialty sodas with no generic are left untouched.
export const MIXER_ALIASES: Record<string, string> = {
  'fever-tree-premium-soda-water': 'soda-water',
  'fever-tree-refreshingly-light-indian-tonic-water': 'tonic-water',
  'fever-tree-madagascan-cola': 'cola',
  'fever-tree-ginger-beer': 'ginger-beer',
  'fever-tree-ginger-ale': 'ginger-ale',
  'fever-tree-premium-lemonade': 'lemonade',
  'fever-tree-sicilian-lemonade': 'lemonade',
}

// Quick-start bottles shown lit-ready on each shelf: the bottles a typical home
// bar actually holds. Curated by slug rather than derived by recipe frequency,
// which over-rewards cocktail-darlings (Benedictine, Cognac, Chartreuse) that
// few homes stock. The set is also seeded so the drinks people recognise —
// Daiquiri, Margarita, Cosmopolitan, Long Island Iced Tea, Woo Woo, Hurricane,
// Piña Colada — are all buildable straight from the defaults, giving a new
// visitor an early win and a nudge toward the next bottle. Everything else stays
// one tap away via search.
export const COMMON_DEFAULTS: ReadonlySet<string> = new Set([
  // Spirits
  'gin',
  'vodka',
  'white-rum',
  'dark-rum',
  'spiced-rum',
  'whiskey-bourbon',
  'whisky-scotch',
  'tequila',
  // Wines & liqueurs
  'triple-sec',
  'sweet-vermouth',
  'dry-vermouth',
  'campari',
  'aperol',
  'prosecco',
  'peach-schnapps',
  // Mixers & syrups
  'soda-water',
  'tonic-water',
  'cola',
  'ginger-beer',
  'ginger-ale',
  'simple-syrup',
  'grenadine',
  'passion-fruit-syrup',
  // Fresh & juice
  'fresh-lime-juice',
  'fresh-lemon-juice',
  'fresh-orange-juice',
  'fresh-cranberry-juice',
  'fresh-pineapple-juice',
  'fresh-mint',
  // Bitters
  'angostura-bitters',
])

// Every bar is assumed to have these; they never count against a match.
// Confirm these slugs exist in Sanity before relying on them.
export const ASSUMED_BASIC_SLUGS: string[] = ['water', 'ice', 'hot-water']

export function shelfForCategory(category: string): ShelfId | null {
  return CATEGORY_TO_SHELF[category] ?? null
}

export function vesselForCategory(category: string): VesselType {
  return CATEGORY_TO_VESSEL[category] ?? 'spirit'
}
