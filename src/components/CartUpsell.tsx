'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { getProduct, type ShopifyProduct, type ShopifyProductVariant } from '@/lib/shopify'

// Fallback handles if the API returns empty or fails
const UPSELL_PRODUCT_HANDLES = [
  'natural-slate-coaster-variants',
  'stainless-steel-jigger-variants',
  'jerry-can-spirits-metal-keyring',
  'jerry-can-spirits-stainless-steel-freezable-stones',
]

const PAGE_SIZE = 4
const FETCH_LIMIT = 12

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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)

  // Get handles of products already in cart
  const cartProductHandles = cart?.lines.map(line => line.merchandise.product.handle) || []

  // Memoised key: only changes when the set of product handles changes, not on quantity updates
  const handlesKey = useMemo(() => {
    const handles = cart?.lines.map(line => line.merchandise.product.handle) || []
    return [...handles].sort().join(',')
  }, [cart?.lines])

  useEffect(() => {
    async function fetchUpsellProducts() {
      setLoadingProducts(true)
      setPage(0)

      // Determine which handles to fetch recommendations for
      let recommendedHandles: string[] = UPSELL_PRODUCT_HANDLES

      if (handlesKey) {
        try {
          const res = await fetch(`/api/cart-recommendations/?handles=${encodeURIComponent(handlesKey)}&limit=${FETCH_LIMIT}`)
          if (res.ok) {
            const data: { products: ShopifyProduct[] } = await res.json()
            if (data.products && data.products.length > 0) {
              recommendedHandles = data.products.map(p => p.handle)
            }
          }
        } catch {
          // Fall back to hardcoded handles
        }
      }

      const products: UpsellProduct[] = []
      const initialSelections: Record<string, string> = {}

      // Fetch full product data for variants/images
      const results = await Promise.allSettled(
        recommendedHandles.map(handle => getProduct(handle))
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
            initialSelections[product.id] = availableVariants[0].id
          }
        }
      })

      setUpsellProducts(products)
      setSelectedVariants(initialSelections)
      setLoadingProducts(false)
    }

    fetchUpsellProducts()
  }, [handlesKey])

  // Filter out products already in cart
  const availableUpsells = upsellProducts.filter(
    ({ product }) => !cartProductHandles.includes(product.handle)
  )

  // Paginate: show PAGE_SIZE at a time, wrap around
  const totalPages = Math.ceil(availableUpsells.length / PAGE_SIZE)
  const currentPage = totalPages > 0 ? page % totalPages : 0
  const visibleUpsells = availableUpsells.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  )

  const handleReroll = () => {
    setPage(prev => prev + 1)
  }

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

  const hasMultipleVariants = (variants: ShopifyProductVariant[]) => {
    return variants.length > 1 && variants.some(v => v.title !== 'Default Title')
  }

  const getCurrentImage = (product: ShopifyProduct, variants: ShopifyProductVariant[]) => {
    const selectedVariantId = selectedVariants[product.id]
    const selectedVariant = variants.find(v => v.id === selectedVariantId)

    if (selectedVariant?.image) {
      return selectedVariant.image
    }
    return product.images?.[0] || null
  }

  return (
    <div className="py-4 border-t border-gold-500/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gold-300 uppercase tracking-wide">
          Complete Your Order
        </h3>
        {totalPages > 1 && (
          <button
            onClick={handleReroll}
            className="flex items-center gap-1.5 text-xs text-parchment-300 hover:text-gold-300 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Show more
          </button>
        )}
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {visibleUpsells.map(({ product, availableVariants }) => {
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
