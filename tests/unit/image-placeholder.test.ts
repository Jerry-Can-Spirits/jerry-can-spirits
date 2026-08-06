/**
 * Over half of the ingredient and equipment documents have no image. Both
 * templates used to fill that gap with a bordered panel reading "Image coming
 * soon", positioned directly beneath the opening paragraph — the copy an answer
 * engine lifts from the page. The fix renders nothing at all when there is no
 * image.
 *
 * These tests render the real page components to static markup with a stubbed
 * Sanity fetch, so they assert against the HTML a crawler receives rather than
 * against the source. Removing either conditional makes them fail: the first
 * assertion catches the placeholder copy, the second catches the empty panel
 * that guarding only the image (rather than the panel) would leave behind.
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

// The class that reserves the square of layout space for the image. It appears
// exactly once in each template, on the image container itself, so its presence
// in the markup of an imageless page is the reserved-empty-space failure. The
// panel's own gradient classes are shared with other cards and cannot be used.
const RESERVED_SPACE = 'aspect-square'

// The sidebar column that holds the panel. On a document with no image, no
// badge and no quick facts it must render completely empty — an opening tag
// followed immediately by its closing tag. This is the assertion that catches a
// guard placed on the image alone, which would leave the bordered panel behind.
const EMPTY_SIDEBAR = '<div class="lg:sticky lg:top-24 space-y-6"></div>'

async function renderPage(
  mod: { default: (props: { params: Promise<{ slug: string }> }) => Promise<React.ReactElement> },
  slug: string
) {
  const element = await mod.default({ params: Promise.resolve({ slug }) })
  return renderToStaticMarkup(element)
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

const baseEquipment = {
  _id: 'equipment-stub',
  _createdAt: '2026-01-01T00:00:00Z',
  name: 'Test Equipment',
  slug: { current: 'test-equipment' },
  category: 'essential',
  description: 'A description that stands in for the opening paragraph.',
  howToUse: 'Used in testing.',
  topTips: [],
  essential: false,
}

const IMAGE = { asset: { url: 'https://cdn.sanity.io/images/stub.jpg' }, alt: 'Stub' }

describe('ingredient page image placeholder', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('renders no placeholder and no empty panel when the document has no image', async () => {
    fetchMock.mockResolvedValue({ ...baseIngredient })
    const mod = await import('@/app/field-manual/ingredients/[slug]/page')
    const html = await renderPage(mod, 'test-ingredient')

    expect(html).not.toContain('Image coming soon')
    expect(html).not.toContain(RESERVED_SPACE)
    expect(html).toContain(EMPTY_SIDEBAR)
  })

  it('still renders the image and its panel when the document has one', async () => {
    fetchMock.mockResolvedValue({ ...baseIngredient, image: IMAGE })
    const mod = await import('@/app/field-manual/ingredients/[slug]/page')
    const html = await renderPage(mod, 'test-ingredient')

    expect(html).toContain(RESERVED_SPACE)
    expect(html).toContain('cdn.sanity.io')
    expect(html).not.toContain('Image coming soon')
  })

  it('keeps the featured badge panel when there is no image', async () => {
    fetchMock.mockResolvedValue({ ...baseIngredient, featured: true })
    const mod = await import('@/app/field-manual/ingredients/[slug]/page')
    const html = await renderPage(mod, 'test-ingredient')

    expect(html).toContain('Essential Ingredient')
    expect(html).not.toContain('Image coming soon')
  })
})

describe('equipment page image placeholder', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('renders no placeholder and no empty panel when the document has no image', async () => {
    fetchMock.mockResolvedValue({ ...baseEquipment })
    const mod = await import('@/app/field-manual/equipment/[slug]/page')
    const html = await renderPage(mod, 'test-equipment')

    expect(html).not.toContain('Image coming soon')
    expect(html).not.toContain(RESERVED_SPACE)
    expect(html).toContain(EMPTY_SIDEBAR)
  })

  it('still renders the image and its panel when the document has one', async () => {
    fetchMock.mockResolvedValue({ ...baseEquipment, image: IMAGE })
    const mod = await import('@/app/field-manual/equipment/[slug]/page')
    const html = await renderPage(mod, 'test-equipment')

    expect(html).toContain(RESERVED_SPACE)
    expect(html).toContain('cdn.sanity.io')
    expect(html).not.toContain('Image coming soon')
  })

  it('keeps the essential badge panel when there is no image', async () => {
    fetchMock.mockResolvedValue({ ...baseEquipment, essential: true })
    const mod = await import('@/app/field-manual/equipment/[slug]/page')
    const html = await renderPage(mod, 'test-equipment')

    expect(html).toContain('Essential Equipment')
    expect(html).not.toContain('Image coming soon')
  })
})
