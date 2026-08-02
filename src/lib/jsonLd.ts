import type { ShopifyProduct } from './shopify'
import { GB_SHIPPING_DETAILS } from './shippingSchema'

/**
 * Serialise a JSON-LD payload safely for embedding in
 * `<script type="application/ld+json">` via `dangerouslySetInnerHTML`.
 *
 * Escaping `<` to its unicode form prevents an attacker-controlled string
 * (Shopify product titles, Sanity cocktail content, FAQ metafields, etc.)
 * from breaking out of the script tag with `</script>`, opening `<!--`
 * comments, or injecting fresh `<script>` / `<svg>` blocks.
 *
 * `<` is valid inside a JSON string literal and parses identically
 * to `<` for downstream consumers (Google's structured data parser, etc.),
 * so this is a pure security hardening with no functional change.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

// Twelve months out, computed when the page builds or regenerates, so the
// offer can never carry an expired date. The previous hardcoded literals went
// stale the day the Expedition Spiced Rum RRP changed, and an expired
// priceValidUntil can suppress the price in the Product rich result. ISR
// refreshes the date on each regeneration; it never needs revisiting.
export function priceValidUntil(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

// The date current pricing took effect (site launch). Byte-stable literal for
// the same Merchant-freshness reason as priceValidUntil. When Expedition's RRP
// rises on 1 August 2026, its validFrom becomes 2026-08-01 — revisit alongside
// the priceValidUntil dates above (split per-handle then, as priceValidUntil does).
export const PRICE_VALID_FROM = '2026-04-06'

// The 14-day GB returns policy, shared by every offer on the site. Previously
// duplicated inline on the product, spirits and barware pages.
export const MERCHANT_RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  applicableCountry: 'GB',
} as const

// GS1-issued GTINs for own-brand products. Spread into Product nodes via
// productGtin(); products without a GTIN contribute nothing.
const GTIN_BY_HANDLE: Record<string, string> = {
  'jerry-can-spirits-expedition-spiced-rum': '5070004142209',
  'jerry-can-spirits-premium-gift-pack': '5070004142216',
}
export function productGtin(handle: string): { gtin13: string } | Record<string, never> {
  const gtin = GTIN_BY_HANDLE[handle]
  return gtin ? { gtin13: gtin } : {}
}

// The full merchant-listing offer field set Google Search Console expects on
// every offer (product pages AND collection-page ItemLists): url, price
// validity window, shipping and returns. Callers spread extra fields on top.
export function merchantOfferExtras(url: string): Record<string, unknown> {
  return {
    url,
    priceValidUntil: priceValidUntil(),
    validFrom: PRICE_VALID_FROM,
    shippingDetails: GB_SHIPPING_DETAILS,
    hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
  }
}

// Build an Offer, or an AggregateOffer when a product's variants genuinely span
// prices (a glass sold as a Pair or a Single). Advertising one variant's price as
// the whole product's — while the page defaults to another variant — is the
// mismatch this avoids: AggregateOffer states an honest low/high range instead.
// `availability` reflects whether ANY variant can be bought. `extra` carries
// caller-specific fields (url, shipping, returns, seller, priceValidUntil, @id).
export function productOffer(
  product: ShopifyProduct,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const min = product.priceRange.minVariantPrice
  const max = product.priceRange.maxVariantPrice
  const variants = product.variants ?? []
  const anyAvailable =
    variants.length > 0 ? variants.some((v) => v.availableForSale) : !!product.availableForSale
  const availability = anyAvailable
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'

  if (max && max.amount !== min.amount) {
    return {
      '@type': 'AggregateOffer',
      priceCurrency: min.currencyCode,
      lowPrice: min.amount,
      highPrice: max.amount,
      offerCount: variants.length,
      availability,
      ...extra,
    }
  }
  return {
    '@type': 'Offer',
    price: min.amount,
    priceCurrency: min.currencyCode,
    availability,
    ...extra,
  }
}
