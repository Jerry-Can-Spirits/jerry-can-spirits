'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { trackAddToCart, trackSiteEvent } from '@/components/GoogleTag'
import { trackEventDual } from '@/lib/meta-capi'

// The bottle at the top of a recipe that calls for it. One line, one button,
// so a reader who came for the serve does not have to scroll past the method,
// the story and the related guides to find the thing the recipe is made with
// (Audit B, 3 Oct 2026: the "Need the Rum?" block sat 7,421px down). Renders
// only where the page passes a product, and the page only passes one for
// spiced-rum cocktails, so it never implies a substitution.
interface BottleStripProps {
  variantId: string
  productId: string
  title: string
  price: string
  priceAmount: string
  currencyCode: string
  href: string
  /** The cocktail's slug, for the GA4 event. */
  slug: string
}

export default function BottleStrip({
  variantId,
  productId,
  title,
  price,
  priceAmount,
  currencyCode,
  href,
  slug,
}: BottleStripProps) {
  const { addToCart, isLoading } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = async () => {
    trackSiteEvent('cocktail_bottle_click', { slug, action: 'add' })
    trackEventDual('AddToCart', {
      content_name: title,
      content_ids: [variantId.split('/').pop() ?? variantId],
      content_type: 'product',
      value: parseFloat(priceAmount),
      currency: currencyCode,
    })
    trackAddToCart(productId, title, parseFloat(priceAmount), currencyCode, 1)
    await addToCart(variantId, 1)
    setAdded(true)
  }

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-xl border border-gold-500/20 bg-jerry-green-800/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-300">Made with</p>
        <Link href={href} className="block font-serif text-lg font-bold leading-tight text-white transition-colors hover:text-gold-300">
          {title}
        </Link>
        <p className="text-sm text-parchment-300">{price}</p>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isLoading || added}
        className="min-h-11 w-full shrink-0 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-jerry-green-900 transition-colors hover:bg-gold-400 disabled:opacity-60 sm:w-auto"
      >
        {added ? 'Added' : isLoading ? 'Adding...' : 'Add to basket'}
      </button>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {added ? `${title} added to basket` : ''}
      </div>
    </div>
  )
}
