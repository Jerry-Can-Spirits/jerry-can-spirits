'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { getProduct, type ShopifyProduct, type ShopifyProductVariant } from '@/lib/shopify'

// Hardcoded cross-sell products - lower-cost barware items to encourage add-ons
const UPSELL_PRODUCT_HANDLES = [
  'natural-slate-coaster-variants',
  'stainless-steel-jigger-variants',
  'jerry-can-spirits-metal-keyring',
  'jerry-can-spirits-stainless-steel-freezable-stones',
]

// Helper to format price
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

interface UpsellProduct {
  product: ShopifyProduct
  availableVariants: ShopifyProductVariant[]
}

export default function CartUpsell() {
  const { cart, addToCart, isLoading } = useCart()
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  // Track selected variant for each product (keyed by product id)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  // Get handles of products already in cart
  const cartProductHandles = cart?.lines.map(line => line.merchandise.product.handle) || []

  useEffect(() => {
    async function fetchUpsellProducts() {
      setLoadingProducts(true)
      const products: UpsellProduct[] = []
      const initialSelections: Record<string, string> = {}

      // Fetch all upsell products in parallel
      const results = await Promise.allSettled(
        UPSELL_PRODUCT_HANDLES.map(handle => getProduct(handle))
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const product = result.value
          const availableVariants = product.variants?.filter(v => v.availableForSale) || []

          if (availableVariants.length > 0) {
            products.push({
              product,
              availableVariants
            })
            // Default to first available variant
            initialSelections[product.id] = availableVariants[0].id
          }
        }
      })

      setUpsellProducts(products)
      setSelectedVariants(initialSelections)
      setLoadingProducts(false)
    }

    fetchUpsellProducts()
  }, [])

  // Filter out products already in cart
  const availableUpsells = upsellProducts.filter(
    ({ product }) => !cartProductHandles.includes(product.handle)
  )

  const handleAddToCart = async (productId: string) => {
    const variantId = selectedVariants[productId]
    if (!variantId) return

    setAddingProductId(productId)
    try {
      await addToCart(variantId, 1)
    } finally {
      setAddingProductId(null)
    }
  }

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }))
  }

  // Don't render if loading or no products available
  if (loadingProducts) {
    return (
      <div className="py-4 border-t border-gold-500/20">
        <div className="h-20 bg-jerry-green-800/30 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (availableUpsells.length === 0) {
    return null
  }

  // Check if product has multiple meaningful variants (not just "Default Title")
  const hasMultipleVariants = (variants: ShopifyProductVariant[]) => {
    return variants.length > 1 && variants.some(v => v.title !== 'Default Title')
  }

  // Get current image for a product (variant image if available, else product image)
  const getCurrentImage = (product: ShopifyProduct, variants: ShopifyProductVariant[]) => {
    const selectedVariantId = selectedVariants[product.id]
    const selectedVariant = variants.find(v => v.id === selectedVariantId)

    // Use variant image if available, otherwise fall back to product image
    if (selectedVariant?.image) {
      return selectedVariant.image
    }
    return product.images?.[0] || null
  }

  return (
    <div className="py-4 border-t border-gold-500/20">
      <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wide">
        Complete Your Order
      </h3>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {availableUpsells.map(({ product, availableVariants }) => {
          const currentImage = getCurrentImage(product, availableVariants)

          return (
            <div
              key={product.id}
              className="bg-jerry-green-800/30 rounded-lg border border-gold-500/20 overflow-hidden"
            >
              {/* Product Image - updates based on selected variant */}
              <div className="relative aspect-square bg-jerry-green-800/20">
                {currentImage ? (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.altText || product.title}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 480px) 45vw, 200px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gold-500/30"
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

              {/* Product Info */}
              <div className="p-2 space-y-2">
                <h4 className="text-xs font-medium text-white line-clamp-2 leading-tight">
                  {product.title}
                </h4>

                {/* Variant Dropdown - only show if multiple variants */}
                {hasMultipleVariants(availableVariants) && (
                  <select
                    id={`variant-${product.id}`}
                    name={`variant-${product.id}`}
                    value={selectedVariants[product.id] || ''}
                    onChange={(e) => handleVariantChange(product.id, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-jerry-green-900 border border-gold-500/30 rounded text-white cursor-pointer focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
                    style={{ colorScheme: 'dark' }}
                  >
                    {availableVariants.map((variant) => (
                      <option
                        key={variant.id}
                        value={variant.id}
                        className="bg-jerry-green-900 text-white py-1"
                      >
                        {variant.title}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gold-400">
                    {formatPrice(
                      product.priceRange.minVariantPrice.amount,
                      product.priceRange.minVariantPrice.currencyCode
                    )}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={isLoading || addingProductId === product.id}
                    className="px-2 py-1 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                  >
                    {addingProductId === product.id ? '...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
