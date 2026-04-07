import type { Metadata } from 'next'
import { getProduct } from '@/lib/shopify'
import { TRADE_PRODUCTS, type TradeProduct } from '@/lib/trade-products'
import TradeOrderForm from '@/components/TradeOrderForm'

export const metadata: Metadata = {
  title: 'Trade Order Portal | Jerry Can Spirits',
  robots: { index: false, follow: false },
}

export default async function TradeOrderPage() {
  let products: TradeProduct[] = []
  let fetchError: string | undefined

  try {
    const results = await Promise.all(
      TRADE_PRODUCTS.map(async ({ handle, category }): Promise<TradeProduct | null> => {
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
    <main className="min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-8">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            Trade
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
          Place a Trade Order
        </h1>
        <p className="text-parchment-400 text-sm mb-12 max-w-lg">
          Enter your trade PIN to access your account and place an order.
        </p>
        <TradeOrderForm products={products} error={fetchError} />
      </div>
    </main>
  )
}
