'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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
  updateAttributes: (attributes: CartAttribute[]) => Promise<void>
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

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
            // Two consecutive failures — likely a persistent error (expired/invalid cart ID).
            // Clear it so the user can start a fresh cart rather than being stuck.
            localStorage.removeItem('shopify_cart_id')
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
        .catch(() => { /* non-blocking — stale data is acceptable over a broken drawer */ })
    }
  }, [cart])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  const addToCart = useCallback(async (variantId: string, quantity: number = 1) => {
    // Guard against concurrent calls — both would read the same cart snapshot and could
    // create two separate Shopify carts or produce inconsistent local state
    if (isLoading) return
    setIsLoading(true)
    try {
      let currentCart = cart

      // Create cart if it doesn't exist
      if (!currentCart) {
        currentCart = await createCart()
        localStorage.setItem('shopify_cart_id', currentCart.id)
      }

      // Apply referral code to any cart that doesn't already have it set
      const referralCode = localStorage.getItem('jcs_referral_code')
      const alreadyTagged = currentCart.attributes?.some(
        (a) => a.key === '_referral_code'
      ) ?? false
      if (referralCode && !alreadyTagged) {
        try {
          currentCart = await shopifyApplyDiscount(currentCart.id, [referralCode])
          currentCart = await shopifyUpdateCartAttributes(currentCart.id, [
            { key: '_referral_code', value: referralCode },
          ])
        } catch (err) {
          console.warn('[CartContext] Failed to apply referral code:', err)
        }
      }

      const updatedCart = await shopifyAddToCart(currentCart.id, variantId, quantity)
      setCart(updatedCart)

      // Open cart drawer to show item was added
      setIsCartOpen(true)
    } catch (error) {
      console.error('[CartContext] Error adding to cart:', error)
      alert('Failed to add item to cart. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [cart, isLoading])

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

    setIsLoading(true)
    try {
      const updatedCart = await shopifyRemoveFromCart(cart.id, [lineId])
      setCart(updatedCart)
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
      const updatedCart = await shopifyApplyDiscount(cart.id, [code])
      setCart(updatedCart)

      // Check if discount was applied successfully
      const discountApplied = updatedCart.discountCodes?.some(
        (discount) => discount.code === code && discount.applicable
      )

      if (discountApplied) {
        alert(`Discount code "${code}" applied successfully!`)
      } else {
        alert(`Discount code "${code}" is not valid or applicable.`)
      }
    } catch (error) {
      console.error('Error applying discount:', error)
      alert('Failed to apply discount code. Please try again.')
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
      updateAttributes,
      itemCount,
    }),
    [cart, isLoading, isCartOpen, openCart, closeCart, addToCart, updateQuantity, removeItem, applyDiscountCode, updateAttributes, itemCount]
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
