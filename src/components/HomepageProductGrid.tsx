import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/lib/shopify'
import { selectHomepageProducts } from '@/lib/homepage-products'

// Every purchasable product with its live price, straight after the hero.
// One Storefront call, cached by the page's revalidate and refreshed by the
// products/update webhook, so the grid never advertises a stale price for
// longer than a product change takes to arrive. Degrades to nothing: a failed
// fetch must not take the homepage down.
export default async function HomepageProductGrid() {
  let products = [] as Awaited<ReturnType<typeof getProducts>>
  try {
    products = selectHomepageProducts(await getProducts())
  } catch (error) {
    console.error('[HomepageProductGrid] fetch failed:', error)
  }
  if (products.length === 0) return null

  return (
    <section className="py-16 bg-jerry-green-900/30" aria-labelledby="shop-grid-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 id="shop-grid-heading" className="text-3xl md:text-4xl font-serif font-bold text-white">
            Everything in the shop.
          </h2>
          <p className="mt-3 text-parchment-300 max-w-2xl mx-auto">
            The bottle, the glassware its serves were built in, and the tools for making them. A first order can start small.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 2} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/shop/"
            className="inline-flex items-center min-h-[44px] px-6 py-2 border border-gold-500/40 hover:border-gold-400 text-gold-300 hover:text-gold-200 text-sm font-semibold rounded-lg transition-colors"
          >
            Browse the whole shop
          </Link>
        </div>
      </div>
    </section>
  )
}
