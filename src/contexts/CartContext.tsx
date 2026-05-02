'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'
import {
  createCart,
  addToCart as shopifyAddToCart,
  updateCartLine,
  removeFromCart as shopifyRemoveFromCart,
  applyDiscount as shopifyApplyDiscount,
  updateCartAttributes as shopifyUpdateCartAttributes,
  getCart,
  type Cart,
  type CartAttribute,
} from '@/lib/shopify'
import { applyReferralCode } from '@/lib/referrals'

interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  updateQuantity: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  applyDiscountCode: (code: string) => Promise<void>
  removeDiscountCode: (code: string) => Promise<void>
  updateAttributes: (attributes: CartAttribute[]) => Promise<void>
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Synchronous in-flight flag for addToCart. setIsLoading is batched by React
  // so two synchronous clicks could both pass an `if (isLoading) return` guard.
  // A ref is updated immediately and prevents the double-cart-create race.
  const addInFlightRef = useRef(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      const cartId = localStorage.getItem('shopify_cart_id')
      if (!cartId) return

      // Retry once before giving up — a single network hiccup should not orphan the cart
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const existingCart = await getCart(cartId)
          if (existingCart) {
            setCart(existingCart)
          } else {
            // Cart expired or deleted on Shopify's side — clear the stale reference
            localStorage.removeItem('shopify_cart_id')
          }
          return
        } catch (error) {
          if (attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          } else {
            console.error('Error loading cart after retry:', error)
            // Two consecutive throws — could be a persistent invalid cart ID, but is
            // just as likely a transient Shopify 5xx. Leaving the cartId in place
            // means a refresh after the outage will still find their cart;
            // dropping it permanently empties carts during every brief outage.
          }
        }
      }
    }

    loadCart()
  }, [])

  const openCart = useCallback(() => {
    setIsCartOpen(true)
    // Refresh cart from Shopify on drawer open to ensure totals and availability are current
    if (cart?.id) {
      getCart(cart.id)
        .then(fresh => { if (fresh) setCart(fresh) })
        .catch(error => {
          // Non-blocking — stale data is acceptable over a broken drawer.
          // Drop a breadcrumb so if the next thing the user does errors,
          // Sentry has context about the cart-refresh failure.
          Sentry.addBreadcrumb({
            category: 'cart',
            message: 'openCart refresh failed',
            level: 'warning',
            data: { error: error instanceof Error ? error.message : String(error) },
          })
        })
    }
  }, [cart])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  const addToCart = useCallback(async (variantId: string, quantity: number = 1) => {
    // Guard against concurrent calls — two synchronous clicks would read the same
    // cart snapshot and create two separate Shopify carts. The ref is set
    // immediately, before React batches the setIsLoading state update.
    if (addInFlightRef.current) return
    addInFlightRef.current = true
    setIsLoading(true)
    try {
      let currentCart = cart

      // Create cart if it doesn't exist
      if (!currentCart) {
        currentCart = await createCart()
        localStorage.setItem('shopify_cart_id', currentCart.id)
      }

      currentCart = await applyReferralCode(currentCart)

      const updatedCart = await shopifyAddToCart(currentCart.id, variantId, quantity)
      setCart(updatedCart)

      // Open cart drawer to show item was added
      setIsCartOpen(true)
    } catch (error) {
      console.error('[CartContext] Error adding to cart:', error)
      // Cart may have expired on Shopify's side — clear stale ID so next attempt creates fresh cart
      localStorage.removeItem('shopify_cart_id')
      setCart(null)
      alert('Failed to add item to cart. Please try again.')
    } finally {
      setIsLoading(false)
      addInFlightRef.current = false
    }
  }, [cart])

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return

    setIsLoading(true)
    try {
      const updatedCart = await updateCartLine(cart.id, lineId, quantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Error updating cart:', error)
      alert('Failed to update quantity. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return

    const removedLine = cart.lines.find(l => l.id === lineId)

    setIsLoading(true)
    try {
      const updatedCart = await shopifyRemoveFromCart(cart.id, [lineId])
      setCart(updatedCart)

      if (removedLine && typeof window !== 'undefined' && typeof window.gtag === 'function' && window.Cookiebot?.consent?.statistics) {
        window.gtag('event', 'remove_from_cart', {
          currency: removedLine.merchandise.price.currencyCode,
          value: parseFloat(removedLine.merchandise.price.amount) * removedLine.quantity,
          items: [{
            item_id: removedLine.merchandise.id.split('/').pop() ?? removedLine.merchandise.id,
            item_name: removedLine.merchandise.product.title,
            item_variant: removedLine.merchandise.title !== 'Default Title' ? removedLine.merchandise.title : undefined,
            price: parseFloat(removedLine.merchandise.price.amount),
            quantity: removedLine.quantity,
          }],
        })
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const applyDiscountCode = useCallback(async (code: string) => {
    if (!cart) return

    setIsLoading(true)
    try {
      // Preserve currently-applicable codes; add new code on top
      const existing = cart.discountCodes?.filter(d => d.applicable).map(d => d.code) ?? []
      const updatedCart = await shopifyApplyDiscount(cart.id, [...existing, code])

      const applicable = updatedCart.discountCodes?.some(d => d.code === code && d.applicable)
      if (!applicable) {
        // Remove the rejected code so it doesn't persist in the cart UI
        const clean = updatedCart.discountCodes?.filter(d => d.applicable).map(d => d.code) ?? []
        const cleanCart = await shopifyApplyDiscount(updatedCart.id, clean)
        setCart(cleanCart)
        throw new Error(`"${code}" is not valid for this cart.`)
      }
      setCart(updatedCart)
    } catch (error) {
      if (error instanceof Error && error.message.includes('is not valid')) throw error
      console.error('Error applying discount:', error)
      throw new Error('Failed to apply discount code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const removeDiscountCode = useCallback(async (code: string) => {
    if (!cart) return
    setIsLoading(true)
    try {
      const remaining = cart.discountCodes?.filter(d => d.code !== code).map(d => d.code) ?? []
      const updatedCart = await shopifyApplyDiscount(cart.id, remaining)
      setCart(updatedCart)
    } catch (error) {
      console.error('Error removing discount code:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cart])

  const updateAttributes = useCallback(async (attributes: CartAttribute[]) => {
    if (!cart) return

    try {
      const updatedCart = await shopifyUpdateCartAttributes(cart.id, attributes)
      setCart(updatedCart)
    } catch (error) {
      console.error('Error updating cart attributes:', error)
    }
  }, [cart])

  const itemCount = useMemo(
    () => cart?.lines.reduce((total, line) => total + line.quantity, 0) || 0,
    [cart]
  )

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      isLoading,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeItem,
      applyDiscountCode,
      removeDiscountCode,
      updateAttributes,
      itemCount,
    }),
    [cart, isLoading, isCartOpen, openCart, closeCart, addToCart, updateQuantity, removeItem, applyDiscountCode, removeDiscountCode, updateAttributes, itemCount]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
