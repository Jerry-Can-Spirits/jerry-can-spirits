'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'

interface StickyAddToCartProps {
  variantId: string
  productTitle: string
  price: string
  currencyCode: string
  watchElementId: string
}

export default function StickyAddToCart({
  variantId,
  productTitle,
  price,
  currencyCode,
  watchElementId,
}: StickyAddToCartProps) {
  const { addToCart, isLoading } = useCart()
  const [isVisible, setIsVisible] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const target = document.getElementById(watchElementId)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [watchElementId])

  const handleAdd = async () => {
    try {
      await addToCart(variantId)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {
      // Cart drawer will show error state
    }
  }

  if (!isVisible) return null

  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }
  const formatted = `${symbols[currencyCode] || currencyCode}${parseFloat(price).toFixed(2)}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-jerry-green-900/95 backdrop-blur-sm border-t border-gold-500/20 px-4 py-3 flex items-center gap-3 safe-area-inset-bottom">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{productTitle}</p>
        <p className="text-sm font-bold text-gold-400">{formatted}</p>
      </div>
      <button
        onClick={handleAdd}
        disabled={isLoading || added}
        className="flex-shrink-0 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 text-sm font-bold rounded-lg transition-colors disabled:opacity-60"
      >
        {added ? 'Added' : isLoading ? '...' : 'Add to Cart'}
      </button>
    </div>
  )
}
