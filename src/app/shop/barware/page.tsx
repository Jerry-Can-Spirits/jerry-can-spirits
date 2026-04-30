import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCollection, type ShopifyProduct } from '@/lib/shopify'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import { GB_SHIPPING_DETAILS } from '@/lib/shippingSchema'
import StructuredData from '@/components/StructuredData'
import ScrollReveal from '@/components/ScrollReveal'
import AddToCartButton from '@/components/AddToCartButton'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Cocktail Shaker Sets, Barware & Bar Tools',
  description: 'Cocktail shaker sets, bar tools, and glassware for crafting rum cocktails at home. Everything you need to build a proper home bar.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shop/barware/',
  },
  openGraph: {
    title: 'Cocktail Shaker Sets, Barware & Bar Tools | Jerry Can Spirits®',
    description: 'Cocktail shaker sets, bar tools, and glassware for crafting rum cocktails at home. Everything you need to build a proper home bar.',
    url: 'https://jerrycanspirits.co.uk/shop/barware/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Cocktail Shaker Sets, Barware & Bar Tools | Jerry Can Spirits®',
    description: 'Cocktail shaker sets, bar tools, and glassware for crafting rum cocktails at home. Everything you need to build a proper home bar.',
    images: OG_IMAGE,
  },
}

export const dynamic = 'force-dynamic'

function formatPrice(amount: string, currencyCode: string): string {
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }
  return `${symbols[currencyCode] || currencyCode}${parseFloat(amount).toFixed(2)}`
}

const SUB_CATEGORIES = [
  { label: 'Bar Accessories', href: '/shop/bar-accessories/' },
  { label: 'Cocktail Shakers', href: '/shop/cocktail-shakers/' },
  { label: 'Cocktail Making Kits', href: '/shop/cocktail-making-kits/' },
  { label: 'Rum Glasses', href: '/shop/rum-glasses/' },
  { label: 'Cocktail Glasses', href: '/shop/cocktail-glasses-glassware/' },
  { label: 'Hip Flasks', href: '/shop/hip-flasks/' },
  { label: 'Ice & Chilling', href: '/shop/ice-chilling/' },
]

export default async function BarwarePage() {
  let products: ShopifyProduct[] = []
  let error: string | null = null

  try {
    products = await getProductsByCollection('barware')
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error occurred'
    console.error('Shopify fetch error:', e)
  }

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
              <p className="text-red-300 font-mono text-sm">Error: {error}</p>
            </div>
            <Link href="/shop/" className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors">
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (products.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">Bar Accessories</h1>
            <p className="text-xl text-parchment-200">Nothing here yet. Check back soon.</p>
            <Link href="/shop/" className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors">
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jerrycanspirits.co.uk' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://jerrycanspirits.co.uk/shop/' },
      { '@type': 'ListItem', position: 3, name: 'Barware', item: 'https://jerrycanspirits.co.uk/shop/barware/' },
    ],
  }

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
        description: product.description || 'Bar accessories from Jerry Can Spirits.',
        url: `https://jerrycanspirits.co.uk/shop/product/${product.handle}/`,
        image: product.images?.[0]?.url || '',
        offers: {
          '@type': 'Offer',
          price: product.priceRange.minVariantPrice.amount,
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          shippingDetails: GB_SHIPPING_DETAILS,
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

  return (
    <main className="min-h-screen py-20">
      <StructuredData data={breadcrumbSchema} id="barware-breadcrumb-schema" />
      <StructuredData data={itemListSchema} id="barware-itemlist-schema" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Barware' }]} />
      </div>

      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Bar Accessories
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Barware
            <br />
            <span className="text-gold-300">Built to Work</span>
          </h1>
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Tools selected for function. A shaker that seals. A jigger that measures. Glassware that holds a drink the way it was designed to be held. No shortcuts.
          </p>
        </div>

        {/* Sub-category navigation */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUB_CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="px-4 py-2 bg-jerry-green-800/40 border border-gold-500/20 rounded-full text-parchment-300 hover:text-gold-300 hover:border-gold-500/40 text-sm font-medium transition-all duration-200"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product: ShopifyProduct, index: number) => {
            const variants = product.variants ?? []
            const defaultVariant = variants.length === 1 && variants[0].title === 'Default Title'
              ? variants[0]
              : null
            const productUrl = `/shop/product/${product.handle}`

            return (
              <ScrollReveal key={product.id} delay={(index % 4) as 0 | 1 | 2 | 3} className="h-full">
                <div className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 flex flex-col h-full">
                  <Link href={productUrl} className="flex-1 flex flex-col">
                    <div className="relative aspect-square bg-jerry-green-800/20 flex items-center justify-center p-4">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.title}
                          fill
                          loading="lazy"
                          className="object-contain group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 lg:p-6 pb-0 space-y-2 flex-1">
                      <h2 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
                        {product.title}
                      </h2>
                      <p className="text-lg font-serif font-bold text-gold-400">
                        {formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                      </p>
                    </div>
                  </Link>
                  <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 pt-2">
                    {defaultVariant && defaultVariant.availableForSale ? (
                      <AddToCartButton
                        variantId={defaultVariant.id}
                        productTitle={product.title}
                        price={defaultVariant.price.amount}
                        currencyCode={defaultVariant.price.currencyCode}
                      />
                    ) : (
                      <Link
                        href={productUrl}
                        className="block w-full mt-1 px-4 py-2 border border-gold-500/40 hover:border-gold-400 text-gold-300 hover:text-gold-200 text-sm font-semibold rounded-lg text-center transition-all duration-200"
                      >
                        {variants.length > 1 ? 'View Options' : 'View'}
                      </Link>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* SEO Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-10">
        <ScrollReveal>
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-gold-300 mb-8 text-center">
              How to Build a Home Bar That Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Start With the Shaker', body: 'The shaker is the foundation. It has one job: seal and chill. A stainless steel cobbler shaker does both without failing. No chrome plating to peel, no plastic seal to split.' },
                { title: 'Measure Accurately', body: 'A jigger is not optional. Guessing volumes produces inconsistent drinks. Measure in 25ml and 50ml and every cocktail comes out the same way, every time.' },
                { title: 'Choose the Right Glass', body: 'Shape affects how a drink tastes. A highball for long drinks. A rocks glass for spirits over ice. The right vessel changes how the aroma reaches you and how quickly the drink warms.' },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-parchment-300 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                What We Stock and Why
              </h2>
              <div className="space-y-3 text-parchment-200 leading-relaxed text-sm">
                <p>
                  Every piece of barware in this collection is something we use ourselves. The stainless steel shaker seals without leaking. The jigger measures in 25ml and 50ml. The glassware is selected for the drinks you are likely to make with it.
                </p>
                <p>
                  We did not curate a range based on what margins looked like. We stocked what works. If it is here, it passed the test. Nothing that looked good in a box and failed in practice.
                </p>
                <p>
                  The same logic that went into Expedition Spiced Rum went into this range. No shortcuts. Nothing that does not belong there.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                The Field Manual
              </h2>
              <div className="space-y-3 text-parchment-200 leading-relaxed text-sm">
                <p>
                  Every tool in this collection is referenced in the Field Manual alongside the recipes that make use of it. Cocktail guides written for people who want to make a proper drink at home, not a simplified version of one.
                </p>
                <p>
                  Rum Old Fashioned. Rum Sour. Storm and Spice. Techniques for stirring, shaking, and building correctly. The equipment and the knowledge, in one place.
                </p>
                <Link href="/field-manual/" className="inline-block text-gold-400 hover:text-gold-300 font-semibold text-sm transition-colors">
                  Browse the Field Manual →
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Join the Expedition
          </h2>
          <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
            Sign up for new product drops, cocktail recipes from the Field Manual, and batch release updates.
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
