'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { getProduct } from '@/lib/shopify'

const OFFSET_HANDLE = 'uk-tree-fund'

export default function CarbonOffsetToggle() {
  const { cart, addToCart, removeItem, isLoading } = useCart()
  const [variantId, setVariantId] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)

  useEffect(() => {
    getProduct(OFFSET_HANDLE)
      .then(product => {
        if (product?.variants?.[0]?.id) {
          setVariantId(product.variants[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const offsetLine = cart?.lines.find(
    line => line.merchandise.product.handle === OFFSET_HANDLE
  )
  const isInCart = !!offsetLine

  const handleToggle = async () => {
    if (isActing || isLoading || !variantId) return
    setIsActing(true)
    try {
      if (isInCart && offsetLine) {
        await removeItem(offsetLine.id)
      } else {
        await addToCart(variantId, 1)
      }
    } finally {
      setIsActing(false)
    }
  }

  if (!variantId) return null

  return (
    <div>
      <button
        type="button"
        role="checkbox"
        aria-checked={isInCart}
        onClick={handleToggle}
        disabled={isActing || isLoading}
        className="flex items-start gap-3 w-full text-left group disabled:opacity-50"
      >
        <span className="mt-0.5 w-5 h-5 rounded border border-gold-500/40 flex-shrink-0 flex items-center justify-center bg-jerry-green-900 group-hover:border-gold-400 transition-colors">
          {isInCart && (
            <svg className="w-3 h-3 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <span>
          <span className="block text-sm text-parchment-300 group-hover:text-parchment-200 transition-colors">
            Plant a UK tree{' '}
            <span className="text-parchment-500 font-normal">(+£1, opt-in)</span>
          </span>
          <span className="block text-xs text-parchment-500 mt-0.5">
            Every order already plants a tree and removes 1kg CO₂. This funds a UK reforestation project specifically, via Ecologi.
          </span>
        </span>
      </button>
    </div>
  )
}
