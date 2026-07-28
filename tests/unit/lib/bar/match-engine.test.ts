import { describe, expect, it } from 'vitest'
import { match } from '@/lib/bar/match-engine'
import type { CocktailIndexItem } from '@/lib/bar/types'

const INDEX: CocktailIndexItem[] = [
  { slug: 'daiquiri', name: 'Daiquiri', baseSpirit: 'white-rum', coreIngredientIds: ['rum', 'lime', 'syrup'] },
  { slug: 'gimlet', name: 'Gimlet', baseSpirit: 'gin', coreIngredientIds: ['gin', 'lime', 'syrup'] },
  { slug: 'negroni', name: 'Negroni', baseSpirit: 'gin', coreIngredientIds: ['gin', 'campari', 'vermouth'] },
  { slug: 'martini', name: 'Martini', baseSpirit: 'gin', coreIngredientIds: ['gin', 'vermouth'] },
]

describe('match engine', () => {
  it('returns cocktails where every core ingredient is owned', () => {
    const res = match(new Set(['rum', 'lime', 'syrup']), INDEX)
    expect(res.makeable.map((c) => c.slug)).toEqual(['daiquiri'])
  })

  it('returns cocktails missing exactly one core ingredient, naming the missing id', () => {
    const res = match(new Set(['gin', 'vermouth']), INDEX)
    expect(res.makeable.map((c) => c.slug).sort()).toEqual(['martini'])
    const negroni = res.oneAway.find((o) => o.cocktail.slug === 'negroni')
    expect(negroni?.missingId).toBe('campari')
  })

  it('does not list a cocktail as both makeable and one-away', () => {
    const res = match(new Set(['gin', 'vermouth', 'campari']), INDEX)
    const makeableSlugs = new Set(res.makeable.map((c) => c.slug))
    expect(res.oneAway.some((o) => makeableSlugs.has(o.cocktail.slug))).toBe(false)
  })

  it('excludes cocktails missing two or more ingredients from both tiers', () => {
    const res = match(new Set(['gin']), INDEX)
    expect(res.makeable).toEqual([])
    expect(res.oneAway.map((o) => o.cocktail.slug).sort()).toEqual(['martini'])
  })

  it('orders makeable by fewest ingredients then name (deterministic)', () => {
    const res = match(new Set(['gin', 'vermouth', 'lime', 'syrup', 'rum', 'campari']), INDEX)
    expect(res.makeable.map((c) => c.slug)).toEqual(['martini', 'daiquiri', 'gimlet', 'negroni'])
  })
})
