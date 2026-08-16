import { describe, expect, it } from 'vitest'
import { buildBarData, type RawCocktail, type RawIngredient } from '@/lib/bar/build-index'
import { match } from '@/lib/bar/match-engine'

const INGREDIENTS: RawIngredient[] = [
  { id: 'gin', name: 'Gin', slug: 'gin', category: 'spirits' },
  { id: 'rum', name: 'White Rum', slug: 'white-rum', category: 'spirits' },
  // Vermouth carries the fortified category, which shelves it with the wines.
  { id: 'vermouth', name: 'Sweet Vermouth', slug: 'sweet-vermouth', category: 'fortified' },
  { id: 'champ', name: 'Champagne', slug: 'champagne', category: 'champagne' },
  { id: 'gingerbeer', name: 'Ginger Beer', slug: 'ginger-beer', category: 'mixers' },
  // Branded product, hidden from the tool in favour of the generic it names as
  // its parent. The relationship comes from Sanity rather than a list in config.
  {
    id: 'ftgb',
    name: 'Fever-Tree Ginger Beer',
    slug: 'fever-tree-ginger-beer',
    category: 'mixers',
    parentSlug: 'ginger-beer',
  },
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
  // references the branded Fever-Tree ginger beer, not the generic
  { slug: 'mule', name: 'Mule', baseSpirit: 'rum', ingredientIds: ['rum', 'ftgb', 'lime'] },
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

  it('shelves fortified vermouth with the wines and hides aliased branded products', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const wines = shelves.find((s) => s.id === 'wines-liqueurs')!.ingredients
    expect(wines.find((i) => i.id === 'vermouth')!.vessel).toBe('wine')
    const mixers = shelves.find((s) => s.id === 'mixers')!.ingredients.map((i) => i.id)
    // the generic ginger beer shows; the branded Fever-Tree product does not
    expect(mixers).toContain('gingerbeer')
    expect(mixers).not.toContain('ftgb')
  })

  it('does not alias a mixer whose parent is a grouping rather than a generic', () => {
    // Eighteen syrups name Syrups as their parent. That is a shelf grouping,
    // not a substitution: orgeat is not maple syrup, and a Trinidad Sour is not
    // makeable by anyone holding any syrup. Only the parents on the
    // interchangeable list collapse.
    const ingredients = [
      { id: 'syrups', name: 'Syrups', slug: 'syrups', category: 'mixers' },
      { id: 'orgeat', name: 'Orgeat Syrup', slug: 'orgeat-syrup', category: 'mixers', parentSlug: 'syrups' },
      { id: 'maple', name: 'Maple Syrup', slug: 'maple-syrup', category: 'mixers', parentSlug: 'syrups' },
    ]
    const cocktails = [
      { slug: 'trinidad-sour', name: 'Trinidad Sour', baseSpirit: 'rye-whiskey', ingredientIds: ['orgeat'] },
    ]
    const { shelves, index } = buildBarData(cocktails, ingredients)
    const mixers = shelves.find((s) => s.id === 'mixers')!.ingredients.map((i) => i.id)
    expect(mixers).toContain('orgeat')
    expect(mixers).toContain('maple')
    // the recipe still asks for orgeat specifically, not "a syrup"
    expect(index[0].coreIngredientIds).toEqual(['orgeat'])
  })

  it('collapses gin styles into gin, so owning any gin makes a gin drink', () => {
    // Nobody buys London Dry and Old Tom so they can make a Tom Collins
    // correctly. The recipe still names the style it wants; the tool matches at
    // the family level.
    const ingredients = [
      { id: 'gin', name: 'Gin', slug: 'gin', category: 'spirits' },
      { id: 'oldtom', name: 'Old Tom Gin', slug: 'old-tom-gin', category: 'spirits', parentSlug: 'gin' },
    ]
    const cocktails = [
      { slug: 'martinez', name: 'Martinez', baseSpirit: 'gin', ingredientIds: ['oldtom'] },
    ]
    const { shelves, index } = buildBarData(cocktails, ingredients)
    const spirits = shelves.find((s) => s.id === 'spirits')!.ingredients.map((i) => i.id)
    expect(spirits).toContain('gin')
    expect(spirits).not.toContain('oldtom')
    expect(index[0].coreIngredientIds).toEqual(['gin'])
  })

  it('does not collapse sloe gin into gin, because it is a liqueur', () => {
    // Sloe Gin names Gin as its parent on the grounds that it is made from gin.
    // Collapsing it would tell someone holding London Dry that they can make a
    // Sloe Gin Fizz, so the categories have to agree before anything collapses.
    const ingredients = [
      { id: 'gin', name: 'Gin', slug: 'gin', category: 'spirits' },
      { id: 'sloe', name: 'Sloe Gin', slug: 'sloe-gin', category: 'liqueurs', parentSlug: 'gin' },
    ]
    const cocktails = [
      { slug: 'sloe-gin-fizz', name: 'Sloe Gin Fizz', baseSpirit: 'gin', ingredientIds: ['sloe'] },
    ]
    const { shelves, index } = buildBarData(cocktails, ingredients)
    const wines = shelves.find((s) => s.id === 'wines-liqueurs')!.ingredients.map((i) => i.id)
    expect(wines).toContain('sloe')
    expect(index[0].coreIngredientIds).toEqual(['sloe'])
  })

  it('aliases a branded mixer reference to its generic in the cocktail core', () => {
    // the Mule recipe names Fever-Tree ginger beer; owning the generic makes it
    const { index } = buildBarData(COCKTAILS, INGREDIENTS)
    const mule = index.find((c) => c.slug === 'mule')!
    expect(mule.coreIngredientIds).toContain('gingerbeer')
    expect(mule.coreIngredientIds).not.toContain('ftgb')
  })

  it('assigns a vessel shape to each ingredient', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const lime = shelves.find((s) => s.id === 'fresh')!.ingredients.find((i) => i.id === 'lime')!
    expect(lime.vessel).toBe('carton')
  })
})

describe('interchangeable families', () => {
  const FAMILY: RawIngredient[] = [
    { id: 'rum', name: 'Rum', slug: 'rum', category: 'spirits' },
    { id: 'dark', name: 'Dark Rum', slug: 'dark-rum', category: 'spirits', parentSlug: 'rum' },
    { id: 'gos', name: "Gosling's Black Seal", slug: 'goslings-black-seal', category: 'spirits', parentSlug: 'dark-rum' },
    // A liqueur made from rum. Names rum as its parent and is not a rum.
    { id: 'falernum', name: 'Falernum', slug: 'falernum', category: 'liqueurs', parentSlug: 'rum' },
    { id: 'ginger', name: 'Ginger Beer', slug: 'ginger-beer', category: 'mixers' },
  ]
  const DRINKS: RawCocktail[] = [
    { slug: 'dns', name: "Dark 'n' Stormy", baseSpirit: 'dark-rum', ingredientIds: ['gos', 'ginger'] },
    { slug: 'corn', name: "Corn n' Oil", baseSpirit: 'dark-rum', ingredientIds: ['dark', 'falernum'] },
  ]

  it('lets any rum answer for a recipe naming a specific one', () => {
    const { index, implies } = buildBarData(DRINKS, FAMILY)
    const owned = new Set(['dark', 'ginger'])
    const { makeable } = match(owned, index, implies)
    // The recipe names Gosling's; the shelf holds dark rum. That is a drink.
    expect(makeable.map((c) => c.slug)).toContain('dns')
  })

  it('does not let a rum answer for a liqueur made from rum', () => {
    const { index, implies } = buildBarData(DRINKS, FAMILY)
    const { makeable } = match(new Set(['dark']), index, implies)
    // Falernum is a liqueur. Owning dark rum is not owning falernum.
    expect(makeable.map((c) => c.slug)).not.toContain('corn')
  })

  it('leaves ingredients outside a family alone', () => {
    const { implies } = buildBarData(DRINKS, FAMILY)
    expect(implies.ginger).toBeUndefined()
  })
})
