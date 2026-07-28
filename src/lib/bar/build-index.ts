import { SHELVES, shelfForCategory, vesselForCategory, ASSUMED_BASIC_SLUGS } from './config'
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

const DEFAULT_COMMON_PER_SHELF = 8

export function buildBarData(
  cocktails: RawCocktail[],
  ingredients: RawIngredient[],
  commonPerShelf: number = DEFAULT_COMMON_PER_SHELF,
): BarData {
  const basicIds = new Set(
    ingredients.filter((i) => ASSUMED_BASIC_SLUGS.includes(i.slug)).map((i) => i.id),
  )

  // Ingredients that can sit on a shelf (mapped to a shelf, not an assumed basic).
  const shelvable: BarIngredient[] = ingredients
    .filter((i) => !basicIds.has(i.id))
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
        common: false,
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

  // Frequency: how many cocktails need each shelvable ingredient.
  const frequency = new Map<string, number>()
  for (const item of index) {
    for (const id of item.coreIngredientIds) {
      frequency.set(id, (frequency.get(id) ?? 0) + 1)
    }
  }

  const shelves: ShelfGroup[] = SHELVES.map(({ id, label }) => {
    const members = shelvable.filter((i) => i.shelf === id)
    const topIds = new Set(
      [...members]
        .sort((a, b) => (frequency.get(b.id) ?? 0) - (frequency.get(a.id) ?? 0) || a.name.localeCompare(b.name))
        .slice(0, commonPerShelf)
        .map((i) => i.id),
    )
    const ingredients = members
      .map((i) => ({ ...i, common: topIds.has(i.id) }))
      .sort((a, b) => Number(b.common) - Number(a.common) || a.name.localeCompare(b.name))
    return { id, label, ingredients }
  })

  return { index, shelves }
}
