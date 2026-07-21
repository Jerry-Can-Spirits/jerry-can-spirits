import { NextResponse } from 'next/server'
import { getProduct, resolveCategory, type ProductCategory } from '@/lib/shopify'
import { client } from '@/sanity/lib/client'

// The curated pool lives on the `cartUpsell` singleton in Sanity as an ordered
// list of Shopify handles. Resolve each to a live product + its first available
// variant; the drawer does the shortfall-aware selection client-side (it has the
// live subtotal). Ordering is preserved so it can serve as the tiebreak/fallback.
const CART_UPSELL_POOL_QUERY = `*[_type == "cartUpsell"][0].pool`

interface CartUpsellItem {
  title: string
  handle: string
  imageUrl: string | null
  imageAlt: string
  variantId: string
  variantTitle?: string
  price: number
  currencyCode: string
  // Coarse bucket (spirits/barware/clothing) for the category-aware complement
  // rule — the drawer offers a category the cart doesn't already have.
  category: ProductCategory
}

export async function GET() {
  try {
    const handles = await client.fetch<string[] | null>(CART_UPSELL_POOL_QUERY)
    if (!handles || handles.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const cleaned = handles
      .map((h) => (typeof h === 'string' ? h.trim() : ''))
      .filter((h): h is string => h.length > 0)

    const resolved = await Promise.all(
      cleaned.map(async (handle) => ({ handle, product: await getProduct(handle) })),
    )

    const products: CartUpsellItem[] = []
    for (const { handle, product: p } of resolved) {
      // A handle that resolves to nothing is almost always a typo in Studio, and
      // a silent drop is indistinguishable from an unset field — log it.
      if (!p) {
        console.warn('[cart-upsell] handle "%s" matched no live Shopify product — check the spelling in Studio', handle)
        continue
      }
      const available = p.variants?.filter((v) => v.availableForSale) ?? []
      const variant = available[0]
      if (!variant) {
        console.warn('[cart-upsell] "%s" has no variant available for sale — skipping', handle)
        continue
      }
      // Add the FIRST available variant. For a glass with Pair/Single that is the
      // Pair only if it's ordered first in Shopify — an explicit contract, not a
      // silent assumption (the class of bug from #922/#948). Log the pick.
      if (available.length > 1) {
        console.warn('[cart-upsell] "%s" has %s available variants; using "%s" (first available). Order the intended variant (e.g. the Pair) first in Shopify.', handle, String(available.length), variant.title)
      }
      products.push({
        title: p.title,
        handle: p.handle,
        imageUrl: p.images?.[0]?.url ?? null,
        imageAlt: p.images?.[0]?.altText ?? p.title,
        variantId: variant.id,
        variantTitle: variant.title && variant.title !== 'Default Title' ? variant.title : undefined,
        price: parseFloat(variant.price.amount),
        currencyCode: variant.price.currencyCode,
        category: resolveCategory(p.productType, p.tags),
      })
    }

    return NextResponse.json(
      { products },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    )
  } catch (error) {
    console.error('[cart-upsell] failed to build the pool:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
