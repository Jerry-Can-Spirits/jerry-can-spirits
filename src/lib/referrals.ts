import {
  applyDiscount as shopifyApplyDiscount,
  updateCartAttributes as shopifyUpdateCartAttributes,
} from '@/lib/shopify'
import type { Cart } from '@/lib/shopify'

export async function applyReferralCode(cart: Cart): Promise<Cart> {
  const referralCode = localStorage.getItem('jcs_referral_code')
  const alreadyTagged = cart.attributes?.some((a) => a.key === '_referral_code') ?? false

  if (!referralCode || alreadyTagged) return cart

  try {
    let updated = await shopifyApplyDiscount(cart.id, [referralCode])
    updated = await shopifyUpdateCartAttributes(updated.id, [
      { key: '_referral_code', value: referralCode },
    ])
    return updated
  } catch {
    return cart
  }
}
