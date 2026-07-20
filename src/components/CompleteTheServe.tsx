'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

export interface CompleteTheServeItem {
  title: string
  handle: string
  imageUrl: string | null
  imageAlt: string
  price: string
  variantId: string
  // The chosen variant's name (e.g. "Pair"), shown so a pair-priced item doesn't
  // read as one expensive glass. Omitted for single-variant ("Default Title").
  variantTitle?: string
}

// Curated cross-sell shown at the buy decision, driven by the product's
// `completeTheServe` list in Sanity. Renders nothing when there's nothing to
// pair, so an unset product shows no empty module.
//
// `primaryVariantId` is the variant of the product whose page this is (the rum),
// passed only when that product has a single unambiguous available variant. When
// present and not already in the basket, the button adds BOTH it and the pairing
// in one press — the "complete the serve" whole-round action. When the primary
// is already in the basket (or can't be pinned to one variant), it adds just the
// pairing. Either way the cart opens and the free-delivery nudge picks up.
export default function CompleteTheServe({
  items,
  primaryVariantId,
}: {
  items: CompleteTheServeItem[]
  primaryVariantId: string | null
}) {
  const { cart, addToCart, isLoading } = useCart()
  const [addedHandle, setAddedHandle] = useState<string | null>(null)

  if (items.length === 0) return null

  const primaryInCart =
    !!primaryVariantId && (cart?.lines.some(l => l.merchandise.id === primaryVariantId) ?? false)
  const addsBoth = !!primaryVariantId && !primaryInCart

  const handleAdd = async (item: CompleteTheServeItem) => {
    try {
      // Sequential awaits, not concurrent: CartContext.addToCart guards against
      // simultaneous calls, so the primary must finish before the pairing.
      if (addsBoth && primaryVariantId) {
        await addToCart(primaryVariantId)
      }
      await addToCart(item.variantId)
      setAddedHandle(item.handle)
      setTimeout(() => setAddedHandle(null), 2000)
    } catch {
      // CartContext surfaces the failure toast; nothing to do here.
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-gold-500/10">
      <h2 className="text-sm font-semibold text-gold-300 mb-4">Complete the serve</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.handle}
            className="rounded-lg border border-gold-500/20 bg-jerry-green-800/20 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-jerry-green-800/40">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    className="object-contain p-1"
                    sizes="56px"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/product/${item.handle}`}
                  className="block truncate text-sm font-semibold text-white hover:text-gold-200 transition-colors"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-gold-400">
                  {item.variantTitle ? `${item.variantTitle} · ` : ''}
                  {item.price}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAdd(item)}
              disabled={isLoading || addedHandle === item.handle}
              aria-label={
                addsBoth
                  ? `Add this product and ${item.title} to basket`
                  : `Add ${item.title} to basket`
              }
              className="mt-3 min-h-11 w-full rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-jerry-green-900 transition-colors hover:bg-gold-400 disabled:opacity-60"
            >
              {addedHandle === item.handle ? 'Added' : addsBoth ? 'Add both to basket' : 'Add to basket'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
