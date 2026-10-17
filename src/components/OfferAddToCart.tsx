'use client'

import { useCart } from '@/contexts/CartContext'
import { trackAddToCart } from '@/components/GoogleTag'
import { trackEventDual } from '@/lib/meta-capi'
import { OFFER_CTA } from '@/lib/october-offer'

interface OfferAddToCartProps {
  variantId: string
  productId: string
  productTitle: string
  price: string
  currencyCode: string
  available: boolean
}

// The landing page's one action. Same cart and the same AddToCart tracking as
// the product page's selector (Meta Pixel plus CAPI, then GA4), both
// consent-gated inside the helpers; the drawer opens from the provider.
export default function OfferAddToCart({ variantId, productId, productTitle, price, currencyCode, available }: OfferAddToCartProps) {
  const { addToCart, isLoading } = useCart()

  const handleClick = async () => {
    trackEventDual('AddToCart', {
      content_name: productTitle,
      content_ids: [variantId.split('/').pop() ?? variantId],
      content_type: 'product',
      value: parseFloat(price),
      currency: currencyCode,
    })
    trackAddToCart(productId, productTitle, parseFloat(price), currencyCode, 1)
    await addToCart(variantId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || !available}
      className="w-full min-h-14 px-8 py-4 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Adding...' : OFFER_CTA}
    </button>
  )
}
