'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getProduct } from '@/lib/shopify'

interface ProductPricing {
  price: string
  compareAtPrice: string | null
}

export default function PreOrderSection() {
  const [bottlesSold, setBottlesSold] = useState<number | null>(null)
  const [bottlePricing, setBottlePricing] = useState<ProductPricing>({ price: '35', compareAtPrice: '45' })
  const [giftSetPricing, setGiftSetPricing] = useState<ProductPricing>({ price: '55', compareAtPrice: '65' })
  const [loading, setLoading] = useState(true)
  const totalBottles = 700

  // Product handles
  const bottleHandle = 'jerry-can-spirits-expedition-spiced-rum'
  const giftSetHandle = 'jerry-can-spirits-premium-gift-pack'

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch both products in parallel
        const [bottleProduct, giftSetProduct] = await Promise.all([
          getProduct(bottleHandle),
          getProduct(giftSetHandle)
        ])

        // Process bottle data
        if (bottleProduct?.variants?.[0]) {
          const variant = bottleProduct.variants[0]

          // Get bottles sold from metafield (more reliable than inventory calculation)
          const preorderSoldMeta = bottleProduct.metafields?.find(
            (m: { namespace: string; key: string; value: string } | null) =>
              m?.namespace === 'custom' && m?.key === 'preorder_sold'
          )
          if (preorderSoldMeta?.value) {
            setBottlesSold(parseInt(preorderSoldMeta.value, 10))
          } else if (variant.quantityAvailable !== undefined) {
            const available = variant.quantityAvailable
            const sold = totalBottles - available
            setBottlesSold(Math.max(0, sold))
          }

          setBottlePricing({
            price: parseFloat(variant.price.amount).toFixed(0),
            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount).toFixed(0) : null
          })
        }

        // Process gift set data
        if (giftSetProduct?.variants?.[0]) {
          const variant = giftSetProduct.variants[0]
          setGiftSetPricing({
            price: parseFloat(variant.price.amount).toFixed(0),
            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount).toFixed(0) : null
          })
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setBottlesSold(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const percentageSold = bottlesSold !== null ? (bottlesSold / totalBottles) * 100 : 0
  const showProgressBar = !loading && bottlesSold !== null
  const bottleDiscount = bottlePricing.compareAtPrice ? parseInt(bottlePricing.compareAtPrice) - parseInt(bottlePricing.price) : 10

  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Product Image */}
          <div className="order-2 lg:order-1">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">
              <div className="aspect-[4/5] flex items-center justify-center p-8">
                <Image
                  src="/images/hero/hero-spiced.webp"
                  alt="Jerry Can Spirits Premium British Rum - First Batch Edition"
                  width={400}
                  height={500}
                  className="w-full h-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Numbered Badge */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                First Batch Edition
              </div>

              {/* Limited Badge */}
              <div className="absolute bottom-6 left-6 bg-jerry-green-700/80 backdrop-blur-sm text-gold-300 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border border-gold-500/30 shadow-lg">
                Limited to 700
              </div>
            </div>
          </div>

          {/* Right Column - Pre-Order Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Reserve Your Bottle
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              Secure Your Place in History
            </h2>

            <p className="text-xl text-parchment-300 mb-6 leading-relaxed">
              Be among the first 700 adventurers to receive a numbered First Batch Edition bottle.
              Pre-order now and lock in exclusive early supporter pricing.
            </p>

            {/* Progress Bar - Only show if we have real inventory data */}
            {showProgressBar && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-parchment-200 font-semibold">
                    {bottlesSold} of {totalBottles} bottles reserved
                  </span>
                  <span className="text-gold-300 font-semibold">
                    {Math.round(percentageSold)}% claimed
                  </span>
                </div>
                <div className="w-full h-3 bg-jerry-green-800/60 rounded-full overflow-hidden border border-gold-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
                    style={{ width: `${percentageSold}%` }}
                  />
                </div>
                <p className="text-parchment-400 text-sm mt-2">
                  Only {totalBottles - bottlesSold} bottles remaining
                </p>
              </div>
            )}

            {/* Benefits List */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
              <h3 className="text-gold-300 font-semibold mb-4">Pre-Order Benefits:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Individually numbered First Batch Edition bottle</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Save £{bottleDiscount} as an early supporter (£{bottlePricing.price} vs £{bottlePricing.compareAtPrice} RRP)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Priority shipping - first to receive in April 2026</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Exclusive access to limited releases & events</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4">
              {/* Standard Bottle */}
              <Link
                href={`/shop/product/${bottleHandle}`}
                className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-6 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider opacity-75">Standard Bottle</span>
                  <span className="text-lg">Expedition Spiced Rum</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl font-bold">£{bottlePricing.price}</span>
                    {bottlePricing.compareAtPrice && (
                      <span className="text-sm line-through opacity-60 ml-2">£{bottlePricing.compareAtPrice}</span>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Premium Gift Pack */}
              <Link
                href={`/shop/product/${giftSetHandle}`}
                className="group bg-gradient-to-r from-jerry-green-700 to-jerry-green-800 hover:from-jerry-green-600 hover:to-jerry-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-between border border-gold-500/30"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-gold-300">Premium Gift Pack</span>
                  <span className="text-lg">Bottle + Barware Set</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl font-bold text-gold-300">£{giftSetPricing.price}</span>
                    {giftSetPricing.compareAtPrice && (
                      <span className="text-sm line-through opacity-60 text-parchment-400 ml-2">£{giftSetPricing.compareAtPrice}</span>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-gold-300 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Enhanced Trust & Social Proof */}
            <div className="mt-6 pt-6 border-t border-gold-500/20 space-y-4">
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2 text-parchment-300 text-sm">
                  <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-parchment-300 text-sm">
                  <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <span>UK Veteran-Owned</span>
                </div>
                <div className="flex items-center gap-2 text-parchment-300 text-sm">
                  <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>Small-Batch Craft</span>
                </div>
              </div>

              {/* Social Proof Stats */}
              <div className="bg-jerry-green-800/30 rounded-lg p-4 border border-gold-500/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-gold-300 font-bold text-lg">700</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">Bottles Only</div>
                  </div>
                  <div>
                    <div className="text-gold-300 font-bold text-lg">1st</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">Batch Edition</div>
                  </div>
                  <div>
                    <div className="text-gold-300 font-bold text-lg">UK</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">Veteran-Owned</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
