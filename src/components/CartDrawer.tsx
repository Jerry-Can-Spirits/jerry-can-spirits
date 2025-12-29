'use client'

import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

// Helper to format price
function formatPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount)
  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  }
  const symbol = symbols[currencyCode] || currencyCode
  return `${symbol}${price.toFixed(2)}`
}

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    applyDiscountCode,
    isLoading,
  } = useCart()

  const [discountCode, setDiscountCode] = useState('')

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    await applyDiscountCode(discountCode.trim())
    setDiscountCode('')
  }

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-jerry-green-900 border-l border-gold-500/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-gold-300">
              Your Cart
            </h2>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-jerry-green-800/50 rounded-lg transition-colors"
              aria-label="Close cart"
            >
              <svg
                className="w-6 h-6 text-parchment-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {!cart || cart.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <svg
                  className="w-16 h-16 text-gold-500/30"
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
                <p className="text-parchment-300">Your cart is empty</p>
                <Link
                  href="/shop/drinks"
                  onClick={closeCart}
                  className="px-6 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex gap-4 p-4 bg-jerry-green-800/20 rounded-lg border border-gold-500/20"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-jerry-green-800/20 rounded-lg overflow-hidden">
                      {line.merchandise.image ? (
                        <Image
                          src={line.merchandise.image.url}
                          alt={line.merchandise.image.altText || line.merchandise.product.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gold-500/30"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/product/${line.merchandise.product.handle}`}
                        onClick={closeCart}
                        className="font-semibold text-white hover:text-gold-300 transition-colors block truncate"
                      >
                        {line.merchandise.product.title}
                      </Link>
                      {line.merchandise.title !== 'Default Title' && (
                        <p className="text-sm text-parchment-400 truncate">
                          {line.merchandise.title}
                        </p>
                      )}
                      <p className="text-gold-400 font-semibold mt-1">
                        {formatPrice(
                          line.merchandise.price.amount,
                          line.merchandise.price.currencyCode
                        )}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() =>
                            updateQuantity(line.id, Math.max(0, line.quantity - 1))
                          }
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-50"
                        >
                          <svg
                            className="w-4 h-4 text-parchment-300"
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

                        <span className="text-white font-semibold w-8 text-center">
                          {line.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(line.id, line.quantity + 1)}
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-50"
                        >
                          <svg
                            className="w-4 h-4 text-parchment-300"
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

                        <button
                          onClick={() => removeItem(line.id)}
                          disabled={isLoading}
                          className="ml-auto text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Discount & Checkout */}
          {cart && cart.lines.length > 0 && (
            <div className="border-t border-gold-500/20 p-6 space-y-4">
              {/* Discount Code */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Discount code"
                    className="flex-1 px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:border-gold-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyDiscount()
                    }}
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={isLoading || !discountCode.trim()}
                    className="px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-gold-300 hover:bg-jerry-green-800 transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>

                {/* Show applied discounts */}
                {cart.discountCodes && cart.discountCodes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {cart.discountCodes.map((discount, index) => (
                      <p
                        key={index}
                        className={`text-sm ${
                          discount.applicable
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {discount.applicable ? '✓' : '✗'} {discount.code}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold pt-4 border-t border-gold-500/20">
                <span className="text-parchment-200">Total</span>
                <span className="text-gold-400 text-2xl">
                  {formatPrice(
                    cart.cost.totalAmount.amount,
                    cart.cost.totalAmount.currencyCode
                  )}
                </span>
              </div>

              {/* Checkout Buttons */}
              <div className="space-y-3">
                {/* Main Checkout Button */}
                <a
                  href={cart.checkoutUrl}
                  onClick={() => {
                    // Track checkout initiation with Facebook Pixel
                    if (typeof window !== 'undefined' && (window as Window & { fbq?: Function }).fbq) {
                      (window as Window & { fbq: Function }).fbq('track', 'InitiateCheckout', {
                        content_ids: cart.lines.map(line => line.merchandise.product.id),
                        contents: cart.lines.map(line => ({
                          id: line.merchandise.product.id,
                          quantity: line.quantity
                        })),
                        value: parseFloat(cart.cost.totalAmount.amount),
                        currency: cart.cost.totalAmount.currencyCode,
                        num_items: cart.lines.reduce((sum, line) => sum + line.quantity, 0)
                      });
                    }
                  }}
                  className="block w-full px-6 py-4 bg-gold-500 text-jerry-green-900 text-center font-bold rounded-lg hover:bg-gold-400 transition-colors"
                >
                  Proceed to Checkout
                </a>

                {/* Shop Pay Notice */}
                <div className="flex items-center justify-center gap-2 text-xs text-parchment-300">
                  <svg className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Shop Pay available for faster checkout</span>
                </div>
              </div>

              <Link
                href="/shop/drinks"
                onClick={closeCart}
                className="block text-center text-gold-300 hover:text-gold-400 transition-colors text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
