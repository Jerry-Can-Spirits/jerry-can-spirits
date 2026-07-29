import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  COMMON_DEFAULTS,
  MIXER_ALIASES,
} from './config'
import type { BarData, BarIngredient, CocktailIndexItem, ShelfGroup } from './types'

export interface RawCocktail {
  slug: string
  name: string
  baseSpirit: string
  ingredientIds: string[]
}

export interface RawIngredient {
  id: string
  name: string
  slug: string
  category: string
}

export function buildBarData(cocktails: RawCocktail[], ingredients: RawIngredient[]): BarData {
  const idBySlug = new Map(ingredients.map((i) => [i.slug, i.id]))

  // Branded soft-drinks (the alias keys) are hidden from the shelf in favour of
  // their generic. Assumed basics are dropped too; they never block a match.
  const excludedSlugs = new Set([...ASSUMED_BASIC_SLUGS, ...Object.keys(MIXER_ALIASES)])
  const excludedIds = new Set(
    ingredients.filter((i) => excludedSlugs.has(i.slug)).map((i) => i.id),
  )

  // Branded ingredient id -> generic ingredient id, so a recipe that references a
  // specific product still matches when the user owns the generic bottle.
  const aliasIds = new Map<string, string>()
  for (const [brandedSlug, genericSlug] of Object.entries(MIXER_ALIASES)) {
    const brandedId = idBySlug.get(brandedSlug)
    const genericId = idBySlug.get(genericSlug)
    if (brandedId && genericId) aliasIds.set(brandedId, genericId)
  }

  // Ingredients that can sit on a shelf (mapped to a shelf, not excluded).
  const shelvable: BarIngredient[] = ingredients
    .filter((i) => !excludedIds.has(i.id))
    .map((i) => {
      const shelf = shelfForCategory(i.category)
      if (!shelf) return null
      return {
        id: i.id,
        name: i.name,
        slug: i.slug,
        category: i.category,
        shelf,
        vessel: vesselForCategory(i.category),
        common: COMMON_DEFAULTS.has(i.slug),
      }
    })
    .filter((x): x is BarIngredient => x !== null)
  const shelvableIds = new Set(shelvable.map((i) => i.id))

  // Compact index: a cocktail's core is exactly the shelvable ingredients it
  // needs. Assumed basics, garnish-category refs and dangling ids all fall away,
  // so a data glitch never leaves a cocktail permanently unmakeable.
  const index: CocktailIndexItem[] = cocktails.map((c) => ({
    slug: c.slug,
    name: c.name,
    baseSpirit: c.baseSpirit,
    // Alias branded soft-drinks to their generic before filtering, so owning the
    // generic bottle satisfies a recipe that names the specific product.
    coreIngredientIds: Array.from(
      new Set(c.ingredientIds.map((id) => aliasIds.get(id) ?? id)),
    ).filter((id) => shelvableIds.has(id)),
  }))

  const shelves: ShelfGroup[] = SHELVES.map(({ id, label }) => {
    const ingredients = shelvable
      .filter((i) => i.shelf === id)
      .sort((a, b) => Number(b.common) - Number(a.common) || a.name.localeCompare(b.name))
    return { id, label, ingredients }
  })

  return { index, shelves }
}
