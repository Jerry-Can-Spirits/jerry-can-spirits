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
}

// Curated cross-sell shown at the buy decision, driven by the product's
// `completeTheServe` list in Sanity. One-tap add drops the shopper into the
// cart, where the free-delivery nudge picks up the story. Renders nothing when
// there is nothing to pair, so an unset product shows no empty module.
export default function CompleteTheServe({ items }: { items: CompleteTheServeItem[] }) {
  const { addToCart, isLoading } = useCart()
  const [addedHandle, setAddedHandle] = useState<string | null>(null)

  if (items.length === 0) return null

  const handleAdd = async (item: CompleteTheServeItem) => {
    try {
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
            className="flex items-center gap-3 rounded-lg border border-gold-500/20 bg-jerry-green-800/20 p-3"
          >
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
              <p className="text-sm text-gold-400">{item.price}</p>
            </div>
            <button
              onClick={() => handleAdd(item)}
              disabled={isLoading || addedHandle === item.handle}
              aria-label={`Add ${item.title} to cart`}
              className="min-h-11 shrink-0 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-jerry-green-900 transition-colors hover:bg-gold-400 disabled:opacity-60"
            >
              {addedHandle === item.handle ? 'Added' : 'Add'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
