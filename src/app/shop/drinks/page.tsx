import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCollection, type ShopifyProduct } from '@/lib/shopify'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'British Spiced Rum | Small-Batch Craft Rum',
  description: 'Small-batch British spiced rum from veteran-owned Jerry Can Spirits. 700 bottles per batch, pot-distilled at Spirit of Wales. Rich vanilla, warm spices, smooth finish.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shop/drinks/',
  },
  openGraph: {
    title: 'British Spiced Rum | Jerry Can Spirits®',
    description: 'Small-batch British spiced rum from veteran-owned Jerry Can Spirits. 700 bottles per batch, pot-distilled at Spirit of Wales.',
    url: 'https://jerrycanspirits.co.uk/shop/drinks/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

// Configure for Edge Runtime and dynamic rendering
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

  // Build ItemList schema for product collection
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Rum Collection',
    description: 'Small-batch British spiced rum from veteran-owned Jerry Can Spirits.',
    url: 'https://jerrycanspirits.co.uk/shop/drinks/',
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.title,
        description: product.description || `Premium British rum from Jerry Can Spirits.`,
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
      <StructuredData data={itemListSchema} id="drinks-itemlist-schema" />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/shop' },
            { label: 'Drinks' },
          ]}
        />
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
            Our Rum
            <br />
            <span className="text-gold-300">Small-Batch British Spirits</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            We make one thing and we make it properly. Expedition Spiced Rum - pot-distilled at Spirit of Wales, 700 bottles per batch, gone when they're gone.
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
          {products.map((product: ShopifyProduct, index: number) => (
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
      </section>

      {/* About Our Rum Collection - SEO Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <ScrollReveal>
          <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 h-full">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">
              What's in the Bottle
            </h2>
            <div className="space-y-4 text-parchment-200 leading-relaxed">
              <p>
                Expedition Spiced Rum starts with Caribbean white rum and Welsh brewery molasses. We blend these at Spirit of Wales Distillery in Newport, pot-distilling in small batches of just 700 bottles.
              </p>
              <p>
                The flavour profile opens with Madagascan vanilla and Ceylon cinnamon, moves into warming ginger and cassia through the middle, and finishes smooth with bourbon oak and a hint of citrus. It's designed to drink neat, work in cocktails, and hold its own over ice.
              </p>
              <p>
                We're not trying to be everything to everyone. This is spiced rum made by people who actually drink it - with 17 years of military service between us, we know what a proper drink should taste like at the end of a long day.
              </p>
            </div>
          </div>

          </ScrollReveal>
          <ScrollReveal delay={1}>
          <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 h-full">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">
              The Story Behind It
            </h2>
            <div className="space-y-4 text-parchment-200 leading-relaxed">
              <p>
                Jerry Can Spirits started because we couldn't find what we wanted on the shelf. After deployments where a proper drink meant everything, we came home to rum that tasted like it was made by accountants, not people who'd actually want to drink it.
              </p>
              <p>
                So we made our own. Royal Corps of Signals veterans, Armed Forces Covenant signatories, and genuinely obsessed with getting this right. Every batch gets the same attention we'd give to mission-critical kit.
              </p>
              <p>
                Part of every sale goes to forces charities. Because these are our mates and it's the right thing to do. If you're buying from us, you're supporting the veteran community whether you meant to or not.
              </p>
            </div>
          </div>
          </ScrollReveal>
        </div>

        {/* What You're Getting */}
        <ScrollReveal>
        <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 mb-16">
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
              <h4 className="text-lg font-semibold text-white mb-2">Veteran-Made</h4>
              <p className="text-parchment-300 text-sm">
                Built by Royal Corps of Signals veterans who spent 17 years between them learning that "good enough" isn't. Same standards we applied to kit that had to work, now applied to rum.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Properly Small-Batch</h4>
              <p className="text-parchment-300 text-sm">
                700 bottles per batch. Not a marketing number - that's genuinely what our pot still at Spirit of Wales produces. When a batch is gone, it's gone.
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
                Part of every sale supports forces charities. Armed Forces Covenant signatories. When you buy from us, you're supporting the veteran community - that's a promise.
              </p>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is spiced rum?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Spiced rum is rum infused with real spices and botanicals. Our Expedition Spiced Rum uses Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, and cassia bark, steeped slowly in Caribbean rum and sweetened naturally with agave. Unlike artificial-tasting rums, we use real ingredients to create depth and complexity."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How should I drink spiced rum?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "However you like it, honestly. Expedition Spiced Rum is designed to work three ways: neat (to taste the full flavour profile), over ice (opens up as it dilutes slightly), or in cocktails (holds its character against mixers). Classic pairings include ginger beer for a Storm and Spice, cola for simplicity, or apple juice for something different. Check our Field Manual for cocktail recipes."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What does 'small-batch' actually mean?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For us, it means exactly 700 bottles per batch. That's the capacity of our pot still at Spirit of Wales Distillery in Newport. It's not a marketing term - it's a physical limitation. When a batch sells out, that specific run is gone. We can make more, but each batch has subtle variations based on the distillation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is Jerry Can Spirits rum vegan?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Our Expedition Spiced Rum contains no animal products. The base is Caribbean white rum, we add Welsh brewery molasses, and the spice blend is entirely plant-based. No honey, no animal-derived filtering agents, no animal products in production."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where is Jerry Can Spirits rum made?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We blend and distil at Spirit of Wales Distillery in Newport, Wales. The base white rum comes from the Caribbean, and we source molasses from a Welsh brewery's production. The distillation, blending, spicing, and bottling all happen in Wales. We're a British rum brand making British rum."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does buying from Jerry Can Spirits support veterans?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We're veteran-owned (Royal Corps of Signals, 17 years' combined service) and Armed Forces Covenant signatories. Part of every sale goes to forces charities - not because it's good marketing but because these are our community. When you buy from us, you're directly supporting veteran entrepreneurs and forces welfare."
                  }
                }
              ]
            })
          }}
        />

        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <h2 className="text-3xl font-serif font-bold text-white mb-2">
            Common Questions
          </h2>
          <p className="text-parchment-400 mb-8">
            Straight answers about our rum
          </p>

          <div className="space-y-6">
            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">What is spiced rum?</h3>
              <p className="text-parchment-200 leading-relaxed">
                Spiced rum is rum infused with real spices and botanicals. Our Expedition Spiced Rum uses Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, and cassia bark, steeped slowly in Caribbean rum and sweetened naturally with agave. Unlike artificial-tasting rums, we use real ingredients to create depth and complexity.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">How should I drink spiced rum?</h3>
              <p className="text-parchment-200 leading-relaxed">
                However you like it, honestly. Expedition Spiced Rum is designed to work three ways: neat (to taste the full flavour profile), over ice (opens up as it dilutes slightly), or in cocktails (holds its character against mixers). Classic pairings include ginger beer for a Storm and Spice, cola for simplicity, or apple juice for something different. Check our <Link href="/field-manual/cocktails/" className="text-gold-400 hover:text-gold-300 underline">Field Manual</Link> for cocktail recipes.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">What does 'small-batch' actually mean?</h3>
              <p className="text-parchment-200 leading-relaxed">
                For us, it means exactly 700 bottles per batch. That's the capacity of our pot still at Spirit of Wales Distillery in Newport. It's not a marketing term - it's a physical limitation. When a batch sells out, that specific run is gone. We can make more, but each batch has subtle variations based on the distillation.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">Is Jerry Can Spirits rum vegan?</h3>
              <p className="text-parchment-200 leading-relaxed">
                Yes. Our Expedition Spiced Rum contains no animal products. The base is Caribbean white rum, we add Welsh brewery molasses, and the spice blend is entirely plant-based. No honey, no animal-derived filtering agents, no animal products in production.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">Where is Jerry Can Spirits rum made?</h3>
              <p className="text-parchment-200 leading-relaxed">
                We blend and distil at Spirit of Wales Distillery in Newport, Wales. The base white rum comes from the Caribbean, and we source molasses from a Welsh brewery's production. The distillation, blending, spicing, and bottling all happen in Wales. We're a British rum brand making British rum.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gold-300 mb-3">How does buying from Jerry Can Spirits support veterans?</h3>
              <p className="text-parchment-200 leading-relaxed">
                We're veteran-owned (Royal Corps of Signals, 17 years' combined service) and Armed Forces Covenant signatories. Part of every sale goes to forces charities - not because it's good marketing but because these are our community. When you buy from us, you're directly supporting veteran entrepreneurs and forces welfare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Try It Yourself
          </h2>
          <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
            Join our mailing list for batch release updates, cocktail recipes from the Field Manual, and the occasional story from the road. No spam - just rum news when there's rum news.
          </p>
          <Link
            href="/#newsletter-signup"
            className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Join the List
          </Link>
        </div>
      </section>
    </main>
  )
}
