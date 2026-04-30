'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { createCart, addToCart as shopifyAddToCart } from '@/lib/shopify'
import { appendUtmToCheckout } from '@/lib/utm'

interface AddToCartButtonProps {
  variantId: string
  productTitle: string
  price: string
  currencyCode: string
}

export default function AddToCartButton({ variantId, productTitle, price, currencyCode }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart()
  const [added, setAdded] = useState(false)
  const [addError, setAddError] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAddError(false)
    try {
      await addToCart(variantId)
      if (typeof window !== 'undefined' && typeof window.gtag === 'function' && window.Cookiebot?.consent?.statistics) {
        window.gtag('event', 'add_to_cart', {
          currency: currencyCode,
          value: parseFloat(price),
          items: [{ item_id: variantId.split('/').pop() ?? variantId, item_name: productTitle, price: parseFloat(price), quantity: 1 }],
        })
      }
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {
      setAddError(true)
      setTimeout(() => setAddError(false), 3000)
    }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBuyingNow(true)
    try {
      const cart = await createCart()
      const updated = await shopifyAddToCart(cart.id, variantId, 1)
      window.location.href = appendUtmToCheckout(updated.checkoutUrl)
    } catch {
      setIsBuyingNow(false)
    }
  }

  const busy = isLoading || isBuyingNow

  return (
    <div className="flex flex-col gap-2 mt-3">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {added ? `${productTitle} added to cart` : addError ? 'Failed to add to cart. Please try again.' : ''}
      </div>
      <button
        onClick={handleAddToCart}
        disabled={busy || added}
        className={`w-full px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 ${
          addError
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-gold-500 hover:bg-gold-400 text-jerry-green-900'
        }`}
      >
        {addError ? 'Try again' : added ? 'Added' : isLoading ? 'Adding...' : 'Add to Cart'}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={busy}
        className="w-full px-4 py-2 border border-gold-500/40 hover:border-gold-400 text-gold-300 hover:text-gold-200 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
      >
        {isBuyingNow ? 'Going to checkout...' : 'Buy it now'}
      </button>
    </div>
  )
}
