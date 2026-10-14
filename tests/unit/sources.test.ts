/**
 * Guides, ingredients and equipment list their sources so the reader can
 * check what they say. The list must read the accessed date as the day it was
 * stored, wherever the server runs, and must vanish rather than render an
 * empty heading when there is nothing to list. The page tests render the real
 * ingredient and equipment pages with a stubbed Sanity fetch, as
 * ingredient-facts.test.ts does.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Sources from '@/components/Sources'
import { checkedLine, formatAccessed, listableSources, sourceCitations, type Source } from '@/lib/sources'

const fetchMock = vi.fn()

vi.mock('@/sanity/lib/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}))

vi.mock('@/sanity/lib/image', () => ({
  urlFor: () => ({ url: () => 'https://cdn.sanity.io/images/stub.jpg' }),
}))

const IBA: Source = {
  title: 'Negroni',
  publisher: 'IBA',
  url: 'https://iba-world.com/negroni/',
  accessed: '2026-10-12',
}

describe('formatAccessed', () => {
  it('writes a Sanity date as an en-GB long date', () => {
    expect(formatAccessed('2026-10-12')).toBe('12 October 2026')
  })

  it('keeps the stored day at the edges of a month and year', () => {
    expect(formatAccessed('2026-01-01')).toBe('1 January 2026')
    expect(formatAccessed('2026-12-31')).toBe('31 December 2026')
  })
})

describe('the empty state', () => {
  it('renders nothing when a guide has no sources', () => {
    expect(Sources({ sources: [] })).toBeNull()
  })

  it('treats a missing field as no sources', () => {
    expect(listableSources(undefined)).toEqual([])
    expect(listableSources(null)).toEqual([])
  })

  it('renders the list when there is one', () => {
    expect(Sources({ sources: [IBA] })).not.toBeNull()
  })
})

describe('listableSources', () => {
  it('drops an entry the reader could not follow', () => {
    expect(
      listableSources([
        IBA,
        null,
        { ...IBA, url: 'javascript:alert(1)' },
        { ...IBA, title: '  ' },
        { ...IBA, publisher: undefined },
        { ...IBA, accessed: undefined },
      ]),
    ).toEqual([IBA])
  })
})

describe('sourceCitations', () => {
  it('cites each source as a CreativeWork with its publisher', () => {
    expect(sourceCitations([IBA])).toEqual([
      {
        '@type': 'CreativeWork',
        name: 'Negroni',
        url: 'https://iba-world.com/negroni/',
        publisher: { '@type': 'Organization', name: 'IBA' },
      },
    ])
  })
})

describe('checkedLine', () => {
  it('gives one date when every source was checked the same day', () => {
    expect(checkedLine([IBA, { ...IBA, url: 'https://iba-world.com/americano/' }])).toBe(
      'Correct as of 12 October 2026.',
    )
  })

  it('gives the span when sources were checked on different days', () => {
    expect(checkedLine([{ ...IBA, accessed: '2026-11-03' }, IBA])).toBe(
      'Checked between 12 October and 3 November 2026.',
    )
  })

  it('keeps both years when the span crosses a year', () => {
    expect(checkedLine([IBA, { ...IBA, accessed: '2027-01-05' }])).toBe(
      'Checked between 12 October 2026 and 5 January 2027.',
    )
  })
})

const FAQ = [{ question: 'How long does it keep?', answer: 'An answer that stands in for the real one.' }]

const pages = [
  {
    type: 'ingredient',
    path: '@/app/field-manual/ingredients/[slug]/page',
    doc: {
      _id: 'ingredient-stub',
      _createdAt: '2026-01-01T00:00:00Z',
      name: 'Test Ingredient',
      slug: { current: 'test-ingredient' },
      category: 'liqueurs',
      description: 'A description that stands in for the opening paragraph.',
      usage: 'Used in testing.',
      topTips: [],
      featured: false,
    },
  },
  {
    type: 'equipment',
    path: '@/app/field-manual/equipment/[slug]/page',
    doc: {
      _id: 'equipment-stub',
      _createdAt: '2026-01-01T00:00:00Z',
      name: 'Test Equipment',
      slug: { current: 'test-equipment' },
      category: 'essential',
      description: 'A description that stands in for the opening paragraph.',
      usage: 'Used in testing.',
      essential: false,
    },
  },
] as const

async function renderPage(path: string, doc: Record<string, unknown>) {
  fetchMock.mockResolvedValue(doc)
  const mod = path.includes('ingredients')
    ? await import('@/app/field-manual/ingredients/[slug]/page')
    : await import('@/app/field-manual/equipment/[slug]/page')
  const element = await mod.default({ params: Promise.resolve({ slug: 'test' }) })
  return renderToStaticMarkup(element)
}

describe.each(pages)('the $type page', ({ path, doc }) => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('lists its sources after the FAQs and cites them in the Article schema', async () => {
    const html = await renderPage(path, { ...doc, faqs: FAQ, sources: [IBA] })
    expect(html).toContain('Sources.</h2>')
    expect(html).toContain('href="https://iba-world.com/negroni/"')
    expect(html).toContain('Correct as of 12 October 2026.')
    expect(html).not.toContain('accessed')
    expect(html.indexOf('Sources.</h2>')).toBeGreaterThan(html.indexOf('Common Questions'))
    expect(html).toContain('"citation":[{"@type":"CreativeWork","name":"Negroni"')
  })

  it('renders no heading and no citation when it has none', async () => {
    for (const sources of [undefined, null, []]) {
      const html = await renderPage(path, { ...doc, faqs: FAQ, sources })
      expect(html).not.toContain('Sources.</h2>')
      expect(html).not.toContain('"citation"')
    }
  })
})
