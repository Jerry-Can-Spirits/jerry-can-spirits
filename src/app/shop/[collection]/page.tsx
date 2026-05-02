import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCollection, getProduct, type ShopifyProduct } from '@/lib/shopify'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import { OG_IMAGE } from '@/lib/og'
import { CATEGORIES } from '@/lib/categories'
import AddToCartButton from '@/components/AddToCartButton'
import ViewItemListTracker from '@/components/ViewItemListTracker'
import { safeJsonLd } from '@/lib/jsonLd'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://jerrycanspirits.co.uk'

function formatPrice(amount: string, currencyCode: string): string {
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }
  return `${symbols[currencyCode] || currencyCode}${parseFloat(amount).toFixed(2)}`
}

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>
}): Promise<Metadata> {
  const { collection } = await params
  const category = CATEGORIES[collection]

  const title = category?.metaTitle ?? `${slugToTitle(collection)} | Jerry Can Spirits`
  const description =
    category?.metaDescription ??
    `Shop ${slugToTitle(collection)} from Jerry Can Spirits. Veteran-owned British spirits, built properly, no shortcuts.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/shop/${collection}/` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/shop/${collection}/`,
      siteName: 'Jerry Can Spirits®',
      locale: 'en_GB',
      type: 'website',
      images: OG_IMAGE,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: OG_IMAGE,
    },
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>
}) {
  const { collection } = await params
  const category = CATEGORIES[collection]

  const h1 = category?.h1 ?? slugToTitle(collection)
  const introBody = category?.introBody ?? []

  let products: ShopifyProduct[] = []
  let error: string | null = null

  try {
    if (category?.productHandles) {
      const fetched = await Promise.all(category.productHandles.map(h => getProduct(h)))
      products = fetched.filter((p): p is ShopifyProduct => p !== null)
    } else {
      products = await getProductsByCollection(collection)
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Jerry Can Spirits — ${h1}`,
    url: `${BASE_URL}/shop/${collection}/`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        description: p.description,
        url: `${BASE_URL}/shop/product/${p.handle}`,
        image: p.images?.[0]?.url,
        brand: { '@type': 'Brand', name: 'Jerry Can Spirits' },
        offers: {
          '@type': 'Offer',
          price: p.priceRange.minVariantPrice.amount,
          priceCurrency: p.priceRange.minVariantPrice.currencyCode,
          availability: p.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${BASE_URL}/shop/product/${p.handle}`,
        },
      },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${BASE_URL}/shop/` },
      { '@type': 'ListItem', position: 3, name: h1, item: `${BASE_URL}/shop/${collection}/` },
    ],
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
            <h1 className="text-4xl font-serif font-bold text-white">Shopify Connection Failed</h1>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-left">
              <p className="text-red-300 font-mono text-sm">{error}</p>
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

  if (products.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="mb-8">
              <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: h1 }]} />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white">{h1}</h1>
            <p className="text-xl text-parchment-200">Nothing here yet. Check back soon.</p>
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

  const trackerItems = products.map((p, i) => ({
    item_id: p.id.split('/').pop() ?? p.id,
    item_name: p.title,
    index: i,
    price: parseFloat(p.priceRange.minVariantPrice.amount),
  }))
  const currency = products[0]?.priceRange.minVariantPrice.currencyCode ?? 'GBP'

  return (
    <main className="min-h-screen py-20">
      <ViewItemListTracker listId={collection} listName={h1} currency={currency} items={trackerItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: h1 }]} />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              {h1}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">{h1}</h1>
        </div>

        {introBody.length > 0 && (
          <div className="max-w-3xl mx-auto mb-8 space-y-4">
            {introBody.map((para) => (
              <p key={para.slice(0, 40)} className="text-parchment-300 text-lg leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        )}

      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => {
            const variants = product.variants ?? []
            const defaultVariant = variants.length === 1 && variants[0].title === 'Default Title'
              ? variants[0]
              : null
            const productUrl = `/shop/product/${product.handle}`

            return (
              <div
                key={product.id}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 flex flex-col h-full"
              >
                <Link href={productUrl} className="flex-1 flex flex-col">
                  <div className="relative aspect-square bg-jerry-green-800/20 flex items-center justify-center p-4">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.title}
                        fill
                        loading="lazy"
                        className="object-contain group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gold-500/30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 lg:p-6 pb-0 space-y-2 flex-1">
                    <h2 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
                      {product.title}
                    </h2>
                    <p className="text-lg font-serif font-bold text-gold-400">
                      {formatPrice(
                        product.priceRange.minVariantPrice.amount,
                        product.priceRange.minVariantPrice.currencyCode,
                      )}
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
            )
          })}
        </div>
      </section>

      {/* Category-specific SEO content */}
      {(category?.seoTitle || category?.pillars) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-10">
          {category.pillars && (
            <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              {category.seoTitle && (
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-8 text-center">
                  {category.seoTitle}
                </h2>
              )}
              <div className="grid md:grid-cols-3 gap-6">
                {category.pillars.map((pillar) => (
                  <div key={pillar.title} className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">{pillar.title}</h3>
                    <p className="text-parchment-300 text-sm leading-relaxed">{pillar.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {category.seoBody && category.seoBody.length > 0 && (
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              {category.seoTitle && !category.pillars && (
                <h2 className="text-3xl font-serif font-bold text-white mb-6">{category.seoTitle}</h2>
              )}
              <div className="space-y-4 text-parchment-200 leading-relaxed">
                {category.seoBody.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Universal brand trust section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { title: 'Veteran-Owned', body: 'Founded by two Royal Corps of Signals veterans. Bootstrapped, no investors, no shortcuts. The same standards we applied to kit that had to work.' },
            { title: 'Real Ingredients', body: 'Every product stocked on this site is chosen because it does its job properly. No filler. Nothing that does not belong there.' },
            { title: '5% to Forces Charities', body: 'Part of every sale goes to forces charities. Armed Forces Covenant signatories. ERS Bronze Award holders. When you buy from us, you give back.' },
          ].map((item) => (
            <div key={item.title} className="p-6 bg-jerry-green-800/30 rounded-xl border border-gold-500/10">
              <h3 className="text-base font-semibold text-gold-300 mb-2">{item.title}</h3>
              <p className="text-parchment-400 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Join the Expedition</h2>
          <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
            Sign up for batch release updates, new product drops, and cocktail recipes from the Field Manual.
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
