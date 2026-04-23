'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'

interface AddToCartButtonProps {
  variantId: string
  productTitle: string
  price: string
  currencyCode: string
}

export default function AddToCartButton({ variantId, productTitle, price, currencyCode }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart()
  const [added, setAdded] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await addToCart(variantId)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'add_to_cart', {
        currency: currencyCode,
        value: parseFloat(price),
        items: [{ item_name: productTitle, price: parseFloat(price), quantity: 1 }],
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || added}
      className="w-full mt-3 px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-jerry-green-900 text-sm font-semibold rounded-lg transition-all duration-200"
    >
      {added ? 'Added' : isLoading ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}
