import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProduct, getSmartRecommendations, type ShopifyProduct, type ShopifyMetafield } from '@/lib/shopify'
import AddToCartButton from '@/components/AddToCartButton'
import ProductImageGallery from '@/components/ProductImageGallery'
import StructuredData from '@/components/StructuredData'
import ProductPageTracking from '@/components/ProductPageTracking'
import ProductSpecifications from '@/components/ProductSpecifications'
import TastingNotes from '@/components/TastingNotes'
import ProductProcess from '@/components/ProductProcess'
import DutyPaidStatement from '@/components/DutyPaidStatement'
import ProductFAQ from '@/components/ProductFAQ'
import WhatsIncluded from '@/components/WhatsIncluded'
import DietaryInfo from '@/components/DietaryInfo'
import { client } from '@/sanity/lib/client'
import { productByHandleQuery } from '@/sanity/queries'
import type { Metadata } from 'next'

// Sanity product data type
interface SanityProduct {
  _id: string
  name: string
  slug: { current: string }
  shopifyHandle: string
  tastingNotes?: {
    aroma: string
    palate: string
    finish: string
  }
  process?: string
  flavorProfile?: {
    primary: string[]
    strength: string
  }
  servingSuggestions?: string[]
  pairsWith?: string[]
  professionalTip?: string
  history?: string
  image?: string
  featured?: boolean
  videoUrl?: string
  relatedCocktails?: Array<{ _id: string; name: string; slug: { current: string } }>
  whatsIncluded?: Array<{
    item: string
    description?: string
    quantity?: number
  }>
  dietary?: {
    vegan?: boolean
    vegetarian?: boolean
    glutenFree?: boolean
    allergens?: string
    additionalInfo?: string
  }
  faqs?: Array<{
    question: string
    answer: string
  }>
}

// Cloudflare Pages edge runtime for dynamic routes
export const runtime = 'edge'

// Map Shopify productType to breadcrumb category
function getCategoryFromProductType(productType?: string): { label: string; href: string; trackingCategory: string } {
  const type = (productType || '').toLowerCase()

  if (type.includes('spirit') || type.includes('rum') || type.includes('alcohol') || type.includes('drink')) {
    return { label: 'Drinks', href: '/shop/drinks/', trackingCategory: 'Spirits' }
  }
  if (type.includes('barware') || type.includes('glass') || type.includes('bar')) {
    return { label: 'Barware', href: '/shop/barware/', trackingCategory: 'Barware' }
  }
  if (type.includes('cloth') || type.includes('apparel') || type.includes('merch')) {
    return { label: 'Clothing', href: '/shop/clothing/', trackingCategory: 'Clothing' }
  }

  // Default fallback
  return { label: 'Products', href: '/shop/', trackingCategory: 'Products' }
}

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
        title: 'Product Not Found',
      }
    }

    const description = product.description.slice(0, 155) || `Premium British spirits from Jerry Can Spirits. Veteran-owned spirits crafted with military precision. ${product.title} - engineered for reliability, designed for adventure.`

    return {
      title: `${product.title} - Premium British Spirits`,
      description,
      keywords: `${product.title}, British spirits, veteran owned, premium spirits, military heritage, Jerry Can Spirits, expedition spirits, small batch, craft spirits`,
      alternates: {
        canonical: `https://jerrycanspirits.co.uk/shop/product/${handle}/`,
      },
      openGraph: {
        title: `${product.title} | Jerry Can Spirits®`,
        description,
        images: product.images.length > 0 ? [product.images[0].url] : [],
        type: 'website',
        siteName: 'Jerry Can Spirits®',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.title} | Jerry Can Spirits®`,
        description,
        images: product.images.length > 0 ? [product.images[0].url] : [],
      },
    }
  } catch {
    return {
      title: 'Product Not Found',
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
  let relatedProducts: ShopifyProduct[] = []
  let sanityProduct: SanityProduct | null = null

  try {
    // Fetch Shopify product and Sanity product data in parallel
    // Sanity slug is typically the handle without the brand prefix
    const slug = handle.replace('jerry-can-spirits-', '')

    const [shopifyProduct, sanityData] = await Promise.all([
      getProduct(handle),
      client.fetch(productByHandleQuery, { slug, handle }).catch(() => null)
    ])

    product = shopifyProduct
    sanityProduct = sanityData

    if (!product) {
      notFound()
    }

    // Get smart product recommendations
    // - Prioritizes same collection (drinks → drinks, barware → barware)
    // - Intelligent cross-sell (spirits → glasses, etc.)
    // - Scores by: collection match, availability, price similarity
    relatedProducts = await getSmartRecommendations(product, 4)
  } catch (error) {
    console.error('Error fetching product:', error)
    notFound()
  }

  // Debug: Log product variant info
  console.log('Product variants:', product.variants)
  console.log('First variant ID:', product.variants?.[0]?.id)
  console.log('Available for sale:', product.variants?.[0]?.availableForSale)
  console.log('Quantity available:', product.variants?.[0]?.quantityAvailable)

  const price = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  )

  const firstVariant = product.variants?.[0]

  // Get category based on product type (moved up for schema use)
  const category = getCategoryFromProductType(product.productType)

  // Get ABV and volume from metafields if available
  const abvMetafield = product.metafields?.find(m => m?.namespace === 'custom' && m?.key === 'abv')
  const volumeMetafield = product.metafields?.find(m => m?.namespace === 'custom' && m?.key === 'volume')
  const abv = abvMetafield?.value || '40'
  const volume = volumeMetafield?.value || '700ml'

  // Determine if this is a spirit/alcohol product
  const isSpirit = category.trackingCategory === 'Spirits'

  // Product structured data - Enhanced for rich snippets
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://jerrycanspirits.co.uk/shop/product/${handle}/#product`,
    name: product.title,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: handle,
    mpn: handle,
    brand: {
      '@type': 'Brand',
      name: 'Jerry Can Spirits',
      url: 'https://jerrycanspirits.co.uk',
      logo: 'https://jerrycanspirits.co.uk/images/Logo.webp',
    },
    category: isSpirit ? 'Food & Beverages > Beverages > Alcoholic Beverages > Spirits > Rum' : 'Home & Garden > Kitchen & Dining > Barware',
    countryOfOrigin: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    offers: {
      '@type': 'Offer',
      '@id': `https://jerrycanspirits.co.uk/shop/product/${handle}/#offer`,
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: firstVariant?.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      url: `https://jerrycanspirits.co.uk/shop/product/${handle}/`,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'GB',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
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
      seller: {
        '@type': 'Organization',
        name: 'Jerry Can Spirits',
        url: 'https://jerrycanspirits.co.uk',
      },
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Jerry Can Spirits Ltd',
      url: 'https://jerrycanspirits.co.uk',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Blackpool',
        addressRegion: 'Lancashire',
        addressCountry: 'GB',
      },
    },
    // Additional properties for spirits
    ...(isSpirit && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Alcohol by Volume (ABV)',
          value: `${abv}%`,
        },
        {
          '@type': 'PropertyValue',
          name: 'Volume',
          value: volume,
        },
        {
          '@type': 'PropertyValue',
          name: 'Spirit Type',
          value: 'Spiced Rum',
        },
        {
          '@type': 'PropertyValue',
          name: 'Production Method',
          value: 'Small Batch',
        },
      ],
    }),
  }

  // Breadcrumb structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Shop',
        item: 'https://jerrycanspirits.co.uk/shop/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.label,
        item: `https://jerrycanspirits.co.uk${category.href}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `https://jerrycanspirits.co.uk/shop/product/${handle}/`,
      },
    ],
  }

  return (
    <main className="min-h-screen py-20">
      <StructuredData data={productSchema} id="product-schema" />
      <StructuredData data={breadcrumbSchema} id="breadcrumb-schema" />
      <ProductPageTracking
        productId={product.id}
        productName={product.title}
        price={product.priceRange.minVariantPrice.amount}
        currency={product.priceRange.minVariantPrice.currencyCode}
        category={category.trackingCategory}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400 flex items-center gap-2">
          <Link href="/shop/" className="hover:text-gold-300 transition-colors">
            Shop
          </Link>
          <span>→</span>
          <Link href={category.href} className="hover:text-gold-300 transition-colors">
            {category.label}
          </Link>
          <span>→</span>
          <span className="text-gold-300">{product.title}</span>
        </nav>
      </div>

      {/* Product Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Gallery */}
          <ProductImageGallery images={product.images} productTitle={product.title} />

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
                  productId={product.id}
                  price={parseFloat(product.priceRange.minVariantPrice.amount)}
                  currency={product.priceRange.minVariantPrice.currencyCode}
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

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-gold-500/10">
                <div className="space-y-3 text-center">
                  <p className="text-sm text-parchment-400 tracking-wide">
                    Secure checkout · Express payment available
                  </p>
                  <div className="flex items-center justify-center gap-6 text-xs text-parchment-500 uppercase tracking-widest">
                    <span>SSL Secured</span>
                    <span className="text-gold-500/30">•</span>
                    <span>Shop Pay</span>
                    <span className="text-gold-500/30">•</span>
                    <span>Data Protected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Features/Highlights */}
            <div className="pt-6 border-t border-gold-500/20">
              <h3 className="text-lg font-semibold text-gold-300 mb-4">What You're Getting</h3>
              <ul className="space-y-2 text-parchment-300">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Made by veterans who actually drink what they make</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Distilled at Spirit of Wales - proper craft, not factory production</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Only 700 bottles per batch - once they're gone, they're gone</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Part of every sale goes to forces charities - that's a promise</span>
                </li>
              </ul>
            </div>

            {/* Back to Shop Link */}
            <div className="pt-6">
              <Link
                href={category.href}
                className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {category.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details & Tasting Notes */}
      {(product.metafields || sanityProduct) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-8">
          {/* Product Specifications */}
          {product.metafields && product.metafields.length > 0 && (
            <ProductSpecifications
              metafields={product.metafields}
            />
          )}

          {/* Tasting Notes */}
          {sanityProduct?.tastingNotes && (
            <TastingNotes
              tastingNotes={sanityProduct.tastingNotes}
              flavorProfile={sanityProduct.flavorProfile}
              professionalTip={sanityProduct.professionalTip}
            />
          )}

          {/* Production Process */}
          {sanityProduct?.process && (
            <ProductProcess process={sanityProduct.process} />
          )}

          {/* Duty Paid Statement */}
          {product.metafields && product.metafields.filter(m => m !== null).some((m: ShopifyMetafield) => m.namespace === 'legal' && m.key === 'duty_statement') && (
            <DutyPaidStatement
              statement={
                product.metafields.filter(m => m !== null).find((m: ShopifyMetafield) => m.namespace === 'legal' && m.key === 'duty_statement')?.value || ''
              }
            />
          )}

          {/* What's Included (for gift packs/bundles) */}
          {sanityProduct?.whatsIncluded && sanityProduct.whatsIncluded.length > 0 && (
            <WhatsIncluded items={sanityProduct.whatsIncluded} />
          )}

          {/* Dietary Information */}
          {sanityProduct?.dietary && (
            <DietaryInfo dietary={sanityProduct.dietary} />
          )}

          {/* Product FAQs */}
          {sanityProduct?.faqs && sanityProduct.faqs.length > 0 && (
            <ProductFAQ faqs={sanityProduct.faqs} productName={product.title} />
          )}
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Customer Reviews</h2>
          <p className="text-parchment-300 mb-8">Be among the first to share your experience</p>

          {/* Placeholder for reviews - will show Trustpilot widget once reviews are available */}
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gold-500/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-xl font-serif font-bold text-gold-300 mb-2">Reviews Coming Soon</h3>
            <p className="text-parchment-300 max-w-md mx-auto">
              As a brand new product, we're collecting our first customer reviews. Check back soon to see what others think of {product.title}.
            </p>
          </div>

          {/* Uncomment when reviews are available:
          <TrustpilotWidget
            templateId="54ad5defc6454f065c28af8b"
            sku={handle}
            name={product.title}
            height="500px"
            theme="dark"
            stars=""
          />
          */}
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-3xl font-serif font-bold text-white mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/shop/product/${relatedProduct.handle}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 overflow-hidden"
              >
                {/* Product Image */}
                {relatedProduct.images.length > 0 && (
                  <div className="relative aspect-square bg-jerry-green-800/20 overflow-hidden">
                    <Image
                      src={relatedProduct.images[0].url}
                      alt={relatedProduct.images[0].altText || relatedProduct.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                    {relatedProduct.title}
                  </h3>
                  <p className="text-xl font-serif font-bold text-gold-400">
                    {formatPrice(
                      relatedProduct.priceRange.minVariantPrice.amount,
                      relatedProduct.priceRange.minVariantPrice.currencyCode
                    )}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-gold-300 text-sm">
                    <span>View Details</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
