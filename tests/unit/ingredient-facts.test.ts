/**
 * The ingredient Facts fields (P1 of the ingredient programme, 10 Oct 2026).
 *
 * The allergen line is the one with a trap in it: an unchecked ingredient must
 * say nothing, so that "none" and "not checked" can never be confused. The page
 * tests render the real component with a stubbed Sanity fetch, as
 * image-placeholder.test.ts does, so they assert against the HTML a reader gets.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { allergenLine, formatAbv, legalCategoryLabel, ALLERGENS } from '@/lib/ingredient-facts'

const fetchMock = vi.fn()

vi.mock('@/sanity/lib/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}))

vi.mock('@/sanity/lib/image', () => ({
  urlFor: () => ({ url: () => 'https://cdn.sanity.io/images/stub.jpg' }),
}))

describe('allergenLine', () => {
  it('says nothing until the allergens have been reviewed', () => {
    expect(allergenLine({})).toBeUndefined()
    expect(allergenLine({ allergens: [] })).toBeUndefined()
    expect(allergenLine({ allergens: ['milk'], allergensReviewed: false })).toBeUndefined()
  })

  it('states none of the 14 when reviewed and empty', () => {
    expect(allergenLine({ allergensReviewed: true })).toBe('None of the 14 listed allergens.')
    expect(allergenLine({ allergens: [], allergensReviewed: true })).toBe('None of the 14 listed allergens.')
  })

  it('lists what it contains in the FSA order, by their full names', () => {
    expect(allergenLine({ allergens: ['sulphites', 'gluten', 'tree-nuts'], allergensReviewed: true })).toBe(
      'Contains: cereals containing gluten, tree nuts, sulphites.'
    )
  })

  it('appends the note, as a sentence', () => {
    expect(
      allergenLine({ allergens: ['sulphites'], allergensReviewed: true, allergenNote: 'recipes change; check the bottle' })
    ).toBe('Contains: sulphites. Recipes change; check the bottle.')
    expect(allergenLine({ allergensReviewed: true, allergenNote: 'Check the bottle.' })).toBe(
      'None of the 14 listed allergens. Check the bottle.'
    )
  })

  it('ignores a value that is not one of the 14', () => {
    expect(allergenLine({ allergens: ['nuts'], allergensReviewed: true })).toBe('None of the 14 listed allergens.')
  })

  it('carries exactly the UK 14', () => {
    expect(ALLERGENS).toHaveLength(14)
  })
})

describe('formatAbv', () => {
  it('prints one figure with ABV, to one decimal at most', () => {
    expect(formatAbv(40)).toBe('40% ABV')
    expect(formatAbv(44.7)).toBe('44.7% ABV')
    expect(formatAbv(16.25)).toBe('16.3% ABV')
    expect(formatAbv(0)).toBe('0% ABV')
  })

  it('prints nothing when unset', () => {
    expect(formatAbv(undefined)).toBeUndefined()
    expect(formatAbv(null)).toBeUndefined()
  })
})

describe('legalCategoryLabel', () => {
  it('names the category, and prints nothing for other or unset', () => {
    expect(legalCategoryLabel('spirit-drink')).toBe('Spirit drink')
    expect(legalCategoryLabel('aromatised-wine')).toBe('Aromatised wine')
    expect(legalCategoryLabel('other')).toBeUndefined()
    expect(legalCategoryLabel(undefined)).toBeUndefined()
  })
})

async function renderIngredient(doc: Record<string, unknown>) {
  fetchMock.mockResolvedValue(doc)
  const mod = await import('@/app/field-manual/ingredients/[slug]/page')
  const element = await mod.default({ params: Promise.resolve({ slug: 'test-ingredient' }) })
  return renderToStaticMarkup(element)
}

const base = {
  _id: 'ingredient-stub',
  _createdAt: '2026-01-01T00:00:00Z',
  name: 'Test Ingredient',
  slug: { current: 'test-ingredient' },
  category: 'liqueurs',
  description: 'A description that stands in for the opening paragraph.',
  usage: 'Used in testing.',
  topTips: [],
  featured: false,
}

describe('ingredient page facts panel', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('renders no panel, no allergen line and no house recipe when nothing is set', async () => {
    const html = await renderIngredient({ ...base })
    expect(html).not.toContain('Quick Facts')
    expect(html).not.toContain('Allergens')
    expect(html).not.toContain('House Recipe')
    expect(html).not.toContain('Possible Substitutions')
  })

  it('renders the structured facts with their notes', async () => {
    const html = await renderIngredient({
      ...base,
      abvPercent: 16.5,
      abvNote: 'Bottlings run 15 to 18%',
      legalCategory: 'aromatised-wine',
      legalNote: 'Wine-based, so it keeps like wine',
      keepsFor: 'One month refrigerated',
      storage: 'In the fridge once opened.',
      allergens: ['sulphites'],
      allergensReviewed: true,
      allergenNote: 'Recipes change; check the bottle',
    })
    expect(html).toContain('Quick Facts')
    expect(html).toContain('16.5% ABV')
    expect(html).toContain('Bottlings run 15 to 18%')
    expect(html).toContain('Aromatised wine')
    expect(html).toContain('Wine-based, so it keeps like wine')
    expect(html).toContain('One month refrigerated')
    expect(html).toContain('In the fridge once opened.')
    expect(html).toContain('Contains: sulphites. Recipes change; check the bottle.')
  })

  it('states a reviewed, allergen-free ingredient as such', async () => {
    const html = await renderIngredient({ ...base, allergens: [], allergensReviewed: true })
    expect(html).toContain('None of the 14 listed allergens.')
  })

  it('says nothing about allergens that have not been reviewed', async () => {
    const html = await renderIngredient({ ...base, abvPercent: 40, allergens: [] })
    expect(html).toContain('Quick Facts')
    expect(html).not.toContain('allergens')
    expect(html).not.toContain('Allergens')
  })

  it('falls back to the legacy abv and shelf life until the migration', async () => {
    const html = await renderIngredient({ ...base, abv: 'Typically 37.5 to 40%', shelfLife: 'Years, sealed' })
    expect(html).toContain('Typically 37.5 to 40%')
    expect(html).toContain('Years, sealed')
  })

  it('prefers the structured fields over the legacy ones', async () => {
    const html = await renderIngredient({
      ...base,
      abvPercent: 40,
      abv: 'Typically 37.5 to 40%',
      keepsFor: 'Two years opened',
      shelfLife: 'Indefinite',
    })
    expect(html).toContain('40% ABV')
    expect(html).not.toContain('Typically 37.5 to 40%')
    expect(html).toContain('Two years opened')
    expect(html).not.toContain('Indefinite')
  })

  it('renders no stored price, even where a document still holds one', async () => {
    const html = await renderIngredient({ ...base, rrp: 45, recommendedBrands: { budget: 'A', premium: 'B' } })
    expect(html).not.toContain('RRP')
    expect(html).not.toContain('£45')
    expect(html).not.toContain('Budget Choice')
    expect(html).not.toContain('Premium Choice')
    expect(html).not.toContain('Recommended Brand')
  })
})

describe('ingredient page substitutes and house recipe', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('links each substitute to its page, with its note', async () => {
    const html = await renderIngredient({
      ...base,
      substitutes: [
        { note: 'use two thirds the measure', ingredient: { _id: 'a', name: 'Rich Syrup', slug: { current: 'rich-syrup' } } },
      ],
      substitutions: ['Legacy string that should not show'],
    })
    // next/link drops the trailing slash outside the Next runtime.
    expect(html).toContain('href="/field-manual/ingredients/rich-syrup')
    expect(html).toContain('Rich Syrup')
    expect(html).toContain('use two thirds the measure')
    expect(html).not.toContain('Legacy string that should not show')
  })

  it('keeps the legacy substitutions until the structured field is filled', async () => {
    const html = await renderIngredient({ ...base, substitutions: ['Demerara syrup'] })
    expect(html).toContain('Possible Substitutions')
    expect(html).toContain('Demerara syrup')
  })

  it('renders the house recipe when there is one', async () => {
    const html = await renderIngredient({
      ...base,
      prep: {
        ratio: '1:1 by weight',
        ingredients: ['200g caster sugar', '200g water'],
        method: ['Warm the water.', 'Stir in the sugar until it dissolves.'],
        yield: 'About 300ml',
        keepsFor: 'Two weeks refrigerated',
        foodSafety: 'Bottle it in a sterilised bottle.',
      },
    })
    expect(html).toContain('House Recipe')
    expect(html).toContain('1:1 by weight')
    expect(html).toContain('200g caster sugar')
    expect(html).toContain('Stir in the sugar until it dissolves.')
    expect(html).toContain('About 300ml')
    expect(html).toContain('Two weeks refrigerated')
    expect(html).toContain('Bottle it in a sterilised bottle.')
    expect(html).toContain('href="#house-recipe"')
  })

  it('renders no house recipe block for an empty prep object', async () => {
    const html = await renderIngredient({ ...base, prep: { ratio: '' } })
    expect(html).not.toContain('House Recipe')
  })
})
