'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  createCart,
  addToCart as shopifyAddToCart,
  updateCartLine,
  removeFromCart as shopifyRemoveFromCart,
  applyDiscount as shopifyApplyDiscount,
  getCart,
  type Cart,
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

      if (cartId) {
        try {
          const existingCart = await getCart(cartId)
          if (existingCart) {
            setCart(existingCart)
          } else {
            // Cart doesn't exist anymore, create a new one
            localStorage.removeItem('shopify_cart_id')
          }
        } catch (error) {
          console.error('Error loading cart:', error)
          localStorage.removeItem('shopify_cart_id')
        }
      }
    }

    loadCart()
  }, [])

  const openCart = useCallback(() => {
    setIsCartOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  const addToCart = useCallback(async (variantId: string, quantity: number = 1) => {
    console.log('[CartContext] Starting addToCart:', { variantId, quantity })
    setIsLoading(true)
    try {
      let currentCart = cart

      // Create cart if it doesn't exist
      if (!currentCart) {
        console.log('[CartContext] No cart exists, creating new cart...')
        currentCart = await createCart()
        localStorage.setItem('shopify_cart_id', currentCart.id)
        console.log('[CartContext] New cart created:', currentCart.id)
      }

      // Add item to cart
      console.log('[CartContext] Adding item to cart:', currentCart.id)
      const updatedCart = await shopifyAddToCart(currentCart.id, variantId, quantity)
      console.log('[CartContext] Cart updated successfully:', {
        cartId: updatedCart.id,
        lineCount: updatedCart.lines.length,
        totalItems: updatedCart.lines.reduce((sum, line) => sum + line.quantity, 0)
      })
      setCart(updatedCart)

      // Open cart drawer to show item was added
      setIsCartOpen(true)
    } catch (error) {
      console.error('[CartContext] Error adding to cart:', error)
      alert('Failed to add item to cart. Please try again.')
    } finally {
      setIsLoading(false)
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

  // Calculate total item count
  const itemCount = cart?.lines.reduce((total, line) => total + line.quantity, 0) || 0

  const value: CartContextType = {
    cart,
    isLoading,
    isCartOpen,
    openCart,
    closeCart,
    addToCart,
    updateQuantity,
    removeItem,
    applyDiscountCode,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
