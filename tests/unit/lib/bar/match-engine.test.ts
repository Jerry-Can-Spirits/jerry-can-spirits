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

  it('groups one-away cocktails by the single missing bottle', () => {
    const res = match(new Set(['gin', 'vermouth']), INDEX)
    expect(res.makeable.map((c) => c.slug)).toEqual(['martini'])
    const campari = res.oneAway.find((g) => g.missingId === 'campari')
    expect(campari?.cocktails.map((c) => c.slug)).toEqual(['negroni'])
  })

  it('aggregates cocktails under one missing bottle, biggest unlock first', () => {
    const res = match(new Set(['gin', 'lime', 'syrup', 'campari']), INDEX)
    // vermouth unlocks martini + negroni; rum unlocks only daiquiri
    expect(res.oneAway[0].missingId).toBe('vermouth')
    expect(res.oneAway[0].cocktails.map((c) => c.slug)).toEqual(['martini', 'negroni'])
    expect(res.oneAway[0].cocktails.length >= res.oneAway[1].cocktails.length).toBe(true)
  })

  it('buckets cocktails missing exactly two bottles into twoAway with both ids', () => {
    const res = match(new Set(['gin']), INDEX)
    expect(res.makeable).toEqual([])
    expect(res.oneAway.map((g) => g.missingId)).toEqual(['vermouth']) // martini
    expect(res.twoAway.map((t) => t.cocktail.slug)).toEqual(['gimlet', 'negroni'])
    const gimlet = res.twoAway.find((t) => t.cocktail.slug === 'gimlet')
    expect([...(gimlet?.missingIds ?? [])].sort()).toEqual(['lime', 'syrup'])
  })

  it('excludes cocktails missing three or more from every tier', () => {
    const res = match(new Set([]), INDEX)
    expect(res.makeable).toEqual([])
    expect(res.oneAway).toEqual([])
    // only the two-ingredient Martini is within two of an empty bar
    expect(res.twoAway.map((t) => t.cocktail.slug)).toEqual(['martini'])
  })

  it('does not list a cocktail in more than one tier', () => {
    const res = match(new Set(['gin', 'vermouth', 'campari']), INDEX)
    const seen = new Set<string>()
    res.makeable.forEach((c) => seen.add(c.slug))
    res.oneAway.forEach((g) => g.cocktails.forEach((c) => expect(seen.has(c.slug)).toBe(false)))
    res.oneAway.forEach((g) => g.cocktails.forEach((c) => seen.add(c.slug)))
    res.twoAway.forEach((t) => expect(seen.has(t.cocktail.slug)).toBe(false))
  })

  it('orders makeable by fewest ingredients then name', () => {
    const res = match(new Set(['gin', 'vermouth', 'lime', 'syrup', 'rum', 'campari']), INDEX)
    expect(res.makeable.map((c) => c.slug)).toEqual(['martini', 'daiquiri', 'gimlet', 'negroni'])
  })
})
