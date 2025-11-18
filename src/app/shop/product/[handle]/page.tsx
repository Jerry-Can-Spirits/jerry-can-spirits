import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getProduct, type ShopifyProduct } from '@/lib/shopify'
import AddToCartButton from '@/components/AddToCartButton'
import type { Metadata } from 'next'

// Configure for Cloudflare Pages Edge Runtime
export const runtime = 'edge'

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  try {
    const product = await getProduct(handle)

    if (!product) {
      return {
        title: 'Product Not Found | Jerry Can Spirits',
      }
    }

    return {
      title: `${product.title} | Jerry Can Spirits`,
      description: product.description.slice(0, 155),
      openGraph: {
        title: product.title,
        description: product.description.slice(0, 155),
        images: product.images.length > 0 ? [product.images[0].url] : [],
      },
    }
  } catch {
    return {
      title: 'Product Not Found | Jerry Can Spirits',
    }
  }
}

// Helper to format price with currency symbol
function formatPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount)

  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currencyCode] || currencyCode
  return `${symbol}${price.toFixed(2)}`
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  let product: ShopifyProduct | null = null

  try {
    product = await getProduct(handle)
  } catch (error) {
    console.error('Error fetching product:', error)
    notFound()
  }

  if (!product) {
    notFound()
  }

  // Debug: Log product variant info
  console.log('📦 Product variants:', product.variants)
  console.log('🔑 First variant ID:', product.variants?.[0]?.id)
  console.log('✅ Available for sale:', product.variants?.[0]?.availableForSale)
  console.log('📊 Quantity available:', product.variants?.[0]?.quantityAvailable)

  const mainImage = product.images[0]
  const price = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  )

  const firstVariant = product.variants?.[0]

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400 flex items-center gap-2">
          <Link href="/shop" className="hover:text-gold-300 transition-colors">
            Shop
          </Link>
          <span>→</span>
          <Link href="/shop/drinks" className="hover:text-gold-300 transition-colors">
            Drinks
          </Link>
          <span>→</span>
          <span className="text-gold-300">{product.title}</span>
        </nav>
      </div>

      {/* Product Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            {mainImage ? (
              <div className="relative aspect-square bg-jerry-green-800/20 rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src={mainImage.url}
                  alt={mainImage.altText || product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-square bg-jerry-green-800/20 rounded-xl flex items-center justify-center border border-gold-500/20">
                <svg
                  className="w-24 h-24 text-gold-500/30"
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

            {/* Thumbnail images if there are multiple */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-jerry-green-800/20 rounded-lg overflow-hidden border border-gold-500/20 cursor-pointer hover:border-gold-400/40 transition-colors"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText || `${product.title} - Image ${index + 2}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
                {product.title}
              </h1>
              <p className="text-4xl font-serif font-bold text-gold-400">
                {price}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-parchment-200 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gold-300">Options:</h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex justify-between items-center p-3 bg-jerry-green-800/20 rounded-lg border border-gold-500/20"
                    >
                      <span className="text-parchment-200">{variant.title}</span>
                      <span className="font-semibold text-gold-400">
                        {formatPrice(variant.price.amount, variant.price.currencyCode)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="pt-6">
              {firstVariant && firstVariant.availableForSale ? (
                <AddToCartButton
                  variantId={firstVariant.id}
                  productTitle={product.title}
                />
              ) : (
                <div className="space-y-4">
                  <button
                    disabled
                    className="w-full px-8 py-4 bg-gray-500/50 text-gray-300 font-bold rounded-lg cursor-not-allowed"
                  >
                    Currently Unavailable
                  </button>
                  <p className="text-sm text-red-400 text-center">
                    This product is not available for purchase at the moment.
                    {firstVariant && (
                      <span className="block mt-2 text-xs font-mono bg-red-900/20 p-2 rounded">
                        Debug: availableForSale={String(firstVariant.availableForSale)},
                        quantityAvailable={firstVariant.quantityAvailable ?? 'null'}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Product Features/Highlights */}
            <div className="pt-6 border-t border-gold-500/20">
              <h3 className="text-lg font-semibold text-gold-300 mb-4">Product Details</h3>
              <ul className="space-y-2 text-parchment-300">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Crafted in Britain</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Small-batch production</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Premium quality ingredients</span>
                </li>
              </ul>
            </div>

            {/* Back to Shop Link */}
            <div className="pt-6">
              <Link
                href="/shop/drinks"
                className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Drinks
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
