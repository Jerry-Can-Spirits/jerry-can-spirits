/**
 * The "Styles of X" block is the only route from a parent ingredient page down
 * to its sub-types. It renders on six pages and must render on no others: an
 * ingredient with no sub-types gets no heading, no panel and no reserved
 * space, because a "Styles of" heading over an empty list is worse than
 * nothing.
 *
 * The block is driven by INGREDIENT_FAMILIES rather than by reversing
 * relatedIngredients, because that field does not record what kind of
 * relationship it holds. Reversing it would list gin, Aperol and Campari as
 * styles of sweet vermouth. The trade is that the map can drift from the
 * dataset, so the last test here holds it to the content.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { INGREDIENT_FAMILIES, subTypesOf, isParentIngredient } from '@/lib/ingredient-families'

const fetchMock = vi.fn()

vi.mock('@/sanity/lib/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}))

vi.mock('@/sanity/lib/image', () => ({
  urlFor: () => ({ url: () => 'https://cdn.sanity.io/images/stub.jpg' }),
}))

const WHISKY_SUB_TYPES = [
  { _id: '1', name: 'Whiskey (Bourbon)', slug: { current: 'whiskey-bourbon' } },
  { _id: '2', name: 'Whiskey (Irish)', slug: { current: 'whiskey-irish' } },
  { _id: '3', name: 'Whiskey (Rye)', slug: { current: 'whiskey-rye' } },
  { _id: '4', name: 'Whisky (Japanese)', slug: { current: 'whisky-japanese' } },
  { _id: '5', name: 'Whisky (Scotch)', slug: { current: 'whisky-scotch' } },
  { _id: '6', name: 'Islay Scotch Whisky', slug: { current: 'islay-scotch-whisky' } },
  { _id: '7', name: 'Penderyn Welsh Whisky', slug: { current: 'penderyn' } },
]

function ingredientDoc(name: string, slug: string) {
  return {
    _id: `ingredient-${slug}`,
    _createdAt: '2026-01-01T00:00:00Z',
    name,
    slug: { current: slug },
    category: 'spirits',
    description: 'An opening paragraph.',
    usage: 'Used in testing.',
    topTips: [],
    featured: false,
  }
}

async function render(slug: string) {
  const mod = await import('@/app/field-manual/ingredients/[slug]/page')
  const element = await mod.default({ params: Promise.resolve({ slug }) })
  return renderToStaticMarkup(element)
}

describe('Styles of {parent}', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('renders every one of the seven whisky sub-types as a link', async () => {
    fetchMock.mockImplementation((query: string) =>
      Promise.resolve(query.includes('slug.current in $slugs') ? WHISKY_SUB_TYPES : ingredientDoc('Whisky', 'whisky'))
    )
    const html = await render('whisky')

    expect(html).toContain('Styles of whisky')
    for (const subType of WHISKY_SUB_TYPES) {
      // Matched without the trailing slash: the template writes one, but
      // next/link normalises it away when rendered outside the Next runtime,
      // where trailingSlash: true does not apply. Asserting on it here would
      // be testing the harness rather than the page.
      expect(html, `missing link to ${subType.slug.current}`).toContain(
        `href="/field-manual/ingredients/${subType.slug.current}"`
      )
      expect(html).toContain(subType.name)
    }
  })

  it('lists them in family order rather than the order the query returned', async () => {
    fetchMock.mockImplementation((query: string) =>
      Promise.resolve(
        query.includes('slug.current in $slugs')
          ? [...WHISKY_SUB_TYPES].reverse()
          : ingredientDoc('Whisky', 'whisky')
      )
    )
    const html = await render('whisky')
    const positions = WHISKY_SUB_TYPES.map((s) => html.indexOf(`/field-manual/ingredients/${s.slug.current}/`))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('renders nothing at all for an ingredient with no sub-types', async () => {
    fetchMock.mockResolvedValue(ingredientDoc('Aperol', 'aperol'))
    const html = await render('aperol')

    expect(html).not.toContain('Styles of')
    // No orphan heading and no empty panel left behind.
    expect(html).not.toMatch(/<h2[^>]*>\s*Styles/)
  })

  it('does not query for sub-types on a page that has none', async () => {
    fetchMock.mockResolvedValue(ingredientDoc('Aperol', 'aperol'))
    await render('aperol')

    const subTypeQueries = fetchMock.mock.calls.filter(
      ([q]) => typeof q === 'string' && q.includes('slug.current in $slugs')
    )
    expect(subTypeQueries).toHaveLength(0)
  })
})

describe('the family map', () => {
  it('names six parents', () => {
    expect(Object.keys(INGREDIENT_FAMILIES).sort()).toEqual([
      'bitters',
      'rum',
      'sherry',
      'syrup',
      'vermouth',
      'whisky',
    ])
  })

  it('treats a page with no sub-types as not a parent', () => {
    expect(isParentIngredient('aperol')).toBe(false)
    expect(subTypesOf('aperol')).toEqual([])
    expect(isParentIngredient('whisky')).toBe(true)
  })

  it('never files a parent under another parent', () => {
    const parents = new Set(Object.keys(INGREDIENT_FAMILIES))
    for (const subs of Object.values(INGREDIENT_FAMILIES)) {
      for (const sub of subs) expect(parents.has(sub)).toBe(false)
    }
  })

  it('files each sub-type under exactly one parent', () => {
    const seen = new Map<string, string>()
    for (const [parent, subs] of Object.entries(INGREDIENT_FAMILIES)) {
      for (const sub of subs) {
        expect(seen.has(sub), `${sub} is filed under both ${seen.get(sub)} and ${parent}`).toBe(false)
        seen.set(sub, parent)
      }
    }
  })
})
