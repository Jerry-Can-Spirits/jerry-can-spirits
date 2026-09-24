import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/lib/shopify'
import { homepageProductRows } from '@/lib/homepage-products'
import SectionHeading from '@/components/SectionHeading'

// Every purchasable product with its live price, straight after the hero, in
// three rows that scroll sideways: the rum, the glassware, the tools. A row
// shows a card and the edge of the next one on a phone, which is the cue to
// swipe; on a desktop the row scrolls where it overflows the page width.
// One Storefront call, cached by the page's revalidate and refreshed by the
// products/update webhook, so a price is never stale for longer than a
// product change takes to arrive. Degrades to nothing: a failed fetch must
// not take the homepage down.
export default async function HomepageProductGrid() {
  let rows = [] as ReturnType<typeof homepageProductRows>
  try {
    rows = homepageProductRows(await getProducts())
  } catch (error) {
    console.error('[HomepageProductGrid] fetch failed:', error)
  }
  if (rows.length === 0) return null

  return (
    <section className="py-16 band-light" aria-labelledby="shop-grid-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Range"
          id="shop-grid-heading"
          intro="The bottle, the glassware its serves were built in, and the tools for making them. A first order can start small."
        >
          Everything in the shop.
        </SectionHeading>

        <div className="space-y-12">
          {rows.map((row, r) => (
            <div key={row.key}>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-white">{row.title}</h3>
                  <p className="mt-1 text-sm text-parchment-300">{row.blurb}</p>
                </div>
                <Link
                  href={row.href}
                  className="shrink-0 inline-flex items-center min-h-[44px] text-sm font-semibold text-gold-300 hover:text-gold-200 underline-offset-4 hover:underline"
                >
                  {row.cta}
                </Link>
              </div>
              <ul
                aria-label={row.title}
                className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-4"
              >
                {row.products.map((product, i) => (
                  <li key={product.id} className="snap-start shrink-0 w-[70vw] sm:w-64 lg:w-72">
                    <ProductCard product={product} priority={r === 0 && i < 2} />
                  </li>
                ))}
              </ul>
            </div>
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
