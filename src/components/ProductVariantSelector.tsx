'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { trackAddToCart } from '@/components/GoogleTag'
import type { ShopifyProductVariant, ShopifyImage, ShopifySellingPlanGroup } from '@/lib/shopify'
import { trackEventDual } from '@/lib/meta-capi'
import { formatPrice } from '@/lib/format-price'

interface ProductVariantSelectorProps {
  variants: ShopifyProductVariant[]
  productTitle: string
  productId: string
  productImages: ShopifyImage[]
  currencyCode: string
  /** Subscription plans, when the product is sold on subscription. */
  sellingPlanGroups?: ShopifySellingPlanGroup[]
}

// Helper to format price

export default function ProductVariantSelector({
  variants,
  productTitle,
  productId,
  productImages,
  currencyCode,
  sellingPlanGroups = [],
}: ProductVariantSelectorProps) {
  const { addToCart, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)

  // Find first available variant
  const availableVariants = variants.filter(v => v.availableForSale)
  const [selectedVariantId, setSelectedVariantId] = useState(
    availableVariants[0]?.id || variants[0]?.id
  )

  const selectedVariant = variants.find(v => v.id === selectedVariantId)

  // Subscribe and save (Shopify Subscriptions, 8 Oct 2026). One group, one plan
  // per delivery interval; every 2 months is the default, the middle choice.
  const planGroup = sellingPlanGroups[0]
  const plans = planGroup?.sellingPlans ?? []
  const [buyMode, setBuyMode] = useState<'once' | 'subscribe'>('once')
  const [planId, setPlanId] = useState(plans[1]?.id ?? plans[0]?.id)
  const subscriptionPrice = selectedVariant?.sellingPlanAllocations
    ?.find((a) => a.sellingPlan.id === planId)
    ?.priceAdjustments[0]?.price.amount
  const canSubscribe = plans.length > 0 && subscriptionPrice !== undefined
  const subscribing = canSubscribe && buyMode === 'subscribe'
  const unitPrice = subscribing ? subscriptionPrice! : selectedVariant?.price.amount ?? '0'
  const hasMultipleVariants = variants.length > 1 && variants.some(v => v.title !== 'Default Title')

  // Get current image (variant image if available, else first product image)
  const currentImage = selectedVariant?.image || productImages[0]

  const handleAddToCart = async () => {
    if (!selectedVariant) return

    const atcPayload = {
      content_name: productTitle,
      content_ids: [selectedVariantId.split('/').pop() ?? selectedVariantId],
      content_type: 'product',
      value: parseFloat(unitPrice) * quantity,
      currency: currencyCode,
    }

    // Track AddToCart via Meta Pixel + CAPI (consent-gated inside trackEventDual)
    trackEventDual('AddToCart', atcPayload)

    // Track AddToCart event for Google Ads and GA4
    trackAddToCart(
      productId,
      productTitle,
      parseFloat(unitPrice),
      currencyCode,
      quantity
    )

    await addToCart(selectedVariantId, quantity, [], subscribing ? planId : undefined)
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

      {/* How you buy: one bottle, or the same bottle on a schedule. */}
      {canSubscribe && (
        <fieldset className="space-y-3">
          <legend className="block text-sm font-semibold text-gold-300 mb-2">How you buy</legend>
          <label
            className={`flex items-center justify-between gap-3 min-h-11 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
              buyMode === 'once' ? 'border-gold-400 bg-jerry-green-800/40' : 'border-gold-500/20 hover:border-gold-400/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="buy-mode"
                checked={buyMode === 'once'}
                onChange={() => setBuyMode('once')}
                className="h-4 w-4 accent-gold-500"
              />
              <span className="font-semibold text-white">One-time purchase</span>
            </span>
            <span className="font-serif font-bold text-gold-400">{formatPrice(selectedVariant.price.amount, currencyCode)}</span>
          </label>
          <div
            className={`rounded-lg border px-4 py-3 transition-colors ${
              subscribing ? 'border-gold-400 bg-jerry-green-800/40' : 'border-gold-500/20 hover:border-gold-400/50'
            }`}
          >
            <label className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="buy-mode"
                  checked={buyMode === 'subscribe'}
                  onChange={() => setBuyMode('subscribe')}
                  className="h-4 w-4 accent-gold-500"
                />
                <span className="font-semibold text-white">{planGroup.name}</span>
              </span>
              <span className="text-right">
                <span className="font-serif font-bold text-gold-400">{formatPrice(subscriptionPrice, currencyCode)}</span>{' '}
                <span className="text-sm text-parchment-400 line-through">{formatPrice(selectedVariant.price.amount, currencyCode)}</span>
              </span>
            </label>
            {subscribing && (
              <div className="mt-3 space-y-3">
                <div role="radiogroup" aria-label="Delivery frequency" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={plan.id === planId}
                      onClick={() => setPlanId(plan.id)}
                      className={`min-h-11 rounded-md border px-3 py-2 text-sm transition-colors ${
                        plan.id === planId
                          ? 'border-gold-400 bg-gold-500 text-jerry-green-900 font-semibold'
                          : 'border-gold-500/30 text-parchment-200 hover:border-gold-400'
                      }`}
                    >
                      {plan.options[0]?.value ?? plan.name}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-parchment-300">Skip, pause or cancel any time from your account.</p>
              </div>
            )}
          </div>
        </fieldset>
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
