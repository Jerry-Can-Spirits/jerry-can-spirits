/**
 * The /offer/ landing page, rendered to the HTML a visitor receives with
 * Shopify and Sanity stubbed. It is an ad landing page: noindex, the C1
 * headline as the H1, one button, the live count, and the responsible-drinking
 * line. The guarantee slot stays out of the markup while its copy is empty.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ShopifyProduct } from '@/lib/shopify'

function product(handle: string, id: string, amount: string, quantityAvailable: number): ShopifyProduct {
  return {
    id: `gid://shopify/Product/${id}`,
    title: handle,
    handle,
    description: '',
    priceRange: { minVariantPrice: { amount, currencyCode: 'GBP' } },
    images: [{ url: `https://cdn.shopify.com/${handle}.jpg`, altText: null }],
    variants: [
      {
        id: `gid://shopify/ProductVariant/${id}`,
        title: 'Default Title',
        price: { amount, currencyCode: 'GBP' },
        availableForSale: true,
        quantityAvailable,
      },
    ],
  }
}

const catalogue: Record<string, ShopifyProduct> = {
  'expedition-spiced-rum-gift-boxed': product('expedition-spiced-rum-gift-boxed', '15828640039289', '41.99', 404),
  'jerry-can-spirits-expedition-spiced-rum': product('jerry-can-spirits-expedition-spiced-rum', '15224526569849', '40.00', 404),
}

vi.mock('@/lib/shopify', () => ({
  getProduct: async (handle: string) => catalogue[handle] ?? null,
}))

vi.mock('@/sanity/lib/client', () => ({
  client: {
    fetch: async () => [
      { _id: 'r1', _createdAt: '2026-09-01T00:00:00Z', quote: 'Smooth and warming.', author: 'A. Reader', rating: 5, order: 1 },
      { _id: 'r2', _createdAt: '2026-09-02T00:00:00Z', quote: 'Bought one as a gift and kept it.', author: 'B. Reader', rating: 5, order: 2 },
      { _id: 'r3', _createdAt: '2026-09-03T00:00:00Z', quote: 'Proper sipping rum.', author: 'C. Reader', rating: 4, order: 3 },
      { _id: 'r4', _createdAt: '2026-09-04T00:00:00Z', quote: 'A fourth that should not show.', author: 'D. Reader', rating: 5, order: 4 },
    ],
  },
}))

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({
    env: {
      SITE_OPS: {
        get: async (key: string) =>
          key === 'rating:trustpilot'
            ? { rating: 4.7, count: 37, fetchedAt: '2026-10-17T12:00:00Z', source: 'trustpilot' }
            : null,
      },
    },
  }),
}))

vi.mock('next/image', () => ({ default: () => null }))
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addToCart: async () => true, isLoading: false }),
}))

async function renderPage() {
  const mod = await import('@/app/offer/page')
  return { html: renderToStaticMarkup(await mod.default()), metadata: mod.metadata }
}

const text = (html: string) => html.replace(/<[^>]+>/g, ' ')

describe('/offer/', () => {
  it('is noindex', async () => {
    const { metadata } = await renderPage()
    expect(metadata.robots).toEqual({ index: false, follow: true })
  })

  it('opens with the C1 headline as the H1', async () => {
    const { html } = await renderPage()
    expect(html).toMatch(/<h1[^>]*>Gift boxed at the bottle price\. Until 31 October\.<\/h1>/)
  })

  it('has one button, which adds the gift-boxed bottle', async () => {
    const { html } = await renderPage()
    const buttons = html.match(/<button[^>]*>/g) ?? []
    expect(buttons).toHaveLength(1)
    expect(html).toContain('Add the gift-boxed bottle to your basket')
  })

  it('shows the live count read from the bottle, the proof lines and the footer line', async () => {
    const { html } = await renderPage()
    expect(html).toContain('Batch 001: 404 bottles left')
    expect(html).toContain('Every ingredient listed.')
    expect(html).toContain('Judged blind.')
    expect(html).toContain('Age-verified at your door.')
    expect(html).toContain('18+ only. Please enjoy responsibly.')
    expect(html).toContain('href="https://www.drinkaware.co.uk"')
  })

  it('states the live Trustpilot score above the button and the IWSC medals under the hero', async () => {
    const { html } = await renderPage()
    expect(html).toContain('4.7 / 5')
    expect(html).toContain('37 reviews on Trustpilot')
    expect(html.indexOf('reviews on Trustpilot')).toBeLessThan(html.indexOf('<button'))
    expect(html).toContain('aria-label="IWSC 2026 results"')
    expect(html).toContain('IWSC 2026 Bronze')
    expect(html).toContain('IWSC 2026 Silver')
    expect(html).toContain('href="https://www.iwsc.net/results/detail/172185/expedition-spiced-spiced-rum"')
  })

  it('quotes three reviews as written and no more', async () => {
    const { html } = await renderPage()
    expect(html).toContain('Smooth and warming.')
    expect(html).toContain('Proper sipping rum.')
    expect(html).not.toContain('A fourth that should not show.')
  })

  it('leaves the guarantee slot out while its copy is empty', async () => {
    const { html } = await renderPage()
    expect(html).not.toMatch(/guarantee/i)
  })

  it('renders no exclamation marks or em-dashes', async () => {
    const { html } = await renderPage()
    expect(text(html)).not.toMatch(/[—!]/)
  })
})
