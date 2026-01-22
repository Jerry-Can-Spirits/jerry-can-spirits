import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCollection, type ShopifyProduct } from '@/lib/shopify'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium British Rum Collection',
  description: 'Veteran-owned British rum collection. Small-batch premium spirits crafted with military precision by Royal Corps of Signals veterans. Sustainably sourced, expedition-tested.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shop/drinks/',
  },
  openGraph: {
    title: 'Premium British Rum Collection | Jerry Can Spirits®',
    description: 'Veteran-owned British rum collection. Small-batch premium spirits crafted with military precision.',
  },
}

// Configure for Edge Runtime and dynamic rendering
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Helper to format price with currency symbol
function formatPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount)

  // Currency symbols
  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currencyCode] || currencyCode
  return `${symbol}${price.toFixed(2)}`
}

export default async function DrinksPageTest() {
  let products: ShopifyProduct[] = []
  let error: string | null = null

  try {
    // Collection handles in Shopify:
    // - 'drinks'
    // - 'clothing' (for Clothing/Expedition Gear)
    // - 'hardware' (for Hardware/Barware)
    products = await getProductsByCollection('drinks')
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error occurred'
    console.error('Shopify fetch error:', e)
  }

  // Error state - matches your Jerry Can Spirits design
  if (error) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-red-800/60 backdrop-blur-sm rounded-full border border-red-500/30 mb-6">
              <span className="text-red-300 text-sm font-semibold uppercase tracking-widest">
                Connection Error
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
              Premium British Rum Collection - Shopify Connection Failed
            </h1>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-left">
              <p className="text-red-300 font-mono text-sm mb-4">
                Error: {error}
              </p>

              <div className="space-y-2 text-parchment-300 text-sm">
                <p className="font-semibold text-gold-300">Troubleshooting steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Check your .env.local file has the correct Shopify credentials</li>
                  <li>Verify NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is set (e.g., "your-store.myshopify.com")</li>
                  <li>Verify NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN is set</li>
                  <li>Ensure you have a collection with handle "drinks" in Shopify</li>
                  <li>Check the Storefront API access token has the correct permissions</li>
                </ol>
              </div>
            </div>

            <Link
              href="/shop"
              className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Empty state - no products found
  if (products.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Shopify Connected ✓
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
              Premium British Rum Collection - No Products Available Yet
            </h1>

            <p className="text-xl text-parchment-200">
              The Shopify connection is working, but no products were found in the "drinks" collection.
            </p>

            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-left">
              <p className="text-parchment-300 text-sm mb-4">
                Make sure you have:
              </p>
              <ul className="list-disc list-inside space-y-1 text-parchment-300 text-sm ml-2">
                <li>Created a collection in Shopify with the handle "drinks"</li>
                <li>Added at least one product to that collection</li>
                <li>Published the collection to your Storefront sales channel</li>
              </ul>
            </div>

            <Link
              href="/shop"
              className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Success state - products loaded from Shopify
  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/shop" className="hover:text-gold-300 transition-colors">Shop</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">Drinks</span>
        </nav>
      </div>

      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Premium Rum Collection
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Premium British Rum Collection
            <br />
            <span className="text-gold-300">Veteran-Owned Expedition Spirits</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Explore our handcrafted British rum collection - premium small-batch spirits engineered for modern explorers. Rich flavours, exceptional quality, and adventure in every bottle.
          </p>

          {/* Shopify Connection Success Indicator */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-800/20 border border-green-500/30 rounded-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-300 text-sm font-medium">
              {products.length} {products.length === 1 ? 'product' : 'products'} loaded from Shopify
            </span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product: ShopifyProduct) => (
            <Link
              key={product.id}
              href={`/shop/product/${product.handle}`}
              className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
            >
              {/* Product Image */}
              <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square bg-jerry-green-800/20 flex items-center justify-center p-4">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.title}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 text-gold-500/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3">
                <h2 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
                  {product.title}
                </h2>

                <div className="flex items-center justify-between pt-1 sm:pt-2">
                  <p className="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gold-400">
                    {formatPrice(
                      product.priceRange.minVariantPrice.amount,
                      product.priceRange.minVariantPrice.currencyCode
                    )}
                  </p>

                  <span className="text-gold-300 text-xs sm:text-sm font-semibold group-hover:translate-x-1 transition-transform">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About Our Rum Collection - SEO Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">
              Premium British Craft Rum Collection
            </h2>
            <div className="space-y-4 text-parchment-200 leading-relaxed">
              <p>
                Discover handcrafted small-batch rum that captures the essence of British spirits excellence. Our veteran-owned brand channels 12+ years of Royal Corps of Signals expedition experience into every bottle - delivering premium craft rum with uncompromising flavour profiles and expedition-tested reliability.
              </p>
              <p>
                Experience complex, layered flavours that tell a story with every sip. Our spiced rum reveals rich notes of velvety vanilla dancing with warm caramel, complemented by aromatic cinnamon and subtle oak undertones. The finish is exceptionally smooth and lingering - a testament to our partnership with Spirit of Wales Distillery's innovative copper-pot distillation methods.
              </p>
              <p>
                Versatility meets quality: perfect for crafting bold cocktails like our signature Storm and Spice, equally rewarding when savored neat or on the rocks. Sustainably produced with British-first ingredient sourcing and ethically-selected Caribbean molasses, every pour represents our commitment to exceptional craft spirits.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">
              Craft Spirits Built for Adventure
            </h2>
            <div className="space-y-4 text-parchment-200 leading-relaxed">
              <p>
                Jerry Can Spirits is engineered for the modern explorer - those who demand authenticity, seek bold flavours, and value quality that performs. Our premium British rum elevates any occasion: from crafting sophisticated cocktails at your home bar to sharing memorable toasts around the campfire. Expedition-ready versatility meets uncompromising craft quality.
              </p>
              <p>
                As proud Armed Forces Covenant signatories, we're creating more than exceptional spirits - we're building opportunities. Our veteran heritage drives our standards: precision in every batch, reliability in every bottle, and unwavering commitment to excellence. Try our craft rum and discover what expedition-tested quality truly means.
              </p>
              <p>
                Choose small-batch rum that makes a difference. From sustainable British ingredient sourcing to ethical Caribbean molasses selection, we prioritize environmental responsibility without compromising flavour. This isn't mass-produced spirits - this is handcrafted British rum created with passion, purpose, and a relentless pursuit of perfection.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Our Rum */}
        <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 mb-16">
          <h3 className="text-2xl font-serif font-bold text-gold-300 mb-6 text-center">
            Why Choose Jerry Can Spirits Premium Rum
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Military Precision</h4>
              <p className="text-parchment-300 text-sm">
                Every batch crafted with the exacting standards learned through 12+ years of Royal Corps of Signals service. Quality you can trust, reliability you can count on.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Sustainable British Spirits</h4>
              <p className="text-parchment-300 text-sm">
                UK-first ingredient sourcing reduces our carbon footprint. Ethical partnerships with sustainable suppliers. British botanicals, Welsh distillation, and environmental responsibility.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Supporting Veterans</h4>
              <p className="text-parchment-300 text-sm">
                Armed Forces Covenant signatories supporting veteran entrepreneurs. Every purchase helps former service members pursue their dreams and build successful civilian careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Start Your Adventure Today
          </h2>
          <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
            Join the ranks of discerning spirits enthusiasts. Get exclusive early access to our limited first batch, expert cocktail recipes, and expedition updates from the Jerry Can Spirits crew. Experience premium British craft rum engineered for those who venture beyond the ordinary.
          </p>
          <Link
            href="/#newsletter-signup"
            className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Get Exclusive Early Access
          </Link>
        </div>
      </section>
    </main>
  )
}
