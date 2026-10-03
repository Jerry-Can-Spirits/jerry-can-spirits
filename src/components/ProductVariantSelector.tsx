'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { trackAddToCart } from '@/components/GoogleTag'
import type { ShopifyProductVariant, ShopifyImage } from '@/lib/shopify'
import { trackEventDual } from '@/lib/meta-capi'
import { formatPrice } from '@/lib/format-price'

interface ProductVariantSelectorProps {
  variants: ShopifyProductVariant[]
  productTitle: string
  productId: string
  productImages: ShopifyImage[]
  currencyCode: string
}

// Helper to format price

export default function ProductVariantSelector({
  variants,
  productTitle,
  productId,
  productImages,
  currencyCode,
}: ProductVariantSelectorProps) {
  const { addToCart, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)

  // Find first available variant
  const availableVariants = variants.filter(v => v.availableForSale)
  const [selectedVariantId, setSelectedVariantId] = useState(
    availableVariants[0]?.id || variants[0]?.id
  )

  const selectedVariant = variants.find(v => v.id === selectedVariantId)
  const hasMultipleVariants = variants.length > 1 && variants.some(v => v.title !== 'Default Title')

  // Get current image (variant image if available, else first product image)
  const currentImage = selectedVariant?.image || productImages[0]

  const handleAddToCart = async () => {
    if (!selectedVariant) return

    const atcPayload = {
      content_name: productTitle,
      content_ids: [selectedVariantId.split('/').pop() ?? selectedVariantId],
      content_type: 'product',
      value: parseFloat(selectedVariant.price.amount) * quantity,
      currency: currencyCode,
    }

    // Track AddToCart via Meta Pixel + CAPI (consent-gated inside trackEventDual)
    trackEventDual('AddToCart', atcPayload)

    // Track AddToCart event for Google Ads and GA4
    trackAddToCart(
      productId,
      productTitle,
      parseFloat(selectedVariant.price.amount),
      currencyCode,
      quantity
    )

    await addToCart(selectedVariantId, quantity)
  }

  if (!selectedVariant) {
    return (
      <div className="space-y-4">
        <button
          disabled
          className="w-full px-8 py-4 bg-jerry-green-800/30 text-parchment-400 font-bold rounded-lg cursor-not-allowed"
        >
          Currently Unavailable
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Variant Image - only show if variant has specific image */}
      {hasMultipleVariants && currentImage && selectedVariant.image && (
        <div className="relative aspect-square w-32 bg-jerry-green-800/20 rounded-lg overflow-hidden border border-gold-500/20">
          <Image
            src={currentImage.url}
            alt={currentImage.altText || `${productTitle} - ${selectedVariant.title}`}
            fill
            className="object-contain p-2"
            sizes="128px"
          />
        </div>
      )}

      {/* Variant Selector */}
      {hasMultipleVariants && (
        <div>
          <label
            htmlFor="variant-selector"
            className="block text-sm font-semibold text-gold-300 mb-2"
          >
            Select Option
          </label>
          <select
            id="variant-selector"
            name="variant-selector"
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white cursor-pointer focus:outline-hidden focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
            style={{ colorScheme: 'dark' }}
          >
            {variants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
                disabled={!variant.availableForSale}
                className="bg-jerry-green-900 text-white"
              >
                {variant.title} - {formatPrice(variant.price.amount, currencyCode)}
                {!variant.availableForSale && ' (Out of Stock)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected variant price display */}
      {hasMultipleVariants && (
        <div className="flex items-baseline gap-4">
          <div className="text-2xl font-serif font-bold text-gold-400">
            {formatPrice(selectedVariant.price.amount, currencyCode)}
          </div>
          {selectedVariant.compareAtPrice &&
            parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount) && (
            <div className="text-xl font-serif text-parchment-400 line-through">
              {formatPrice(selectedVariant.compareAtPrice.amount, currencyCode)}
            </div>
          )}
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-semibold text-gold-300 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isLoading || quantity <= 1}
            className="w-11 h-11 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded-sm border border-gold-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <svg
              className="w-5 h-5 text-parchment-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 min-h-11 px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-white text-base text-center font-semibold focus:outline-hidden focus:border-gold-400"
          />

          <button
            onClick={() => setQuantity(quantity + 1)}
            disabled={isLoading}
            className="w-11 h-11 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded-sm border border-gold-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <svg
              className="w-5 h-5 text-parchment-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* The one call to action. The ghost "Order now" that sat under it went
          straight to Shopify and so skipped the drawer, its free-delivery
          nudge and its cross-sell (Audit B, 3 Oct 2026). Checkout is the
          drawer's job. */}
      <button
        onClick={handleAddToCart}
        disabled={isLoading || !selectedVariant.availableForSale}
        className="w-full px-8 py-4 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Adding...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Add to basket
          </>
        )}
      </button>
    </div>
  )
}
