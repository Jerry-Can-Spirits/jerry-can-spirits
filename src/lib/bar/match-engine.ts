import type { CocktailIndexItem } from './types'

export interface OneAway {
  cocktail: CocktailIndexItem
  missingId: string
}

export interface MatchResult {
  makeable: CocktailIndexItem[]
  oneAway: OneAway[]
}

// Pure. Assumed basics are already stripped from coreIngredientIds at index build,
// so this needs no special-casing. A cocktail with no core ingredients is makeable.
export function match(ownedIds: Set<string>, index: CocktailIndexItem[]): MatchResult {
  const makeable: CocktailIndexItem[] = []
  const oneAway: OneAway[] = []

  for (const cocktail of index) {
    const missing = cocktail.coreIngredientIds.filter((id) => !ownedIds.has(id))
    if (missing.length === 0) {
      makeable.push(cocktail)
    } else if (missing.length === 1) {
      oneAway.push({ cocktail, missingId: missing[0] })
    }
  }

  makeable.sort(
    (a, b) => a.coreIngredientIds.length - b.coreIngredientIds.length || a.name.localeCompare(b.name),
  )
  oneAway.sort((a, b) => a.cocktail.name.localeCompare(b.cocktail.name))

  return { makeable, oneAway }
}
