import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCollection, type ShopifyProduct } from '@/lib/shopify'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'Cocktail Shaker Sets, Barware & Bar Tools',
  description: 'Premium cocktail shaker sets, bar tools, and glassware for home mixologists. Everything you need to craft perfect rum cocktails at home.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shop/barware/',
  },
  openGraph: {
    title: 'Cocktail Shaker Sets, Barware & Bar Tools | Jerry Can Spirits®',
    description: 'Premium cocktail shaker sets, bar tools, and glassware for home mixologists. Everything you need to craft perfect rum cocktails at home.',
    url: 'https://jerrycanspirits.co.uk/shop/barware/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
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

// Category icons mapping - removed emojis for premium brand consistency

// Helper to group products by tags
function groupProductsByTag(products: ShopifyProduct[]): Record<string, ShopifyProduct[]> {
  const grouped: Record<string, ShopifyProduct[]> = {}

  products.forEach(product => {
    if (product.tags && product.tags.length > 0) {
      product.tags.forEach(tag => {
        if (!grouped[tag]) {
          grouped[tag] = []
        }
        grouped[tag].push(product)
      })
    } else {
      // Products without tags go into "Other"
      if (!grouped['Other']) {
        grouped['Other'] = []
      }
      grouped['Other'].push(product)
    }
  })

  return grouped
}

export default async function BarwarePage() {
  let products: ShopifyProduct[] = []
  let error: string | null = null

  try {
    // Fetch products from the 'barware' collection in Shopify
    products = await getProductsByCollection('barware')
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error occurred'
    console.error('Shopify fetch error:', e)
  }

  // Error state
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
              Shopify Connection Failed
            </h1>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-left">
              <p className="text-red-300 font-mono text-sm mb-4">
                Error: {error}
              </p>

              <div className="space-y-2 text-parchment-300 text-sm">
                <p className="font-semibold text-gold-300">Troubleshooting steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Check your .env.local file has the correct Shopify credentials</li>
                  <li>Verify you have a collection with handle "barware" in Shopify</li>
                  <li>Ensure the collection is published to your Storefront sales channel</li>
                </ol>
              </div>
            </div>

            <Link
              href="/shop/"
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
              Barware Coming Soon
            </h1>

            <p className="text-xl text-parchment-200">
              The Shopify connection is working, but no products were found in the "barware" collection.
            </p>

            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-left">
              <p className="text-parchment-300 text-sm mb-4">
                Make sure you have:
              </p>
              <ul className="list-disc list-inside space-y-1 text-parchment-300 text-sm ml-2">
                <li>Created a collection in Shopify with the handle "barware"</li>
                <li>Added your barware products to that collection</li>
                <li>Published the collection to your Storefront sales channel</li>
              </ul>
            </div>

            <Link
              href="/shop/"
              className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Group products by tag
  const groupedProducts = groupProductsByTag(products)

  // Sort categories: predefined order first, then alphabetically
  const categoryOrder = ['Glassware', 'Bar Tools', 'Cocktail Shakers', 'Measuring Tools', 'Accessories']
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a)
    const bIndex = categoryOrder.indexOf(b)

    // If both are in predefined order, sort by that order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    // If only a is in predefined order, it comes first
    if (aIndex !== -1) return -1
    // If only b is in predefined order, it comes first
    if (bIndex !== -1) return 1
    // Otherwise sort alphabetically
    return a.localeCompare(b)
  })

  // Build ItemList schema for product collection
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Barware Collection',
    description: 'Professional bar tools and equipment for home mixologists.',
    url: 'https://jerrycanspirits.co.uk/shop/barware/',
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.title,
        description: product.description || `Premium barware from Jerry Can Spirits.`,
        url: `https://jerrycanspirits.co.uk/shop/product/${product.handle}/`,
        image: product.images?.[0]?.url || '',
        offers: {
          '@type': 'Offer',
          price: product.priceRange.minVariantPrice.amount,
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          availability: 'https://schema.org/InStock',
          priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'GB',
            },
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: '5.00',
              currency: 'GBP',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 2,
                maxValue: 3,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 2,
                maxValue: 5,
                unitCode: 'DAY',
              },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 14,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
            applicableCountry: 'GB',
          },
        },
      },
    })),
  }

  // Success state - products loaded from Shopify
  return (
    <main className="min-h-screen py-20">
      <StructuredData data={itemListSchema} id="barware-itemlist-schema" />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/shop' },
            { label: 'Barware' },
          ]}
        />
      </div>

      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Premium Barware
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Barware
            <br />
            <span className="text-gold-300">Tools for the Trade</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Professional-grade bar tools and equipment for the home mixologist. Precision instruments to help you craft the perfect cocktail every time.
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

      {/* Products by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {sortedCategories.map((category) => (
          <div key={category}>
            {/* Category Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-serif font-bold text-white">
                {category}
              </h2>
              <div className="mt-2 h-1 w-24 bg-gradient-to-r from-gold-500 to-transparent rounded-full"></div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {groupedProducts[category].map((product: ShopifyProduct, index: number) => (
            <ScrollReveal key={product.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
            <Link
              href={`/shop/product/${product.handle}`}
              className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105 block"
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
            </ScrollReveal>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* What You're Getting */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <ScrollReveal>
        <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <h3 className="text-2xl font-serif font-bold text-gold-300 mb-6 text-center">
            What You're Actually Getting
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Founder-Picked</h4>
              <p className="text-parchment-300 text-sm">
                We only stock barware we actually use at home. If it's in the shop, it's because we tested it and it works. No filler products.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Quality Over Quantity</h4>
              <p className="text-parchment-300 text-sm">
                Solid tools that do the job properly and last. We would rather sell you one good jigger than three that end up in a drawer.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Gives Back</h4>
              <p className="text-parchment-300 text-sm">
                Part of every sale supports forces charities. When you buy from us, you're helping us give back to causes we care about.
              </p>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Join the Expedition
          </h2>
          <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
            Sign up for exclusive access to limited releases, expedition updates, and cocktail recipes.
          </p>
          <Link
            href="/#newsletter-signup"
            className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Get Early Access
          </Link>
        </div>
      </section>
    </main>
  )
}
