import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  INTERCHANGEABLE_MIXER_PARENTS,
  COMMON_DEFAULTS,
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
  /** The generic this is a brand of, where one is set. */
  parentSlug?: string | null
}

export function buildBarData(cocktails: RawCocktail[], ingredients: RawIngredient[]): BarData {
  const idBySlug = new Map(ingredients.map((i) => [i.slug, i.id]))

  // A branded mixer is one that names a generic as its parent — Fever-Tree
  // Premium Soda Water under Soda Water, and so on. That relationship lives in
  // Sanity rather than in a list here, so a product added next year is handled
  // the day it is parented instead of the day somebody remembers this file.
  //
  // Restricted to mixers on purpose. Spirits carry the same parent field for
  // taxonomy — London Dry Gin under Gin — and aliasing those would quietly make
  // the tool answer a different question, treating any gin as any other.
  const aliasedMixers = ingredients.filter(
    (i) =>
      i.category === 'mixers' &&
      i.parentSlug &&
      INTERCHANGEABLE_MIXER_PARENTS.has(i.parentSlug) &&
      idBySlug.has(i.parentSlug),
  )

  // Branded ingredient id -> generic ingredient id, so a recipe that references a
  // specific product still matches when the user owns the generic bottle.
  const aliasIds = new Map<string, string>(
    aliasedMixers.map((i) => [i.id, idBySlug.get(i.parentSlug as string) as string]),
  )

  // Branded mixers are hidden from the shelf in favour of their generic. Assumed
  // basics are dropped too; they never block a match.
  const basics = new Set(ASSUMED_BASIC_SLUGS)
  const excludedIds = new Set([
    ...ingredients.filter((i) => basics.has(i.slug)).map((i) => i.id),
    ...aliasIds.keys(),
  ])

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
