import type { ShopifyProduct } from './shopify'

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

// Expedition's headline price rises to £45 on 1 August 2026, so its structured
// data must not claim the current price is valid past then. Everything else uses
// a stable year-end date. A literal (not today+1y) keeps the JSON-LD byte-stable
// across requests rather than polluting Google Merchant freshness signals.
// Revisit both dates after 1 August 2026.
export function priceValidUntil(handle: string): string {
  return handle === 'jerry-can-spirits-expedition-spiced-rum' ? '2026-07-31' : '2026-12-31'
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
