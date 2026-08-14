import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  INTERCHANGEABLE_PARENTS,
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

  // Ingredients that collapse into their parent for matching: a branded soda
  // into its generic, a gin style into gin. The relationship lives in Sanity
  // rather than in a list here, so a product added next year is handled the day
  // it is parented instead of the day somebody remembers this file.
  //
  // Two guards, and both are load-bearing. The parent has to be on the
  // interchangeable list, because most parents are groupings rather than
  // substitutions — eighteen syrups sit under Syrups and orgeat is not maple
  // syrup. And the categories have to match, because Sloe Gin sits under Gin on
  // the grounds that it is made from gin, while being a liqueur.
  const bySlug = new Map(ingredients.map((i) => [i.slug, i]))
  const collapsible = ingredients.filter((i) => {
    if (!i.parentSlug || !INTERCHANGEABLE_PARENTS.has(i.parentSlug)) return false
    const parent = bySlug.get(i.parentSlug)
    // Same category or it is not a substitution. Sloe Gin names Gin as its
    // parent because it is made from gin, and it is a liqueur: collapsing it
    // would tell someone holding a bottle of London Dry that they can make a
    // Sloe Gin Fizz.
    return Boolean(parent) && parent!.category === i.category
  })

  // Branded ingredient id -> generic ingredient id, so a recipe that references a
  // specific product still matches when the user owns the generic bottle.
  const aliasIds = new Map<string, string>(
    collapsible.map((i) => [i.id, idBySlug.get(i.parentSlug as string) as string]),
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
