/**
 * An image we did not take carries the owner's credit, set per image in Sanity
 * (e.g. "Image courtesy of Angostura®"). The credit renders as a caption under
 * the image only when filled, and our own images render exactly as before.
 *
 * These render the real page components to static markup with a stubbed
 * Sanity fetch, so they assert against the HTML a visitor and a crawler
 * receive. Removing the caption, or its guard, fails them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import GuideSections from '@/components/GuideSections'
import { imageWithCredit } from '@/lib/jsonLd'

const fetchMock = vi.fn()

vi.mock('@/sanity/lib/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}))

vi.mock('@/sanity/lib/image', () => ({
  urlFor: () => ({ url: () => 'https://cdn.sanity.io/images/stub.jpg' }),
  sanityOgUrl: (url: string | undefined) => url,
}))

const CREDIT = 'Image courtesy of Angostura®'

async function renderPage(
  mod: { default: (props: { params: Promise<{ slug: string }> }) => Promise<React.ReactElement> },
  slug: string
) {
  const element = await mod.default({ params: Promise.resolve({ slug }) })
  return renderToStaticMarkup(element)
}

const baseGuide = {
  _id: 'guide-stub',
  _createdAt: '2026-01-01T00:00:00Z',
  title: 'Test Guide',
  slug: { current: 'test-guide' },
  excerpt: 'An excerpt.',
  category: 'spirits',
  featured: false,
  isPillar: false,
  author: 'Jerry Can Spirits',
  introduction: 'An introduction that stands in for the opening paragraph.',
  sections: [],
  heroImage: 'https://cdn.sanity.io/images/hero.jpg',
  heroImageAlt: 'A hero image',
}

const baseIngredient = {
  _id: 'ingredient-stub',
  _createdAt: '2026-01-01T00:00:00Z',
  name: 'Test Ingredient',
  slug: { current: 'test-ingredient' },
  category: 'spirits',
  description: 'A description that stands in for the opening paragraph.',
  usage: 'Used in testing.',
  topTips: [],
  featured: false,
}

function stubGuide(guide: Record<string, unknown>) {
  fetchMock.mockImplementation((query: string) =>
    Promise.resolve(typeof query === 'string' && query.includes('_type == "guide" && slug.current == $slug') ? guide : {})
  )
}

describe('guide hero image credit', { timeout: 30000 }, () => {
  beforeEach(() => fetchMock.mockReset())

  it('shows the credit under the hero when filled, and as creditText in the Article schema', async () => {
    stubGuide({ ...baseGuide, heroImageCredit: CREDIT })
    const mod = await import('@/app/guides/[slug]/page')
    const html = await renderPage(mod, 'test-guide')

    expect(html).toContain(`<figcaption class="mt-2 text-xs text-parchment-400">${CREDIT}</figcaption>`)
    expect(html).toContain(`"creditText":"${CREDIT}"`)
  })

  it('renders no caption and a plain image URL when the credit is empty', async () => {
    stubGuide({ ...baseGuide })
    const mod = await import('@/app/guides/[slug]/page')
    const html = await renderPage(mod, 'test-guide')

    expect(html).toContain('hero.jpg')
    expect(html).not.toContain('<figcaption')
    expect(html).not.toContain('creditText')
  })
})

describe('guide section image', () => {
  const section = {
    heading: 'The range',
    content: 'Section body.',
  }

  it('renders the image with its alt text and credit after the heading', () => {
    const html = renderToStaticMarkup(
      createElement(GuideSections, {
        sections: [
          {
            ...section,
            image: {
              url: 'https://cdn.sanity.io/images/section.jpg',
              alt: 'Six bottles in a row',
              credit: CREDIT,
              dimensions: { width: 2400, height: 1600 },
            },
          },
        ],
      })
    )

    expect(html).toContain('alt="Six bottles in a row"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain(`<figcaption class="mt-2 text-xs text-parchment-400">${CREDIT}</figcaption>`)
    expect(html.indexOf('</h2>')).toBeLessThan(html.indexOf('<figure'))
    expect(html.indexOf('<figure')).toBeLessThan(html.indexOf('Section body.'))
  })

  it('renders no figure or caption when the section has no image', () => {
    const html = renderToStaticMarkup(createElement(GuideSections, { sections: [section] }))

    expect(html).not.toContain('<figure')
    expect(html).not.toContain('<figcaption')
    expect(html).toContain('Section body.')
  })

  it('renders an image without a caption when the credit is empty', () => {
    const html = renderToStaticMarkup(
      createElement(GuideSections, {
        sections: [{ ...section, image: { url: 'https://cdn.sanity.io/images/section.jpg', alt: 'Ours', credit: '  ' } }],
      })
    )

    expect(html).toContain('alt="Ours"')
    expect(html).not.toContain('<figcaption')
  })
})

describe('ingredient image credit', { timeout: 30000 }, () => {
  beforeEach(() => fetchMock.mockReset())

  it('shows the credit under the image when filled', async () => {
    fetchMock.mockResolvedValue({ ...baseIngredient, image: { asset: { url: 'x' }, alt: 'Stub', credit: CREDIT } })
    const mod = await import('@/app/field-manual/ingredients/[slug]/page')
    const html = await renderPage(mod, 'test-ingredient')

    expect(html).toContain(`<figcaption class="mt-2 text-xs text-parchment-400">${CREDIT}</figcaption>`)
    expect(html).toContain(`"creditText":"${CREDIT}"`)
  })

  it('renders the image with no caption when the credit is empty', async () => {
    fetchMock.mockResolvedValue({ ...baseIngredient, image: { asset: { url: 'x' }, alt: 'Stub' } })
    const mod = await import('@/app/field-manual/ingredients/[slug]/page')
    const html = await renderPage(mod, 'test-ingredient')

    expect(html).toContain('cdn.sanity.io')
    expect(html).not.toContain('<figcaption')
    expect(html).not.toContain('creditText')
  })
})

describe('imageWithCredit', () => {
  it('returns the URL unchanged when there is no credit', () => {
    expect(imageWithCredit('https://example.com/a.jpg', undefined)).toBe('https://example.com/a.jpg')
    expect(imageWithCredit(undefined, CREDIT)).toBeUndefined()
  })

  it('returns an ImageObject with creditText when credited', () => {
    expect(imageWithCredit('https://example.com/a.jpg', CREDIT)).toEqual({
      '@type': 'ImageObject',
      url: 'https://example.com/a.jpg',
      contentUrl: 'https://example.com/a.jpg',
      creditText: CREDIT,
    })
  })
})
