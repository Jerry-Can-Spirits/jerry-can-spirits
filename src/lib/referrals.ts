import {
  applyDiscount as shopifyApplyDiscount,
  updateCartAttributes as shopifyUpdateCartAttributes,
} from '@/lib/shopify'
import type { Cart } from '@/lib/shopify'

// Defensive ceiling on referral codes pulled from localStorage. Real codes
// are 8-16 chars; anything materially longer is either a typo or someone
// stuffing the cart attribute with junk via DevTools. Capped before going
// to Shopify so we don't push unbounded user-controlled strings upstream.
const MAX_REFERRAL_CODE_LENGTH = 32
const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9_-]+$/

export async function applyReferralCode(cart: Cart): Promise<Cart> {
  const rawCode = localStorage.getItem('jcs_referral_code')
  const referralCode =
    rawCode && rawCode.length <= MAX_REFERRAL_CODE_LENGTH && REFERRAL_CODE_PATTERN.test(rawCode)
      ? rawCode
      : null
  const alreadyTagged = cart.attributes?.some((a) => a.key === '_referral_code') ?? false

  if (!referralCode || alreadyTagged) return cart

  try {
    // Merge, don't replace: keep any codes already on the cart (e.g. a manually
    // entered promo) and add the referral. cartDiscountCodesUpdate replaces the
    // whole set, so passing only the referral would silently delete the other.
    // Shopify then decides combinability/applicability, shown in the cart UI —
    // no code is ever destroyed without the shopper seeing it.
    const existing = cart.discountCodes?.map((d) => d.code) ?? []
    const codes = existing.includes(referralCode) ? existing : [...existing, referralCode]
    let updated = await shopifyApplyDiscount(cart.id, codes)
    updated = await shopifyUpdateCartAttributes(updated.id, [
      { key: '_referral_code', value: referralCode },
    ])
    return updated
  } catch {
    return cart
  }
}
