// Klaviyo onsite events for the headless store.
//
// On a Shopify theme the Klaviyo app injects Viewed Product and Added to Cart
// itself. On a Storefront API cart nothing does, so Klaviyo only ever saw
// Active on Site from this site and the browse-abandonment and abandoned-cart
// flows had nothing to trigger on. Started Checkout and Placed Order are not
// ours to send: checkout is Shopify-hosted and the Shopify integration delivers
// both server to server.
//
// The payloads follow Klaviyo's guide for platforms without a pre-built
// integration, field names included, so the standard flow templates render
// them without remapping. Product IDs are the numeric Shopify IDs, which is
// what the Klaviyo catalogue sync keys on.
//
// Consent: KlaviyoScript loads the SDK only after Cookiebot marketing or
// statistics consent. The send helper applies the same test and drops the
// event otherwise, so nothing is queued for a visitor who declined. Events for
// a visitor Klaviyo cannot identify are discarded on its side, which is
// expected: flows attach to known profiles only.
import { BASE_URL } from './jsonLd'
import type { Cart, CartLine } from './shopify'

const BRAND = 'Jerry Can Spirits'

export interface ViewedProductInput {
  /** Shopify product GID or numeric ID. */
  id: string
  title: string
  handle: string
  price: string
  productType?: string
  imageUrl?: string
  compareAtPrice?: string | null
}

export interface ViewedProductPayload {
  ProductName: string
  ProductID: string
  Categories: string[]
  ImageURL?: string
  URL: string
  Brand: string
  Price: number
  CompareAtPrice?: number
}

export interface ViewedItemPayload {
  Title: string
  ItemId: string
  Categories: string[]
  ImageUrl?: string
  Url: string
  Metadata: { Brand: string; Price: number; CompareAtPrice?: number }
}

export interface AddedToCartItem {
  ProductID: string
  ProductName: string
  Quantity: number
  ItemPrice: number
  RowTotal: number
  ProductURL: string
  ImageURL?: string
  ProductCategories: string[]
}

export interface AddedToCartPayload {
  $value: number
  AddedItemProductName: string
  AddedItemProductID: string
  AddedItemCategories: string[]
  AddedItemImageURL?: string
  AddedItemURL: string
  AddedItemPrice: number
  AddedItemQuantity: number
  ItemNames: string[]
  CheckoutURL: string
  Items: AddedToCartItem[]
}

/** A window-like object; parameterised so the pure functions test without a DOM. */
export interface KlaviyoWindow {
  klaviyo?: { push: (args: unknown[]) => void }
  Cookiebot?: { consent?: { marketing?: boolean; statistics?: boolean } }
}

export function numericId(gid: string): string {
  return gid.split('/').pop() ?? gid
}

export function productUrl(handle: string): string {
  return `${BASE_URL}/shop/product/${handle}/`
}

function money(amount: string | undefined | null): number {
  const n = parseFloat(amount ?? '')
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function categories(productType?: string): string[] {
  return productType ? [productType] : []
}

/** Same rule as KlaviyoScript: marketing or statistics consent. */
export function hasKlaviyoConsent(w: KlaviyoWindow | undefined): boolean {
  const c = w?.Cookiebot?.consent
  return Boolean(c?.marketing || c?.statistics)
}

/** Queues an onsite call if consent is present and the SDK or its stub exists. */
export function pushKlaviyo(args: unknown[], w: KlaviyoWindow | undefined): boolean {
  if (!w || !hasKlaviyoConsent(w) || typeof w.klaviyo?.push !== 'function') return false
  w.klaviyo.push(args)
  return true
}

export function viewedProductPayload(p: ViewedProductInput): ViewedProductPayload {
  const compareAt = money(p.compareAtPrice)
  return {
    ProductName: p.title,
    ProductID: numericId(p.id),
    Categories: categories(p.productType),
    ...(p.imageUrl ? { ImageURL: p.imageUrl } : {}),
    URL: productUrl(p.handle),
    Brand: BRAND,
    Price: money(p.price),
    ...(compareAt > 0 ? { CompareAtPrice: compareAt } : {}),
  }
}

/** The recently-viewed feed Klaviyo keeps per profile, used by product blocks in emails. */
export function viewedItemPayload(p: ViewedProductInput): ViewedItemPayload {
  const v = viewedProductPayload(p)
  return {
    Title: v.ProductName,
    ItemId: v.ProductID,
    Categories: v.Categories,
    ...(v.ImageURL ? { ImageUrl: v.ImageURL } : {}),
    Url: v.URL,
    Metadata: {
      Brand: v.Brand,
      Price: v.Price,
      ...(v.CompareAtPrice !== undefined ? { CompareAtPrice: v.CompareAtPrice } : {}),
    },
  }
}

function lineItem(line: CartLine): AddedToCartItem {
  const price = money(line.merchandise.price.amount)
  return {
    ProductID: numericId(line.merchandise.product.id),
    ProductName: line.merchandise.product.title,
    Quantity: line.quantity,
    ItemPrice: price,
    RowTotal: Math.round(price * line.quantity * 100) / 100,
    ProductURL: productUrl(line.merchandise.product.handle),
    ...(line.merchandise.image?.url ? { ImageURL: line.merchandise.image.url } : {}),
    ProductCategories: categories(line.merchandise.product.productType),
  }
}

/**
 * Builds Added to Cart from the cart Shopify returned after the add. Returns
 * null when the added variant is not on the cart, which can only mean the add
 * failed upstream, so there is nothing truthful to send.
 */
export function addedToCartPayload(cart: Cart, addedVariantId: string): AddedToCartPayload | null {
  const added = cart.lines.find((l) => l.merchandise.id === addedVariantId)
  if (!added) return null
  const items = cart.lines.map(lineItem)
  const addedItem = lineItem(added)
  return {
    $value: money(cart.cost.totalAmount.amount),
    AddedItemProductName: addedItem.ProductName,
    AddedItemProductID: addedItem.ProductID,
    AddedItemCategories: addedItem.ProductCategories,
    ...(addedItem.ImageURL ? { AddedItemImageURL: addedItem.ImageURL } : {}),
    AddedItemURL: addedItem.ProductURL,
    AddedItemPrice: addedItem.ItemPrice,
    AddedItemQuantity: added.quantity,
    ItemNames: items.map((i) => i.ProductName),
    CheckoutURL: cart.checkoutUrl,
    Items: items,
  }
}

function browserWindow(): KlaviyoWindow | undefined {
  return typeof window === 'undefined' ? undefined : (window as unknown as KlaviyoWindow)
}

/** Viewed Product plus the viewed-item feed entry. Call once per product page mount. */
export function trackViewedProduct(p: ViewedProductInput, w: KlaviyoWindow | undefined = browserWindow()): boolean {
  const sent = pushKlaviyo(['track', 'Viewed Product', viewedProductPayload(p)], w)
  if (sent) pushKlaviyo(['trackViewedItem', viewedItemPayload(p)], w)
  return sent
}

/** Added to Cart for the variant just added. Call with the cart Shopify returned. */
export function trackAddedToCart(cart: Cart, addedVariantId: string, w: KlaviyoWindow | undefined = browserWindow()): boolean {
  const payload = addedToCartPayload(cart, addedVariantId)
  if (!payload) return false
  return pushKlaviyo(['track', 'Added to Cart', payload], w)
}

/**
 * Tell the onsite SDK who this browser belongs to. Call after a form on this
 * site has accepted an email address.
 *
 * Klaviyo keeps onsite events only for a profile it can already name, and it
 * learns a browser's profile from a click in one of its emails or a submission
 * of one of its own forms. Our forms post to our API instead, which creates
 * the profile server-side but tells the browser nothing. Measured 25 Sep 2026:
 * every Viewed Product event this site had ever produced belonged to one
 * profile, the founder's, because his browser had once clicked a Klaviyo
 * email and nobody else's had. Without this call the browse-abandonment and
 * added-to-cart flows only ever reach people who arrived from an email.
 *
 * Same consent gate as every other call here. This never sends email consent:
 * that is decided server-side from the form's checkbox, and identifying a
 * browser for onsite tracking is a separate act governed by cookie consent.
 */
export function identifyKlaviyo(email: string, firstName?: string, w: KlaviyoWindow | undefined = browserWindow()): boolean {
  const address = email.trim()
  if (!address) return false
  const props: Record<string, string> = { $email: address }
  const name = firstName?.trim()
  if (name) props.$first_name = name
  return pushKlaviyo(['identify', props], w)
}
