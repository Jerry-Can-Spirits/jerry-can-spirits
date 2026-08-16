import type { CocktailIndexItem } from './types'

// One-away cocktails grouped by the single bottle that would unlock them, so the
// UI can say "add X to make N more" instead of listing every near-miss flat.
export interface OneAwayGroup {
  missingId: string
  cocktails: CocktailIndexItem[]
}

export interface TwoAway {
  cocktail: CocktailIndexItem
  missingIds: string[] // exactly two
}

export interface MatchResult {
  makeable: CocktailIndexItem[]
  oneAway: OneAwayGroup[]
  twoAway: TwoAway[]
}

function byFewestThenName(a: CocktailIndexItem, b: CocktailIndexItem): number {
  return a.coreIngredientIds.length - b.coreIngredientIds.length || a.name.localeCompare(b.name)
}

/**
 * The bottles a bar answers for, which is more than the bottles it holds.
 *
 * A shelf with dark rum on it answers a recipe naming Gosling's, because the
 * person standing in front of it is going to pour their own rum whatever the
 * label on the recipe says.
 */
export function satisfiedBy(
  ownedIds: Set<string>,
  implies: Record<string, string[]> = {},
): Set<string> {
  const out = new Set(ownedIds)
  for (const id of ownedIds) for (const other of implies[id] ?? []) out.add(other)
  return out
}

// Pure. Assumed basics are already stripped from coreIngredientIds at index build,
// so this needs no special-casing. A cocktail with no core ingredients is makeable.
export function match(
  ownedIds: Set<string>,
  index: CocktailIndexItem[],
  implies: Record<string, string[]> = {},
): MatchResult {
  const satisfied = satisfiedBy(ownedIds, implies)
  const makeable: CocktailIndexItem[] = []
  const oneAwayById = new Map<string, CocktailIndexItem[]>()
  const twoAway: TwoAway[] = []

  for (const cocktail of index) {
    const missing = cocktail.coreIngredientIds.filter((id) => !satisfied.has(id))
    if (missing.length === 0) {
      makeable.push(cocktail)
    } else if (missing.length === 1) {
      const list = oneAwayById.get(missing[0])
      if (list) list.push(cocktail)
      else oneAwayById.set(missing[0], [cocktail])
    } else if (missing.length === 2) {
      twoAway.push({ cocktail, missingIds: missing })
    }
  }

  makeable.sort(byFewestThenName)

  // Biggest unlock first; missingId tiebreak keeps ordering deterministic.
  const oneAway: OneAwayGroup[] = Array.from(oneAwayById.entries())
    .map(([missingId, cocktails]) => ({ missingId, cocktails: cocktails.sort(byFewestThenName) }))
    .sort((a, b) => b.cocktails.length - a.cocktails.length || a.missingId.localeCompare(b.missingId))

  twoAway.sort((a, b) => byFewestThenName(a.cocktail, b.cocktail))

  return { makeable, oneAway, twoAway }
}
