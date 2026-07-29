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

export interface IngredientOverride {
  displayName?: string
  shelf?: ShelfId
  vessel?: VesselType
}

// Per-ingredient overrides applied by the bar tool only; the wiki ingredient
// docs are untouched. displayName shows a branded mixer under its generic name
// so nobody thinks the exact brand is required (the cocktails reference the
// Fever-Tree slug, but the user just needs "ginger beer"). The shelf/vessel
// fields remain as an escape hatch for a mis-shelved ingredient — currently
// unused now that vermouth carries the correct `fortified` category.
export const INGREDIENT_OVERRIDES: Record<string, IngredientOverride> = {
  'fever-tree-premium-soda-water': { displayName: 'Soda Water' },
  // The cocktails reference the "refreshingly light" tonic, not the premium one,
  // so this is the slug that has to carry the generic "Tonic Water" name.
  'fever-tree-refreshingly-light-indian-tonic-water': { displayName: 'Tonic Water' },
  'fever-tree-madagascan-cola': { displayName: 'Cola' },
  'fever-tree-ginger-beer': { displayName: 'Ginger Beer' },
  'fever-tree-ginger-ale': { displayName: 'Ginger Ale' },
  'fever-tree-premium-lemonade': { displayName: 'Lemonade' },
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
  'fever-tree-premium-soda-water',
  'fever-tree-refreshingly-light-indian-tonic-water',
  'fever-tree-madagascan-cola',
  'fever-tree-ginger-beer',
  'fever-tree-ginger-ale',
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
