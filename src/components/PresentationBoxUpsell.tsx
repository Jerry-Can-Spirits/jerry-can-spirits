'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { getProduct, type ShopifyProduct } from '@/lib/shopify'

const BOX_HANDLE = 'jerry-can-spirits-expedition-spiced-rum-presentation-box'
const RUM_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'

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

export default function PresentationBoxUpsell() {
  const { cart, addToCart, isLoading } = useCart()
  const [product, setProduct] = useState<ShopifyProduct | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    getProduct(BOX_HANDLE)
      .then(p => {
        if (p?.variants?.[0]?.id) {
          setProduct(p)
          setVariantId(p.variants[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const rumQuantityInCart = useMemo(() => {
    if (!cart) return 0
    return cart.lines
      .filter(line => line.merchandise.product.handle === RUM_HANDLE)
      .reduce((sum, line) => sum + line.quantity, 0)
  }, [cart])

  useEffect(() => {
    if (rumQuantityInCart > 0 && quantity > rumQuantityInCart) {
      setQuantity(rumQuantityInCart)
    }
  }, [rumQuantityInCart, quantity])

  if (!product || !variantId) return null
  if (rumQuantityInCart === 0) return null

  const boxPrice = product.priceRange.minVariantPrice
  const totalAmount = (parseFloat(boxPrice.amount) * quantity).toFixed(2)
  const totalPriceDisplay = formatPrice(totalAmount, boxPrice.currencyCode)
  const unitPriceDisplay = formatPrice(boxPrice.amount, boxPrice.currencyCode)
  const image = product.images?.[0]

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const handleIncrement = () => {
    if (quantity < rumQuantityInCart) setQuantity(quantity + 1)
  }

  const handleAdd = async () => {
    if (isAdding || isLoading || !variantId) return
    setIsAdding(true)
    try {
      await addToCart(variantId, quantity)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="py-4 border-t border-gold-500/20">
      <div className="bg-jerry-green-800/30 rounded-lg border border-gold-500/20 p-4">
        <div className="flex gap-4">
          <div className="relative w-20 h-20 flex-shrink-0 bg-jerry-green-800/20 rounded-lg overflow-hidden">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText || product.title}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gold-300">
              Add the presentation box.
            </h3>
            <p className="text-xs text-parchment-400 mt-1">
              Built for gifting. Adds {unitPriceDisplay} each.
            </p>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isAdding || isLoading}
                  aria-label="Decrease box quantity"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 text-parchment-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <span className="text-white font-semibold w-6 text-center text-sm" aria-live="polite">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= rumQuantityInCart || isAdding || isLoading}
                  aria-label="Increase box quantity"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 text-parchment-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || isLoading}
                aria-label={`Add ${quantity} presentation ${quantity === 1 ? 'box' : 'boxes'} for ${totalPriceDisplay}`}
                className="ml-auto px-4 py-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 text-sm font-semibold rounded transition-colors disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : `Add ${totalPriceDisplay}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
