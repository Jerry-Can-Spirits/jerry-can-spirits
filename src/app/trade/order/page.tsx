import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { getProduct } from '@/lib/shopify'
import { TRADE_PRODUCTS, type TradeProduct } from '@/lib/trade-products'
import TradeOrderForm from '@/components/TradeOrderForm'

export const metadata: Metadata = {
  title: 'Trade Order Portal',
  description: 'Authorised trade accounts only. Place wholesale orders for Expedition Spiced Rum from Jerry Can Spirits. Veteran-owned British spirits, built properly.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function TradeOrderPage() {
  const session = await requireTradeSession()
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  // Re-fetch the row to get the discount_code that the verify endpoint used
  // to return inline. Cheap query and lets us pass everything the form needs.
  const account = await db
    .prepare(`SELECT venue_name, tier, discount_code FROM trade_accounts WHERE id = ?1 AND active = 1`)
    .bind(session.tradeAccountId)
    .first<{ venue_name: string; tier: string; discount_code: string }>()

  if (!account) {
    // Shouldn't reach here — requireTradeSession already validated active = 1 — but be defensive.
    throw new Error('Trade account not found')
  }

  let products: TradeProduct[] = []
  let fetchError: string | undefined

  try {
    const results = await Promise.all(
      TRADE_PRODUCTS.map(async ({ handle, category, excludeFromDiscount }): Promise<TradeProduct | null> => {
        const product = await getProduct(handle)
        if (!product) return null

        return {
          handle,
          title: product.title,
          category,
          featuredImage: product.images[0] ?? undefined,
          variants: (product.variants || []).map((v) => ({
            id: v.id,
            title: v.title,
            price: v.price.amount,
          })),
          excludeFromDiscount,
        }
      })
    )

    products = results.filter((p): p is TradeProduct => p !== null)

    if (products.length === 0) {
      fetchError = 'Product catalogue unavailable. Please contact us to place your order.'
    }
  } catch {
    fetchError = 'Product catalogue unavailable. Please contact us to place your order.'
  }

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            Trade
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
          Place a Trade Order
        </h1>
        <p className="text-parchment-400 text-sm mb-10">
          {account.venue_name}
        </p>
        <TradeOrderForm
          products={products}
          error={fetchError}
          account={{
            venue_name: account.venue_name,
            tier: account.tier,
            discount_code: account.discount_code,
          }}
        />
      </div>
    </main>
  )
}
