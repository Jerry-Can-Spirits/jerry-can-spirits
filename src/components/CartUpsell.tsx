'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { FREE_SHIPPING_THRESHOLD_GBP } from '@/lib/pricing'
import { resolveCategory, type ProductCategory } from '@/lib/shopify'

interface CartUpsellItem {
  title: string
  handle: string
  imageUrl: string | null
  imageAlt: string
  variantId: string
  variantTitle?: string
  price: number
  currencyCode: string
  category: ProductCategory
}

function formatPrice(price: number, currencyCode: string): string {
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }
  const symbol = symbols[currencyCode] || currencyCode
  return `${symbol}${price.toFixed(2)}`
}

// Shortfall-aware cross-sell. The eligible pool is curated in Sanity (cartUpsell
// singleton, ordered by the founder); the drawer leads with whichever product
// best bridges the gap to free UK delivery for THIS basket, then shows up to two
// alternates. Once the basket clears the threshold it falls back to the curated
// order and the framing softens. One scroll region only — no nested scroll.
export default function CartUpsell() {
  const { cart, addToCart, isLoading } = useCart()
  const [pool, setPool] = useState<CartUpsellItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [addingHandle, setAddingHandle] = useState<string | null>(null)

  // The pool is basket-independent, so fetch it once. Selection reacts to the
  // cart below.
  useEffect(() => {
    let cancelled = false
    async function fetchPool() {
      setLoadingProducts(true)
      try {
        const res = await fetch('/api/cart-upsell/')
        if (res.ok) {
          const data: { products: CartUpsellItem[] } = await res.json()
          if (!cancelled) setPool(data.products ?? [])
        }
      } catch {
        // Leave the pool empty → the section renders nothing.
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    }
    fetchPool()
    return () => {
      cancelled = true
    }
  }, [])

  const cartHandles = useMemo(
    () => new Set(cart?.lines.map((l) => l.merchandise.product.handle) ?? []),
    [cart?.lines],
  )
  // Which coarse categories are already in the cart, so we can offer the one it
  // lacks rather than more of the same.
  const cartHasSpirits = useMemo(
    () =>
      (cart?.lines ?? []).some(
        (l) => resolveCategory(l.merchandise.product.productType, l.merchandise.product.tags) === 'spirits',
      ),
    [cart?.lines],
  )
  const subtotal = cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0

  const { hero, alternates, belowThreshold, heroClears } = useMemo(() => {
    const eligible = pool.filter((p) => !cartHandles.has(p.handle))
    if (eligible.length === 0) {
      return { hero: null as CartUpsellItem | null, alternates: [] as CartUpsellItem[], belowThreshold: false, heroClears: false }
    }

    // Category-aware complement (Stage 3.5): no spirit in the cart → lead with the
    // spirit (the rum — the thing we most want in every basket); spirit already
    // there → lead with an accessory (complete the serve). Fall back to the whole
    // pool if the target category has nothing eligible.
    const target: ProductCategory = cartHasSpirits ? 'barware' : 'spirits'
    const inTarget = eligible.filter((p) => p.category === target)
    const candidates = inTarget.length > 0 ? inTarget : eligible

    // Alternates: the rest of the complement category first (curated order), then
    // anything else eligible, capped at two.
    const alternatesFor = (heroHandle: string) =>
      [
        ...candidates.filter((p) => p.handle !== heroHandle),
        ...eligible.filter((p) => p.category !== target && p.handle !== heroHandle),
      ].slice(0, 2)

    const shortfall = FREE_SHIPPING_THRESHOLD_GBP - subtotal

    // Already clear of free delivery: no shortfall to bridge, so lead with the
    // complement in curated order and soften the framing.
    if (shortfall <= 0) {
      const hero = candidates[0]
      return { hero, alternates: alternatesFor(hero.handle), belowThreshold: false, heroClears: false }
    }

    // Within the complement set, prefer a product that CLEARS the threshold; among
    // clearers take the cheapest (least overshoot). If nothing clears, take the
    // closest from below (the dearest). reduce keeps the earlier item on ties, and
    // `candidates` is in curated order, so ties break by curated order.
    const clearers = candidates.filter((p) => p.price >= shortfall)
    const hero =
      clearers.length > 0
        ? clearers.reduce((best, p) => (p.price < best.price ? p : best))
        : candidates.reduce((best, p) => (p.price > best.price ? p : best))

    return { hero, alternates: alternatesFor(hero.handle), belowThreshold: true, heroClears: hero.price >= shortfall }
  }, [pool, cartHandles, subtotal, cartHasSpirits])

  if (loadingProducts) {
    return (
      <div className="py-4 border-t border-gold-500/20">
        <div className="h-24 bg-jerry-green-800/30 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!hero) return null

  const handleAdd = async (item: CartUpsellItem) => {
    setAddingHandle(item.handle)
    try {
      await addToCart(item.variantId, 1)
    } finally {
      setAddingHandle(null)
    }
  }

  // "Goes well with this" is fixed for the at/above-threshold state. Below the
  // threshold the framing lives on the hero badge, and the section keeps the
  // existing heading.
  const sectionLabel = belowThreshold ? 'Complete Your Order' : 'Goes well with this'

  return (
    <div className="py-4 border-t border-gold-500/20">
      <h3 className="text-sm font-semibold text-gold-300 uppercase tracking-wide mb-3">
        {sectionLabel}
      </h3>

      {/* Hero — the pairing chosen for this basket */}
      <div className="flex gap-3 rounded-lg border border-gold-500/20 bg-jerry-green-800/30 p-3">
        <div className="relative w-20 h-20 shrink-0 rounded-md bg-jerry-green-800/20 overflow-hidden">
          {hero.imageUrl && (
            <Image src={hero.imageUrl} alt={hero.imageAlt} fill className="object-contain p-1" sizes="80px" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Only claim "Clears free delivery" when the hero actually clears it. */}
          {belowThreshold && heroClears && (
            <span className="self-start text-[10px] uppercase tracking-wide text-gold-300 bg-gold-500/15 border border-gold-500/30 rounded-sm px-1.5 py-0.5 mb-1">
              Clears free delivery
            </span>
          )}
          <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{hero.title}</p>
          <p className="text-sm text-gold-400 mt-0.5">
            {hero.variantTitle ? `${hero.variantTitle} · ` : ''}
            {formatPrice(hero.price, hero.currencyCode)}
          </p>
          <button
            onClick={() => handleAdd(hero)}
            disabled={isLoading || addingHandle === hero.handle}
            aria-label={`Add ${hero.title} to basket`}
            className="mt-2 min-h-[44px] w-full rounded-lg bg-gold-500 px-4 text-sm font-semibold text-jerry-green-900 hover:bg-gold-400 transition-colors disabled:opacity-60"
          >
            {addingHandle === hero.handle ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Alternates — a compact row, no horizontal scroll */}
      {alternates.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {alternates.map((item) => (
            <div
              key={item.handle}
              className="rounded-lg border border-gold-500/20 bg-jerry-green-800/20 p-2"
            >
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 shrink-0 rounded bg-jerry-green-800/20 overflow-hidden">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-contain p-0.5" sizes="40px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white line-clamp-1 leading-tight">{item.title}</p>
                  <p className="text-xs text-gold-400">
                    {item.variantTitle ? `${item.variantTitle} · ` : ''}
                    {formatPrice(item.price, item.currencyCode)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAdd(item)}
                disabled={isLoading || addingHandle === item.handle}
                aria-label={`Add ${item.title} to basket`}
                className="mt-2 min-h-[44px] w-full rounded bg-jerry-green-800/50 border border-gold-500/20 px-2 text-xs font-semibold text-gold-300 hover:bg-jerry-green-800 transition-colors disabled:opacity-60"
              >
                {addingHandle === item.handle ? 'Adding…' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
