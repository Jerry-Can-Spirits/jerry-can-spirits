'use client'

import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import CartUpsell from './CartUpsell'
import CarbonOffsetToggle from './CarbonOffsetToggle'
import PresentationBoxUpsell from './PresentationBoxUpsell'
import { appendUtmToCheckout, gatedCheckout } from '@/lib/utm'
import { REFERRAL_MIN_ORDER_GBP, FREE_SHIPPING_THRESHOLD_GBP } from '@/lib/pricing'
import { trackEventDual } from '@/lib/meta-capi'

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
    applyDiscountCode,
    removeDiscountCode,
    updateAttributes,
    isLoading,
    loadFailed,
    retryLoad,
  } = useCart()

  const [isRetrying, setIsRetrying] = useState(false)
  const handleRetryLoad = async () => {
    setIsRetrying(true)
    try {
      await retryLoad()
    } finally {
      setIsRetrying(false)
    }
  }

  const [discountCode, setDiscountCode] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [discountOpen, setDiscountOpen] = useState(false)
  const [affiliateId, setAffiliateId] = useState<string | null>(null)

  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Gift state
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [giftRecipient, setGiftRecipient] = useState('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cancel any pending gift-attribute sync if the drawer unmounts. Without
  // this, a debounced setTimeout would still fire and update an attribute on
  // a cart the user may have already abandoned.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [])

  // Hydrate gift state from cart attributes on load
  useEffect(() => {
    if (!cart?.attributes) return
    const attrs = cart.attributes
    const giftAttr = attrs.find(a => a.key === '_gift')
    const msgAttr = attrs.find(a => a.key === '_gift_message')
    const recipientAttr = attrs.find(a => a.key === '_gift_recipient')

    if (giftAttr?.value === 'true') {
      setIsGift(true)
      setGiftMessage(msgAttr?.value || '')
      setGiftRecipient(recipientAttr?.value || '')
    }
  }, [cart?.attributes])

  // Debounced sync of gift attributes to Shopify
  const syncGiftAttributes = useCallback((gift: boolean, message: string, recipient: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateAttributes([
        { key: '_gift', value: gift ? 'true' : '' },
        { key: '_gift_message', value: gift ? message : '' },
        { key: '_gift_recipient', value: gift ? recipient : '' },
      ])
    }, 800)
  }, [updateAttributes])

  // Flush pending debounce immediately (called before checkout)
  const flushGiftAttributes = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    return updateAttributes([
      { key: '_gift', value: isGift ? 'true' : '' },
      { key: '_gift_message', value: isGift ? giftMessage : '' },
      { key: '_gift_recipient', value: isGift ? giftRecipient : '' },
    ])
  }, [updateAttributes, isGift, giftMessage, giftRecipient])

  const handleGiftToggle = () => {
    const newVal = !isGift
    setIsGift(newVal)
    syncGiftAttributes(newVal, giftMessage, giftRecipient)
  }

  const handleGiftMessageChange = (value: string) => {
    if (value.length > 200) return
    setGiftMessage(value)
    syncGiftAttributes(isGift, value, giftRecipient)
  }

  const handleGiftRecipientChange = (value: string) => {
    setGiftRecipient(value)
    syncGiftAttributes(isGift, giftMessage, value)
  }

  // Focus management: save trigger, move focus into drawer on open, restore on close
  useEffect(() => {
    if (isCartOpen) {
      triggerRef.current = document.activeElement as HTMLElement
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    } else {
      triggerRef.current?.focus()
      triggerRef.current = null
    }
  }, [isCartOpen])

  // Escape key closes drawer; Tab key is trapped within drawer
  useEffect(() => {
    if (!isCartOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart()
        return
      }
      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCartOpen, closeCart])

  // Retrieve affiliate tracking ID from sessionStorage (set by ClientWrapper)
  useEffect(() => {
    const dtId = sessionStorage.getItem('affiliate_dt_id')
    if (dtId) {
      setAffiliateId(dtId)
    }
  }, [])

  // Build checkout URL with affiliate tracking and UTM params
  const getCheckoutUrl = () => {
    if (!cart?.checkoutUrl) return '#'
    try {
      const url = new URL(cart.checkoutUrl)
      if (affiliateId) url.searchParams.set('dt_id', affiliateId)
      return gatedCheckout(appendUtmToCheckout(url.toString()))
    } catch {
      return gatedCheckout(cart.checkoutUrl)
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setDiscountError('')
    setIsApplyingDiscount(true)
    try {
      await applyDiscountCode(discountCode.trim())
      setDiscountCode('')
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : 'Code not valid for this cart.')
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  // Auto-expand the discount disclosure when it holds state: a code is applied
  // or pending (a referral sitting below its £65 minimum stays in discountCodes),
  // or one was just rejected. Hiding an active or failed code behind a collapsed
  // row is worse than the old always-open field.
  const hasDiscountState = (cart?.discountCodes?.length ?? 0) > 0 || discountError !== ''
  const discountExpanded = discountOpen || hasDiscountState

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
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
        // inert (not just aria-hidden) so the off-screen drawer's controls leave
        // the tab order and a11y tree when closed. React 19 renders the prop
        // when true and omits it when undefined.
        inert={!isCartOpen || undefined}
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-jerry-green-900 border-l border-gold-500/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gold-500/20 shrink-0">
            <h2 id="cart-heading" className="text-2xl font-serif font-bold text-gold-300">
              Your Cart
            </h2>
            <button
              ref={closeButtonRef}
              onClick={closeCart}
              className="p-3 hover:bg-jerry-green-800/50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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

          {/* Free-delivery progress — pinned above the scroll (never scrolls away,
              it's the highest-value line). Copy is fixed; elevated bar + aria-live
              so the shortfall→unlocked change is seen and announced. */}
          {cart && cart.lines.length > 0 && (() => {
            const subtotal = parseFloat(cart.cost.subtotalAmount.amount)
            const shortfall = FREE_SHIPPING_THRESHOLD_GBP - subtotal
            const pct = Math.min(subtotal / FREE_SHIPPING_THRESHOLD_GBP, 1) * 100
            return (
              <div className="border-b border-gold-500/20 px-6 py-3 shrink-0">
                <p className="text-sm text-parchment-200 mb-2" aria-live="polite">
                  {shortfall > 0
                    ? `£${shortfall.toFixed(2)} to go for free UK delivery`
                    : 'Free UK delivery unlocked'}
                </p>
                <div
                  className="h-2 rounded-full bg-jerry-green-800 overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={FREE_SHIPPING_THRESHOLD_GBP}
                  aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD_GBP)}
                >
                  <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}

          {/* The single scroll region: items, upsell, secondary controls, trust. */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadFailed && !cart ? (
              // Restore failed — do NOT show the empty state, which would imply
              // the basket was wiped. The cart likely still exists on Shopify;
              // offer a retry.
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <svg
                  className="w-16 h-16 text-gold-500/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                  />
                </svg>
                <p className="text-parchment-300">We couldn&apos;t load your cart.</p>
                <button
                  onClick={handleRetryLoad}
                  disabled={isRetrying}
                  className="px-6 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-60"
                >
                  {isRetrying ? 'Retrying…' : 'Try again'}
                </button>
              </div>
            ) : !cart || cart.lines.length === 0 ? (
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
                  href="/shop/product/jerry-can-spirits-expedition-spiced-rum/"
                  onClick={closeCart}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                >
                  Start with Expedition Spiced
                </Link>
              </div>
            ) : (
              <>
                {/* Line items */}
                <div className="space-y-4">
                  {cart.lines.filter(line => line.merchandise.product.handle !== 'uk-tree-fund').map((line) => (
                    <div
                      key={line.id}
                      className="flex gap-4 p-4 bg-jerry-green-800/20 rounded-lg border border-gold-500/20"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 shrink-0 bg-jerry-green-800/20 rounded-lg overflow-hidden">
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
                          href={`/shop/product/${line.merchandise.product.handle}/`}
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
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-gold-400 font-semibold">
                            {formatPrice(
                              line.merchandise.price.amount,
                              line.merchandise.price.currencyCode
                            )}
                          </p>
                          {line.merchandise.compareAtPrice &&
                            parseFloat(line.merchandise.compareAtPrice.amount) > parseFloat(line.merchandise.price.amount) && (
                            <p className="text-parchment-500 text-sm line-through">
                              {formatPrice(
                                line.merchandise.compareAtPrice.amount,
                                line.merchandise.compareAtPrice.currencyCode
                              )}
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() =>
                              updateQuantity(line.id, Math.max(0, line.quantity - 1))
                            }
                            disabled={isLoading}
                            aria-label={line.quantity === 1 ? `Remove ${line.merchandise.product.title}` : `Decrease quantity of ${line.merchandise.product.title}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded-sm border border-gold-500/20 transition-colors disabled:opacity-50"
                          >
                            {line.quantity === 1 ? (
                              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-parchment-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            )}
                          </button>

                          <span className="text-white font-semibold w-8 text-center flex items-center justify-center">
                            {isLoading ? (
                              <svg className="w-3 h-3 animate-spin text-gold-400" viewBox="0 0 24 24" fill="none" aria-label="Updating">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : line.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            disabled={isLoading}
                            aria-label={`Increase quantity of ${line.merchandise.product.title}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded-sm border border-gold-500/20 transition-colors disabled:opacity-50"
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

                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accessory cross-sell — the single upsell surface, near the items
                    where it does its AOV work. */}
                <CartUpsell />

                {/* Presentation box — compact gift-context offer (per-bottle). */}
                <PresentationBoxUpsell />

                {/* Discount Code — collapsed behind "Have a code?" unless a code is
                    applied, pending, or rejected (then the field shows directly, so
                    an active or failed code is never hidden). */}
                <div>
                  {!hasDiscountState && (
                    <button
                      type="button"
                      onClick={() => setDiscountOpen((o) => !o)}
                      aria-expanded={discountOpen}
                      aria-controls="discount-panel"
                      className="flex items-center justify-between w-full min-h-[44px] text-sm text-parchment-300 hover:text-parchment-200 transition-colors"
                    >
                      <span>Have a code?</span>
                      <svg className={`w-4 h-4 transition-transform ${discountOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <div id="discount-panel" hidden={!discountExpanded} className={hasDiscountState ? undefined : 'mt-2'}>
                  <label htmlFor="discount-code" className="block text-xs text-parchment-400 mb-1">Discount code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="discount-code"
                      name="discount-code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Discount code"
                      className="flex-1 px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-hidden focus:border-gold-400 text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyDiscount()
                      }}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={isLoading || !discountCode.trim()}
                      className="px-4 py-2 min-h-[44px] bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-gold-300 hover:bg-jerry-green-800 transition-colors disabled:opacity-50 min-w-[72px]"
                    >
                      {isApplyingDiscount ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Applying
                        </span>
                      ) : 'Apply'}
                    </button>
                  </div>

                  {discountError && (
                    <p className="mt-2 text-sm text-red-400">{discountError}</p>
                  )}

                  {/* Show applied discounts */}
                  {cart.discountCodes && cart.discountCodes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {cart.discountCodes.map((discount, index) => {
                        // When Shopify marks a code not-applicable it gives no
                        // reason, so tell the shopper the likely one: below the
                        // £65 minimum (the common new-referral-code case) → how
                        // much more to spend; otherwise expired/invalid.
                        const shortfall =
                          REFERRAL_MIN_ORDER_GBP - parseFloat(cart.cost.subtotalAmount.amount)
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm ${discount.applicable ? 'text-green-400' : 'text-red-400'}`}>
                                <span aria-hidden="true">{discount.applicable ? '✓' : '✗'}</span>
                                <span className="sr-only">{discount.applicable ? 'Applied: ' : 'Not applicable: '}</span>
                                {' '}{discount.code}
                              </p>
                              <button
                                onClick={() => removeDiscountCode(discount.code)}
                                disabled={isLoading}
                                className="text-parchment-500 hover:text-parchment-300 text-xs transition-colors disabled:opacity-50"
                                aria-label={`Remove discount code ${discount.code}`}
                              >
                                Remove
                              </button>
                            </div>
                            {!discount.applicable && (
                              <p className="mt-0.5 text-xs text-parchment-400">
                                {shortfall > 0
                                  ? `Spend £${shortfall.toFixed(2)} more to use this code.`
                                  : "This code can't be applied to your basket — it may have expired or already been used."}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  </div>
                </div>

                {/* Gift Toggle */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGiftToggle}
                    aria-expanded={isGift}
                    aria-controls="gift-panel"
                    className="flex items-center gap-3 w-full min-h-[44px] group"
                  >
                    {/* Gift icon */}
                    <svg
                      className={`w-5 h-5 transition-colors ${isGift ? 'text-gold-400' : 'text-parchment-400 group-hover:text-parchment-300'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <span className={`text-sm font-medium transition-colors ${isGift ? 'text-gold-300' : 'text-parchment-300 group-hover:text-parchment-200'}`}>
                      This is a gift
                    </span>
                    {/* Chevron — expanded when this is a gift */}
                    <svg className={`ml-auto w-4 h-4 text-parchment-400 transition-transform ${isGift ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Gift fields — the controlled panel; `hidden` collapses it. */}
                  <div id="gift-panel" hidden={!isGift} className="space-y-3">
                      <div>
                        <label htmlFor="gift-recipient" className="block text-xs text-parchment-400 mb-1">
                          Recipient name (optional)
                        </label>
                        <input
                          type="text"
                          id="gift-recipient"
                          name="gift-recipient"
                          value={giftRecipient}
                          onChange={(e) => handleGiftRecipientChange(e.target.value)}
                          placeholder="Who is this for?"
                          className="w-full px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-hidden focus:border-gold-400 text-base"
                        />
                      </div>
                      <div>
                        <label htmlFor="gift-message" className="block text-xs text-parchment-400 mb-1">
                          Gift message
                        </label>
                        <textarea
                          id="gift-message"
                          name="gift-message"
                          value={giftMessage}
                          onChange={(e) => handleGiftMessageChange(e.target.value)}
                          placeholder="Add a personal message..."
                          rows={3}
                          className="w-full px-4 py-2 bg-jerry-green-800/50 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-hidden focus:border-gold-400 text-base resize-none"
                        />
                        <p className="text-xs text-parchment-500 text-right mt-1">
                          {giftMessage.length}/200
                        </p>
                      </div>
                    </div>
                </div>

                {/* Carbon Offset — plant a UK tree (+£1) */}
                <CarbonOffsetToggle />

                {/* Accepted payment methods (trust content — kept out of the pinned
                    footer so a decided customer never scrolls past reassurance to
                    reach the button). */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['Visa', 'Mastercard', 'Amex', 'PayPal', 'Shop Pay', 'Apple Pay'].map((method) => (
                    <span
                      key={method}
                      className="px-2 py-1 bg-jerry-green-800/50 border border-gold-500/15 rounded-sm text-parchment-500 text-[10px] uppercase tracking-wide"
                    >
                      {method}
                    </span>
                  ))}
                </div>

                {/* Continue Shopping */}
                <Link
                  href="/shop/spirits/"
                  onClick={closeCart}
                  className="block text-center text-gold-300 hover:text-gold-400 transition-colors text-sm"
                >
                  Continue Shopping
                </Link>
              </>
            )}
          </div>

          {/* Pinned footer — total + checkout. Not a scroll region: it stays put so
              a decided customer never hunts for the button. */}
          {cart && cart.lines.length > 0 && (
            <div className="shrink-0 border-t border-gold-500/20 p-4 space-y-3">
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-parchment-200">Total</span>
                <span className="text-gold-400 text-2xl">
                  {formatPrice(
                    cart.cost.totalAmount.amount,
                    cart.cost.totalAmount.currencyCode
                  )}
                </span>
              </div>

              {/* Main Checkout Button */}
              <a
                href={getCheckoutUrl()}
                onClick={(e) => {
                  // Flush any pending gift attribute updates before checkout
                  if (isGift && debounceTimerRef.current) {
                    e.preventDefault()
                    flushGiftAttributes().then(() => {
                      window.location.href = getCheckoutUrl()
                    })
                  }
                  // Track InitiateCheckout via Meta Pixel + CAPI (consent-gated inside trackEventDual)
                  trackEventDual('InitiateCheckout', {
                    content_ids: cart.lines.map(line => line.merchandise.id.split('/').pop() ?? line.merchandise.id),
                    contents: cart.lines.map(line => ({
                      id: line.merchandise.id.split('/').pop() ?? line.merchandise.id,
                      quantity: line.quantity,
                      item_price: parseFloat(line.merchandise.price.amount),
                    })),
                    value: parseFloat(cart.cost.totalAmount.amount),
                    currency: cart.cost.totalAmount.currencyCode,
                    num_items: cart.lines.reduce((sum, line) => sum + line.quantity, 0)
                  })
                  // Track begin_checkout via GA4 (consent-gated)
                  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && window.Cookiebot?.consent?.statistics) {
                    window.gtag('event', 'begin_checkout', {
                      currency: cart.cost.totalAmount.currencyCode,
                      value: parseFloat(cart.cost.totalAmount.amount),
                      items: cart.lines.map(line => ({
                        item_id: line.merchandise.id.split('/').pop() ?? line.merchandise.id,
                        item_name: line.merchandise.product.title,
                        item_variant: line.merchandise.title !== 'Default Title' ? line.merchandise.title : undefined,
                        price: parseFloat(line.merchandise.price.amount),
                        quantity: line.quantity,
                      })),
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
          )}
        </div>
      </div>
    </>
  )
}
