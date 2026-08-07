/**
 * The "Styles of X" block is the only route from a parent ingredient page down
 * to its sub-types. It renders on the parent pages and must render on no
 * others: an ingredient with no sub-types gets no heading, no panel and no
 * reserved space, because a "Styles of" heading over an empty list is worse
 * than nothing.
 *
 * The list is the reverse of the typed parent reference, resolved by the same
 * query that fetches the ingredient. It used to be reversed out of
 * relatedIngredients, which could not work: that field held sub-type-to-parent,
 * sibling-to-sibling and plain association links with no way to tell them
 * apart, and MEASURED, sweet-vermouth was referenced by fifteen ingredients
 * including gin, Aperol and Campari. Reversing it would have listed gin as a
 * style of vermouth.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const fetchMock = vi.fn()

vi.mock('@/sanity/lib/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}))

vi.mock('@/sanity/lib/image', () => ({
  urlFor: () => ({ url: () => 'https://cdn.sanity.io/images/stub.jpg' }),
}))

// Ordered as the query returns them, by name ascending.
const WHISKY_SUB_TYPES = [
  { _id: '1', name: 'Islay Scotch Whisky', slug: { current: 'islay-scotch-whisky' } },
  { _id: '2', name: 'Penderyn Welsh Whisky', slug: { current: 'penderyn' } },
  { _id: '3', name: 'Whiskey (Bourbon)', slug: { current: 'whiskey-bourbon' } },
  { _id: '4', name: 'Whiskey (Irish)', slug: { current: 'whiskey-irish' } },
  { _id: '5', name: 'Whiskey (Rye)', slug: { current: 'whiskey-rye' } },
  { _id: '6', name: 'Whisky (Japanese)', slug: { current: 'whisky-japanese' } },
  { _id: '7', name: 'Whisky (Scotch)', slug: { current: 'whisky-scotch' } },
]

function ingredientDoc(name: string, slug: string, subTypes?: typeof WHISKY_SUB_TYPES) {
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
    ...(subTypes ? { subTypes } : {}),
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
    fetchMock.mockResolvedValue(ingredientDoc('Whisky', 'whisky', WHISKY_SUB_TYPES))
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

  it('renders them in the order the query returned', async () => {
    fetchMock.mockResolvedValue(ingredientDoc('Whisky', 'whisky', WHISKY_SUB_TYPES))
    const html = await render('whisky')
    const positions = WHISKY_SUB_TYPES.map((s) => html.indexOf(`/field-manual/ingredients/${s.slug.current}"`))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('renders nothing at all for an ingredient with no sub-types', async () => {
    fetchMock.mockResolvedValue(ingredientDoc('Aperol', 'aperol'))
    const html = await render('aperol')

    expect(html).not.toContain('Styles of')
    // No orphan heading and no empty panel left behind.
    expect(html).not.toMatch(/<h2[^>]*>\s*Styles/)
  })

  it('renders nothing when the query returns an empty list rather than omitting it', async () => {
    fetchMock.mockResolvedValue(ingredientDoc('Aperol', 'aperol', []))
    const html = await render('aperol')

    expect(html).not.toContain('Styles of')
  })

  it('needs no query of its own, because the list comes back with the ingredient', async () => {
    fetchMock.mockResolvedValue(ingredientDoc('Whisky', 'whisky', WHISKY_SUB_TYPES))
    await render('whisky')

    // One fetch for the page. A second would mean the sub-types were being
    // resolved separately, which is what the projection exists to avoid.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
