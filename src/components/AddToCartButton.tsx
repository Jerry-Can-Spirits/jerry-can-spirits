'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'

interface AddToCartButtonProps {
  variantId: string
  productTitle: string
}

export default function AddToCartButton({ variantId, productTitle }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = async () => {
    console.log('🎯 Adding to cart:', { variantId, quantity, productTitle })
    await addToCart(variantId, quantity)
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-semibold text-gold-300 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isLoading || quantity <= 1}
            className="w-10 h-10 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-white text-center font-semibold focus:outline-none focus:border-gold-400"
          />

          <button
            onClick={() => setQuantity(quantity + 1)}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className="w-full px-8 py-4 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Add to Cart
          </>
        )}
      </button>
    </div>
  )
}
