import Image from 'next/image'
import Link from 'next/link'
import AddToCartButton from '@/components/AddToCartButton'
import { formatPrice } from '@/lib/format-price'
import type { ShopifyProduct } from '@/lib/shopify'

// The one product card. Until this file existed the collection pages and the
// product page's related grid each hand-rolled their own, so a change to how
// a price or an add-to-basket button reads had to be made four times or drift.
// This is the collection page's card, lifted as-is. Shows the live price,
// "from" only when the variants actually span prices, and an add-to-basket
// button when there is exactly one variant to add.
export default function ProductCard({ product, priority = false }: { product: ShopifyProduct; priority?: boolean }) {
  const variants = product.variants ?? []
  const defaultVariant = variants.length === 1 && variants[0].title === 'Default Title' ? variants[0] : null
  const hasPriceRange = variants.length > 1 && new Set(variants.map((v) => v.price.amount)).size > 1
  const productUrl = `/shop/product/${product.handle}/`

  return (
    <div className="group bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 flex flex-col h-full">
      <Link href={productUrl} className="flex-1 flex flex-col">
        <div className="relative aspect-square bg-jerry-green-800/20 flex items-center justify-center p-4">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText || product.title}
              fill
              loading={priority ? 'eager' : 'lazy'}
              className="object-contain group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-gold-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4 lg:p-6 pb-0 space-y-2 flex-1">
          <h3 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2">
            {product.title}
          </h3>
          <p className="text-lg font-serif font-bold text-gold-400">
            {hasPriceRange ? 'from ' : ''}
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
  )
}
