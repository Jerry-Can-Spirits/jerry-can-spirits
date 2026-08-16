import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  INTERCHANGEABLE_PARENTS,
  INTERCHANGEABLE_FAMILIES,
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

  // The shelf asks what is in the cupboard, not what the recipe deserves.
  //
  // "Fresh Lime Juice" is right on a Daiquiri page and wrong on a shelf label:
  // somebody holding a bottle of Funkin reads it as a bottle they do not have
  // and leaves it unticked, losing every drink that needs lime. The recipe still
  // says fresh, because in a Daiquiri it matters. Checked across the corpus: all
  // twelve names starting "Fresh" shorten without colliding with another
  // ingredient, and the shorter label fits the shelf better besides.
  const shelfLabel = (name: string) => name.replace(/^Fresh\s+/i, '')

  // Ingredients that can sit on a shelf (mapped to a shelf, not excluded).
  const shelvable: BarIngredient[] = ingredients
    .filter((i) => !excludedIds.has(i.id))
    .map((i) => {
      const shelf = shelfForCategory(i.category)
      if (!shelf) return null
      return {
        id: i.id,
        name: shelfLabel(i.name),
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

  // Within an interchangeable family, owning one bottle answers for all of
  // them. Membership is the parent chain up to a family root, so a bottle only
  // joins if the data says what it is a kind of.
  // The category has to hold the whole way up. Falernum is a liqueur that names
  // rum as its parent because it is made from rum, and Sloe Gin does the same
  // under Gin: without this guard a bottle of dark rum would answer for the
  // falernum in a Corn n' Oil.
  const rootOf = (ing: RawIngredient): string | null => {
    const seen = new Set<string>()
    let current: RawIngredient | undefined = ing
    while (current) {
      if (current.category !== ing.category) return null
      if (INTERCHANGEABLE_FAMILIES.has(current.slug)) return current.slug
      if (!current.parentSlug || seen.has(current.slug)) return null
      seen.add(current.slug)
      current = bySlug.get(current.parentSlug)
    }
    return null
  }

  const families = new Map<string, string[]>()
  for (const ing of ingredients) {
    if (!shelvableIds.has(ing.id)) continue
    const root = rootOf(ing)
    if (!root) continue
    families.set(root, [...(families.get(root) ?? []), ing.id])
  }

  const implies: Record<string, string[]> = {}
  for (const members of families.values()) {
    for (const id of members) {
      const others = members.filter((other) => other !== id)
      if (others.length) implies[id] = others
    }
  }

  const shelves: ShelfGroup[] = SHELVES.map(({ id, label }) => {
    const ingredients = shelvable
      .filter((i) => i.shelf === id)
      .sort((a, b) => Number(b.common) - Number(a.common) || a.name.localeCompare(b.name))
    return { id, label, ingredients }
  })

  return { index, shelves, implies }
}
