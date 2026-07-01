import { describe, it, expect } from 'vitest'
import { parseTags, ALLERGENS, DIETARY, cocktailAllergenInfo } from '@/lib/pouriq/allergens'

describe('constants', () => {
  it('has 14 allergens and 2 dietary keys', () => {
    expect(ALLERGENS).toHaveLength(14)
    expect(DIETARY).toEqual(['vegetarian', 'vegan'])
  })
})

describe('parseTags', () => {
  it('valid, empty, malformed', () => {
    expect(parseTags('["milk","gluten"]')).toEqual(['milk', 'gluten'])
    expect(parseTags('[]')).toEqual([])
    expect(parseTags('not json')).toEqual([])
    expect(parseTags('{}')).toEqual([])
  })
})

describe('cocktailAllergenInfo', () => {
  const ing = (allergens: string[], dietary: string[], reviewed: number) => ({
    library: {
      allergens: JSON.stringify(allergens),
      dietary: JSON.stringify(dietary),
      allergens_reviewed: reviewed,
    },
  })

  it('unions allergens and needs full review', () => {
    const r = cocktailAllergenInfo([ing(['milk'], ['vegetarian'], 1), ing(['sulphites'], ['vegetarian'], 1)])
    expect(r.contains).toEqual(['milk', 'sulphites'])
    expect(r.reviewed).toBe(true)
    expect(r.vegetarian).toBe(true)
  })

  it('any unreviewed ingredient blocks reviewed + all claims', () => {
    const r = cocktailAllergenInfo([ing(['milk'], ['vegan'], 1), ing([], [], 0)])
    expect(r.reviewed).toBe(false)
    expect(r.vegan).toBe(false)
    expect(r.vegetarian).toBe(false)
    expect(r.glutenFree).toBe(false)
  })

  it('vegan implies vegetarian; gluten blocks GF', () => {
    const r = cocktailAllergenInfo([ing([], ['vegan'], 1)])
    expect(r.vegan).toBe(true)
    expect(r.vegetarian).toBe(true)
    expect(r.glutenFree).toBe(true)
    const g = cocktailAllergenInfo([ing(['gluten'], ['vegan'], 1)])
    expect(g.glutenFree).toBe(false)
  })

  it('empty drink is not reviewed and makes no positive claims', () => {
    const r = cocktailAllergenInfo([])
    expect(r.reviewed).toBe(false)
    expect(r.contains).toEqual([])
    expect(r.vegetarian).toBe(false)
    expect(r.vegan).toBe(false)
    expect(r.glutenFree).toBe(false)
  })
})
