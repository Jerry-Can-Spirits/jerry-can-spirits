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
              <ScrollReveal key={product.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <div className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300">
                  <Link href={productUrl} className="block">
                    <div className="relative aspect-square bg-jerry-green-800/20 flex items-center justify-center p-4">
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
                          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 lg:p-6 pb-0 space-y-2">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <ScrollReveal>
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 mb-12">
            <h2 className="text-2xl font-serif font-bold text-gold-300 mb-6 text-center">
              The Right Tool for the Job
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Founder-Tested</h3>
                <p className="text-parchment-300 text-sm">
                  Every piece of barware in this shop is something we actually use. If it's here, it passed the test. Nothing that looked good in a box but failed in practice.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Built to Last</h3>
                <p className="text-parchment-300 text-sm">
                  Stainless steel. No chrome plating to flake. No plastic seals to split. These are tools designed to be used regularly, not decorative pieces that end up in the back of a cupboard.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Use the Field Manual</h3>
                <p className="text-parchment-300 text-sm">
                  Every tool here is referenced in the Field Manual. Cocktail recipes, techniques, and serving guides written for people who drink properly. The equipment and the knowledge, in one place.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 mb-12">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">
              A Home Bar Does Not Need to Be Complicated
            </h2>
            <div className="space-y-4 text-parchment-200 leading-relaxed">
              <p>
                It needs the right tools, used correctly. A cocktail shaker that seals properly. A jigger that measures accurately. Glassware that holds a drink the way it was designed to be held.
              </p>
              <p>
                These are not decorative. They are equipment. The same logic applies here as with Expedition Spiced Rum. No shortcuts. Nothing that does not belong there.
              </p>
              <p>
                Whether you are building a home bar from scratch or replacing something that has seen better days, start with tools that will not let you down. The{' '}
                <Link href="/field-manual/" className="text-gold-400 hover:text-gold-300 underline">
                  Field Manual
                </Link>{' '}
                has everything you need to know about using them properly.
              </p>
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
