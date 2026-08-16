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

// Parents that mean "any of these will do".
//
// A branded soda names its generic as parent — Fever-Tree Premium Soda Water
// under Soda Water — and owning the generic genuinely satisfies a recipe that
// named the brand. The tool hides the brand and matches on the generic.
//
// A parent is not always that relationship. Eighteen syrups name Syrups as
// their parent, which is a shelf grouping rather than a substitution: orgeat is
// not maple syrup, and treating a Trinidad Sour as makeable by anyone holding
// any syrup would be wrong.
//
// So the rule is a short list of parents that ARE drop-in generics, rather than
// a long list of the products beneath them. A new Fever-Tree tonic parented to
// Tonic Water is handled the day it is parented, with no change here.
//
// Gin is on the list and the other spirits are not, which is a judgement about
// how people actually stock a cupboard rather than about how different the
// liquids are. Nobody buys London Dry and Old Tom so they can make a Tom
// Collins correctly; plenty of people own white and spiced rum as separate
// bottles, and telling someone with only spiced rum that they can make a
// Daiquiri would be wrong. The recipe page still names the gin it wants, so the
// detail is not lost — it just stops standing between a home bar and a match.
export const INTERCHANGEABLE_PARENTS: ReadonlySet<string> = new Set([
  'soda-water',
  'tonic-water',
  'cola',
  'lemonade',
  'ginger-ale',
  'ginger-beer',
  'grapefruit-soda',
  'gin',
])

// Families where any bottle answers for any other, named by the slug at the top
// of the tree. Membership is the parent chain below that root, so a new rum
// added with a parent joins without a change here.
//
// This is a decision about the question the tool is answering. A Dark 'n'
// Stormy names Gosling's because the name is Gosling's trademark, and the
// recipe page says so. Almost nobody stands in their kitchen and clicks
// Gosling's: they click dark rum, ginger beer and lime, and they pour the rum
// they own. Holding the tool to the brand would answer a question no one asked
// and hide a drink they can plainly make.
//
// The same reasoning covers rye against bourbon. They are not interchangeable
// in a Manhattan and the page will say so; at home, on a Tuesday, the bottle on
// the shelf wins. Vermouth is deliberately absent: sweet and dry are not two
// versions of one thing, and a Martini poured with sweet vermouth is a
// different drink rather than a near miss.
export const INTERCHANGEABLE_FAMILIES: ReadonlySet<string> = new Set(['rum', 'whisky'])

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
