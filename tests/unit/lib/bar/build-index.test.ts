import { describe, expect, it } from 'vitest'
import { buildBarData, type RawCocktail, type RawIngredient } from '@/lib/bar/build-index'

const INGREDIENTS: RawIngredient[] = [
  { id: 'gin', name: 'Gin', slug: 'gin', category: 'spirits' },
  { id: 'rum', name: 'White Rum', slug: 'white-rum', category: 'spirits' },
  // Vermouth carries the fortified category, which shelves it with the wines.
  { id: 'vermouth', name: 'Sweet Vermouth', slug: 'sweet-vermouth', category: 'fortified' },
  { id: 'champ', name: 'Champagne', slug: 'champagne', category: 'champagne' },
  { id: 'gingerbeer', name: 'Fever-Tree Ginger Beer', slug: 'fever-tree-ginger-beer', category: 'mixers' },
  { id: 'lime', name: 'Lime Juice', slug: 'lime-juice', category: 'fresh' },
  { id: 'water', name: 'Water', slug: 'water', category: 'mixers' },
  { id: 'ice', name: 'Ice', slug: 'ice', category: 'fresh' },
  { id: 'mint', name: 'Mint', slug: 'fresh-mint', category: 'garnishes' },
]

const COCKTAILS: RawCocktail[] = [
  { slug: 'gimlet', name: 'Gimlet', baseSpirit: 'gin', ingredientIds: ['gin', 'lime', 'water', 'ice'] },
  { slug: 'martini', name: 'Martini', baseSpirit: 'gin', ingredientIds: ['gin', 'vermouth', 'ice', 'mint', 'ghost'] },
  { slug: 'daiquiri', name: 'Daiquiri', baseSpirit: 'white-rum', ingredientIds: ['rum', 'lime'] },
  { slug: 'french-75', name: 'French 75', baseSpirit: 'gin', ingredientIds: ['gin', 'champ', 'lime'] },
]

describe('buildBarData', () => {
  it('strips assumed basics from each cocktail core', () => {
    const { index } = buildBarData(COCKTAILS, INGREDIENTS)
    const gimlet = index.find((c) => c.slug === 'gimlet')!
    expect(gimlet.coreIngredientIds.sort()).toEqual(['gin', 'lime'])
  })

  it('drops basics, garnish-category refs and dangling ids from the core', () => {
    // martini references ice (basic), mint (garnish category) and ghost (no such
    // ingredient) — the core is only the shelvable ingredients it needs.
    const { index } = buildBarData(COCKTAILS, INGREDIENTS)
    const martini = index.find((c) => c.slug === 'martini')!
    expect(martini.coreIngredientIds.sort()).toEqual(['gin', 'vermouth'])
  })

  it('excludes garnish-category ingredients from the shelves', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const all = shelves.flatMap((s) => s.ingredients.map((i) => i.id))
    expect(all).not.toContain('mint')
  })

  it('groups ingredients into shelves in display order', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    expect(shelves.map((s) => s.id)).toEqual(['spirits', 'wines-liqueurs', 'mixers', 'fresh', 'bitters'])
    expect(shelves.find((s) => s.id === 'spirits')!.ingredients.map((i) => i.id).sort()).toEqual(['gin', 'rum'])
  })

  it('marks curated household staples as common, not the most-used', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const spirits = shelves.find((s) => s.id === 'spirits')!.ingredients
    // gin is a curated default; the lime-juice slug is not in the default set.
    expect(spirits.find((i) => i.id === 'gin')!.common).toBe(true)
    const lime = shelves.find((s) => s.id === 'fresh')!.ingredients.find((i) => i.id === 'lime')!
    expect(lime.common).toBe(false)
  })

  it('keeps champagne-category ingredients shelvable and in the cocktail core', () => {
    const { index, shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const french75 = index.find((c) => c.slug === 'french-75')!
    expect(french75.coreIngredientIds).toContain('champ')
    const wines = shelves.find((s) => s.id === 'wines-liqueurs')!.ingredients.map((i) => i.id)
    expect(wines).toContain('champ')
  })

  it('applies the generic-name override, and shelves fortified vermouth with the wines', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const wines = shelves.find((s) => s.id === 'wines-liqueurs')!.ingredients
    const vermouth = wines.find((i) => i.id === 'vermouth')!
    expect(vermouth.vessel).toBe('wine')
    const mixers = shelves.find((s) => s.id === 'mixers')!.ingredients
    expect(mixers.find((i) => i.id === 'gingerbeer')!.name).toBe('Ginger Beer')
  })

  it('assigns a vessel shape to each ingredient', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const lime = shelves.find((s) => s.id === 'fresh')!.ingredients.find((i) => i.id === 'lime')!
    expect(lime.vessel).toBe('carton')
  })
})
