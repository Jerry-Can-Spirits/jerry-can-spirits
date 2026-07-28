import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  COMMON_DEFAULTS,
  INGREDIENT_OVERRIDES,
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
  const basicIds = new Set(
    ingredients.filter((i) => ASSUMED_BASIC_SLUGS.includes(i.slug)).map((i) => i.id),
  )

  // Ingredients that can sit on a shelf (mapped to a shelf, not an assumed
  // basic). Per-ingredient overrides tweak the display name, shelf or vessel.
  const shelvable: BarIngredient[] = ingredients
    .filter((i) => !basicIds.has(i.id))
    .map((i) => {
      const override = INGREDIENT_OVERRIDES[i.slug]
      const shelf = override?.shelf ?? shelfForCategory(i.category)
      if (!shelf) return null
      return {
        id: i.id,
        name: override?.displayName ?? i.name,
        slug: i.slug,
        category: i.category,
        shelf,
        vessel: override?.vessel ?? vesselForCategory(i.category),
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
    coreIngredientIds: Array.from(new Set(c.ingredientIds)).filter((id) => shelvableIds.has(id)),
  }))

  const shelves: ShelfGroup[] = SHELVES.map(({ id, label }) => {
    const ingredients = shelvable
      .filter((i) => i.shelf === id)
      .sort((a, b) => Number(b.common) - Number(a.common) || a.name.localeCompare(b.name))
    return { id, label, ingredients }
  })

  return { index, shelves }
}
