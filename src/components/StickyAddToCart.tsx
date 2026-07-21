'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'

interface StickyAddToCartProps {
  variantId: string
  productTitle: string
  price: string
  currencyCode: string
  watchElementId: string
  /** True for products with more than one real variant: the sticky bar can't
      see the selector's chosen variant, so it must not add a fixed one. */
  multiVariant?: boolean
  /** Echo the IWSC double-medal credential here on mobile, where the desktop
      ProductAwards block near the price has scrolled out of view. */
  awarded?: boolean
}

export default function StickyAddToCart({
  variantId,
  productTitle,
  price,
  currencyCode,
  watchElementId,
  multiVariant = false,
  awarded = false,
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
    // Multi-variant products: the shopper's chosen variant lives in the
    // selector's own state, which this bar can't read. Adding the fixed
    // variantId would add the wrong item, so send them to the selector instead.
    if (multiVariant) {
      document.getElementById(watchElementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-jerry-green-900/95 backdrop-blur-sm border-t border-gold-500/20 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{productTitle}</p>
        <p className="text-sm font-bold text-gold-400">{formatted}</p>
        {awarded && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-400/90 truncate">
            IWSC 2026 · Bronze &amp; Silver
          </p>
        )}
      </div>
      <button
        onClick={handleAdd}
        disabled={isLoading || added}
        className="shrink-0 min-h-11 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 text-sm font-bold rounded-lg transition-colors disabled:opacity-60"
      >
        {multiVariant ? 'Choose options' : added ? 'Added' : isLoading ? '...' : 'Add to basket'}
      </button>
    </div>
  )
}
