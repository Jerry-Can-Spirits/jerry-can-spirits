// Which ingredient pages are parents, and which sub-types sit under them.
//
// This map is the source of truth for the relationship, and it is in code
// rather than derived from the dataset for a reason worth recording.
//
// Sub-types link up to their parent through relatedIngredients, which is also
// the field siblings use to link to each other, and which unrelated
// ingredients use to link to anything. The field does not record what kind of
// relationship it holds. MEASURED: sweet-vermouth is referenced by fifteen
// ingredients — dry-vermouth and fino-sherry, but also gin, Aperol, Campari,
// Cognac and Bénédictine. Reversing that field to find "styles of" would
// render "Styles of Sweet Vermouth: gin, Aperol, Campari", which is worse than
// rendering nothing. Parents also link nowhere themselves: whisky's
// relatedIngredients is null, so there is no downward link to read either.
//
// The honest fix is a typed parent reference on the ingredient schema, at
// which point this map is replaced by a one-line query and the relationship
// becomes editable in Sanity rather than in a deploy. Until that exists the
// map is explicit, and tests hold its shape: no parent may be filed under
// another parent, and no sub-type under two parents. Those are structural
// checks, not dataset checks — the map is verified against live content by
// hand, and the reverse lookup was confirmed to return exactly these seven
// sub-types for whisky at the time of writing.

export const INGREDIENT_FAMILIES: Record<string, string[]> = {
  whisky: [
    'whiskey-bourbon',
    'whiskey-irish',
    'whiskey-rye',
    'whisky-japanese',
    'whisky-scotch',
    'islay-scotch-whisky',
    'penderyn',
  ],
  bitters: ['angostura-bitters', 'peychauds-bitters', 'orange-bitters', 'chocolate-bitters', 'celery-bitters'],
  vermouth: ['sweet-vermouth', 'dry-vermouth'],
  sherry: ['fino-sherry', 'amontillado-sherry', 'pedro-ximenez-sherry', 'oloroso-sherry', 'manzanilla-sherry'],
  rum: ['white-rum', 'dark-rum', 'aged-rum', 'spiced-rum', 'overproof-rum', 'blackstrap-rum', 'cachaca'],
  syrup: [
    'simple-syrup',
    'demerara-syrup',
    'orgeat-syrup',
    'honey-syrup',
    'honey-ginger-syrup',
    'agave-syrup',
    'cane-syrup',
    'maple-syrup',
    'vanilla-sugar-syrup',
    'passion-fruit-syrup',
    'raspberry-syrup',
    'strawberry-syrup',
    'apple-cider-syrup',
    'chocolate-syrup',
    'caramel-syrup',
    'cinnamon-syrup',
    'rose-syrup',
    'butterfly-pea-syrup',
  ],
}

/** The sub-type slugs filed under a parent, or an empty array for any other page. */
export function subTypesOf(slug: string): string[] {
  return INGREDIENT_FAMILIES[slug] ?? []
}

export function isParentIngredient(slug: string): boolean {
  return subTypesOf(slug).length > 0
}
