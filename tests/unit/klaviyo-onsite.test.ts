/**
 * Klaviyo onsite events for the headless cart.
 *
 * Two things are worth pinning. The payload field names are Klaviyo's, not
 * ours: the abandoned-cart and browse-abandonment flow templates read
 * AddedItemProductName, Items[].ProductURL and so on by name, and a drifted key
 * fails silently as an empty email block. And the consent rule must match the
 * script loader exactly, because an event queued for a visitor who declined is
 * a GDPR problem the loader was written to prevent.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  addedToCartPayload,
  hasKlaviyoConsent,
  identifyKlaviyo,
  pushKlaviyo,
  trackAddedToCart,
  trackViewedProduct,
  viewedItemPayload,
  viewedProductPayload,
  type KlaviyoWindow,
} from '@/lib/klaviyo-onsite'
import type { Cart } from '@/lib/shopify'

const rum = {
  id: 'gid://shopify/Product/15224526569849',
  title: 'Jerry Can Spirits - Expedition Spiced Rum',
  handle: 'jerry-can-spirits-expedition-spiced-rum',
  price: '40.0',
  productType: 'Spirits',
  imageUrl: 'https://cdn.shopify.com/rum.jpg',
  compareAtPrice: null,
}

function cart(): Cart {
  return {
    id: 'gid://shopify/Cart/abc',
    checkoutUrl: 'https://shop.jerrycanspirits.co.uk/cart/c/abc',
    cost: {
      totalAmount: { amount: '47.5', currencyCode: 'GBP' },
      subtotalAmount: { amount: '47.5', currencyCode: 'GBP' },
    },
    lines: [
      {
        id: 'gid://shopify/CartLine/1',
        quantity: 1,
        merchandise: {
          id: 'gid://shopify/ProductVariant/56168995193209',
          title: 'Default Title',
          product: { id: 'gid://shopify/Product/15224526569849', title: 'Jerry Can Spirits - Expedition Spiced Rum', handle: 'jerry-can-spirits-expedition-spiced-rum', productType: 'Spirits' },
          image: { url: 'https://cdn.shopify.com/rum.jpg', altText: null },
          price: { amount: '40.0', currencyCode: 'GBP' },
        },
      },
      {
        id: 'gid://shopify/CartLine/2',
        quantity: 1,
        merchandise: {
          id: 'gid://shopify/ProductVariant/56256518193529',
          title: 'Default Title',
          product: { id: 'gid://shopify/Product/15245613269369', title: 'Jerry Can Spirits Bar Blade (Bottle Opener)', handle: 'bar-blade-bottle-opener', productType: 'Barware' },
          price: { amount: '7.5', currencyCode: 'GBP' },
        },
      },
    ],
  }
}

function win(consent: { marketing?: boolean; statistics?: boolean } | undefined, withSdk = true): KlaviyoWindow & { pushed: unknown[][] } {
  const pushed: unknown[][] = []
  return {
    pushed,
    ...(withSdk ? { klaviyo: { push: (args: unknown[]) => { pushed.push(args) } } } : {}),
    ...(consent ? { Cookiebot: { consent } } : {}),
  }
}

describe('Viewed Product', () => {
  it('uses the numeric product id, the canonical product URL and the brand', () => {
    const p = viewedProductPayload(rum)
    expect(p.ProductID).toBe('15224526569849')
    expect(p.URL).toBe('https://jerrycanspirits.co.uk/shop/product/jerry-can-spirits-expedition-spiced-rum/')
    expect(p.Brand).toBe('Jerry Can Spirits')
    expect(p.Price).toBe(40)
    expect(p.Categories).toEqual(['Spirits'])
    expect(p.ImageURL).toBe('https://cdn.shopify.com/rum.jpg')
    expect(p).not.toHaveProperty('CompareAtPrice')
  })

  it('carries a compare-at price only when there is one', () => {
    expect(viewedProductPayload({ ...rum, compareAtPrice: '45.00' }).CompareAtPrice).toBe(45)
    expect(viewedProductPayload({ ...rum, compareAtPrice: '0' })).not.toHaveProperty('CompareAtPrice')
  })

  it('mirrors the viewed-item feed entry from the same data', () => {
    const v = viewedItemPayload(rum)
    expect(v.ItemId).toBe('15224526569849')
    expect(v.Url).toBe(viewedProductPayload(rum).URL)
    expect(v.Metadata).toEqual({ Brand: 'Jerry Can Spirits', Price: 40 })
  })
})

describe('Added to Cart', () => {
  it('describes the added line and the whole cart in Klaviyo field names', () => {
    const p = addedToCartPayload(cart(), 'gid://shopify/ProductVariant/56256518193529')
    expect(p).not.toBeNull()
    expect(p!.AddedItemProductName).toBe('Jerry Can Spirits Bar Blade (Bottle Opener)')
    expect(p!.AddedItemProductID).toBe('15245613269369')
    expect(p!.AddedItemPrice).toBe(7.5)
    expect(p!.AddedItemQuantity).toBe(1)
    expect(p!.AddedItemURL).toBe('https://jerrycanspirits.co.uk/shop/product/bar-blade-bottle-opener/')
    expect(p!.$value).toBe(47.5)
    expect(p!.CheckoutURL).toBe('https://shop.jerrycanspirits.co.uk/cart/c/abc')
    expect(p!.ItemNames).toEqual(['Jerry Can Spirits - Expedition Spiced Rum', 'Jerry Can Spirits Bar Blade (Bottle Opener)'])
    expect(p!.Items[0]).toEqual({
      ProductID: '15224526569849',
      ProductName: 'Jerry Can Spirits - Expedition Spiced Rum',
      Quantity: 1,
      ItemPrice: 40,
      RowTotal: 40,
      ProductURL: 'https://jerrycanspirits.co.uk/shop/product/jerry-can-spirits-expedition-spiced-rum/',
      ImageURL: 'https://cdn.shopify.com/rum.jpg',
      ProductCategories: ['Spirits'],
    })
    expect(p!.Items[1]).not.toHaveProperty('ImageURL')
  })

  it('multiplies row totals by quantity', () => {
    const c = cart()
    c.lines[0].quantity = 3
    const p = addedToCartPayload(c, 'gid://shopify/ProductVariant/56168995193209')
    expect(p!.AddedItemQuantity).toBe(3)
    expect(p!.Items[0].RowTotal).toBe(120)
  })

  it('returns null when the variant is not on the cart', () => {
    expect(addedToCartPayload(cart(), 'gid://shopify/ProductVariant/0')).toBeNull()
  })
})

describe('consent gating, the same rule as the script loader', () => {
  it('sends with marketing consent', () => {
    const w = win({ marketing: true })
    expect(pushKlaviyo(['track', 'x', {}], w)).toBe(true)
    expect(w.pushed).toHaveLength(1)
  })

  it('sends with statistics consent alone', () => {
    const w = win({ statistics: true, marketing: false })
    expect(pushKlaviyo(['track', 'x', {}], w)).toBe(true)
  })

  it('drops the event with no consent, with consent declined, and with no SDK', () => {
    expect(pushKlaviyo(['track', 'x', {}], win(undefined))).toBe(false)
    expect(pushKlaviyo(['track', 'x', {}], win({ marketing: false, statistics: false }))).toBe(false)
    const noSdk = win({ marketing: true }, false)
    expect(pushKlaviyo(['track', 'x', {}], noSdk)).toBe(false)
    expect(noSdk.pushed).toHaveLength(0)
    expect(pushKlaviyo(['track', 'x', {}], undefined)).toBe(false)
  })

  it('reports consent from either flag', () => {
    expect(hasKlaviyoConsent(win({ marketing: true }))).toBe(true)
    expect(hasKlaviyoConsent(win({ statistics: true }))).toBe(true)
    expect(hasKlaviyoConsent(win({}))).toBe(false)
    expect(hasKlaviyoConsent(undefined)).toBe(false)
  })
})

describe('track helpers', () => {
  it('Viewed Product queues the event and the viewed-item feed entry, in that order', () => {
    const w = win({ marketing: true })
    expect(trackViewedProduct(rum, w)).toBe(true)
    expect(w.pushed.map((a) => a[0])).toEqual(['track', 'trackViewedItem'])
    expect(w.pushed[0][1]).toBe('Viewed Product')
  })

  it('Added to Cart queues one event named exactly as Klaviyo expects', () => {
    const w = win({ statistics: true })
    expect(trackAddedToCart(cart(), 'gid://shopify/ProductVariant/56168995193209', w)).toBe(true)
    expect(w.pushed).toHaveLength(1)
    expect(w.pushed[0][0]).toBe('track')
    expect(w.pushed[0][1]).toBe('Added to Cart')
  })

  it('queues nothing without consent even when the SDK is present', () => {
    const w = win({ marketing: false }, true)
    const spy = vi.spyOn(w.klaviyo!, 'push')
    expect(trackViewedProduct(rum, w)).toBe(false)
    expect(trackAddedToCart(cart(), 'gid://shopify/ProductVariant/56168995193209', w)).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('is safe with no window at all', () => {
    expect(trackViewedProduct(rum, undefined)).toBe(false)
    expect(trackAddedToCart(cart(), 'gid://shopify/ProductVariant/56168995193209', undefined)).toBe(false)
  })
})

/**
 * Identify is what makes the two events above count for anyone who signed up
 * on this site rather than clicking through from an email. Klaviyo keeps
 * onsite events only for a browser it can attach to a profile.
 */
describe('identifyKlaviyo', () => {
  it('queues an identify call in the field names Klaviyo reads', () => {
    const w = win({ marketing: true })
    expect(identifyKlaviyo('  Alex@Example.com ', ' Alex ', w)).toBe(true)
    expect(w.pushed).toHaveLength(1)
    expect(w.pushed[0][0]).toBe('identify')
    expect(w.pushed[0][1]).toEqual({ $email: 'Alex@Example.com', $first_name: 'Alex' })
  })

  it('omits the first name when there is not one, rather than sending an empty string', () => {
    const w = win({ marketing: true })
    identifyKlaviyo('alex@example.com', '', w)
    expect(w.pushed[0][1]).toEqual({ $email: 'alex@example.com' })
  })

  it('sends nothing for an empty address', () => {
    const w = win({ marketing: true })
    expect(identifyKlaviyo('   ', 'Alex', w)).toBe(false)
    expect(w.pushed).toHaveLength(0)
  })

  it('respects the same consent gate as the events', () => {
    const w = win({ marketing: false }, true)
    const spy = vi.spyOn(w.klaviyo!, 'push')
    expect(identifyKlaviyo('alex@example.com', 'Alex', w)).toBe(false)
    expect(spy).not.toHaveBeenCalled()
    expect(identifyKlaviyo('alex@example.com', 'Alex', undefined)).toBe(false)
  })
})
