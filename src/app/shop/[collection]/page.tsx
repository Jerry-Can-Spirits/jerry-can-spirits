import Link from 'next/link'
import Image from 'next/image'
import { getProductsByCollection, type ShopifyProduct } from '@/lib/shopify'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://jerrycanspirits.co.uk'

function titleFromHandle(handle: string): string {
  return handle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatPrice(amount: string, currencyCode: string): string {
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }
  return `${symbols[currencyCode] || currencyCode}${parseFloat(amount).toFixed(2)}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>
}): Promise<Metadata> {
  const { collection } = await params
  const title = titleFromHandle(collection)
  return {
    title: `${title} | Jerry Can Spirits`,
    description: `${title} from Jerry Can Spirits. Veteran-owned British craft spirits and barware.`,
    alternates: { canonical: `${BASE_URL}/shop/${collection}/` },
    openGraph: {
      title: `${title} | Jerry Can Spirits®`,
      description: `${title} from Jerry Can Spirits. Veteran-owned British craft spirits and barware.`,
      url: `${BASE_URL}/shop/${collection}/`,
      siteName: 'Jerry Can Spirits®',
    },
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>
}) {
  const { collection } = await params
  const title = titleFromHandle(collection)

  let products: ShopifyProduct[] = []
  let error: string | null = null

  try {
    products = await getProductsByCollection(collection)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
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
            <h1 className="text-4xl font-serif font-bold text-white">
              Shopify Connection Failed
            </h1>
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
              <Breadcrumbs
                items={[{ label: 'Shop', href: '/shop' }, { label: title }]}
              />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white">{title}</h1>
            <p className="text-xl text-parchment-200">
              Nothing here yet. Check back soon.
            </p>
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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Jerry Can Spirits — ${title}`,
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
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/shop/product/${p.handle}`,
        },
      },
    })),
  }

  return (
    <main className="min-h-screen py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[{ label: 'Shop', href: '/shop' }, { label: title }]}
        />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              {title}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            {title}
          </h1>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-800/20 border border-green-500/30 rounded-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm font-medium">
              {products.length} {products.length === 1 ? 'product' : 'products'} loaded
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/shop/product/${product.handle}`}
              className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
            >
              <div className="relative aspect-square bg-jerry-green-800/20 flex items-center justify-center p-4">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.title}
                    fill
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
              <div className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3">
                <h2 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
                  {product.title}
                </h2>
                <div className="flex items-center justify-between pt-1 sm:pt-2">
                  <p className="text-lg font-serif font-bold text-gold-400">
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Join the Expedition
          </h2>
          <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
            Sign up for exclusive access to limited releases and new product drops.
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
