// Gift cards: the rules Shopify applies to a recipient, and the cart line
// attributes that carry them. Shopify reads these exact keys from a cart line
// and turns them into the gift card's recipient, message and send date; a line
// without them issues the card to the buyer instead.
// https://shopify.dev/docs/storefronts/themes/product-merchandising/gift-cards

import type { CartAttribute } from './shopify'

export const GIFT_CARD_HANDLE = 'jerry-can-spirits-gift-card'

/** Shopify's limits on a recipient gift card. */
export const GIFT_CARD_MESSAGE_MAX = 200
export const GIFT_CARD_NAME_MAX = 255
export const GIFT_CARD_SEND_DAYS_MAX = 90

/** The visible line property naming who the card is from. Not a Shopify key. */
export const GIFT_CARD_FROM_KEY = 'From'

const KEY_SEND = '__shopify_send_gift_card_to_recipient'
const KEY_EMAIL = 'Recipient email'
const KEY_NAME = 'Recipient name'
const KEY_MESSAGE = 'Message'
const KEY_SEND_ON = 'Send on'
const KEY_OFFSET = '__shopify_offset'

/** A gift card is identified by its Shopify product type. */
export function isGiftCardProductType(productType?: string | null): boolean {
  return (productType || '').trim().toLowerCase() === 'gift card'
}

export type GiftCardDelivery =
  | {
      mode: 'recipient'
      recipientName: string
      recipientEmail: string
      fromName: string
      message: string
      /** yyyy-mm-dd, or empty to send now. */
      sendOn: string
    }
  | { mode: 'self' }

export type GiftCardField = 'recipientName' | 'recipientEmail' | 'fromName' | 'message' | 'sendOn'
export type GiftCardErrors = Partial<Record<GiftCardField, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** yyyy-mm-dd for a date in the buyer's local calendar. */
export function isoLocalDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** The last date Shopify will accept for a scheduled send, counted from `today`. */
export function latestSendDate(today: Date): string {
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + GIFT_CARD_SEND_DAYS_MAX)
  return isoLocalDate(last)
}

/** Field errors in the words the form shows. An empty object means valid. */
export function validateGiftCardDelivery(d: GiftCardDelivery, today: Date): GiftCardErrors {
  if (d.mode === 'self') return {}
  const errors: GiftCardErrors = {}
  if (!d.recipientName.trim()) errors.recipientName = 'Add their name.'
  else if (d.recipientName.length > GIFT_CARD_NAME_MAX) errors.recipientName = 'That name is too long.'
  if (!d.recipientEmail.trim()) errors.recipientEmail = 'We need their email address to send it.'
  else if (!EMAIL_RE.test(d.recipientEmail.trim())) errors.recipientEmail = 'That email address does not look right.'
  if (d.fromName.length > GIFT_CARD_NAME_MAX) errors.fromName = 'That name is too long.'
  if (d.message.length > GIFT_CARD_MESSAGE_MAX) errors.message = `Keep the message to ${GIFT_CARD_MESSAGE_MAX} characters.`
  if (d.sendOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.sendOn)) errors.sendOn = 'Choose a date.'
    else if (d.sendOn < isoLocalDate(today)) errors.sendOn = 'Choose today or a later date.'
    else if (d.sendOn > latestSendDate(today)) errors.sendOn = `Choose a date within the next ${GIFT_CARD_SEND_DAYS_MAX} days.`
  }
  return errors
}

/**
 * The cart line attributes for a gift card. `tzOffsetMinutes` is the buyer's
 * `new Date().getTimezoneOffset()`, which Shopify uses to send a scheduled
 * card at the start of that day rather than in the shop's time zone.
 */
export function giftCardLineAttributes(d: GiftCardDelivery, tzOffsetMinutes: number): CartAttribute[] {
  if (d.mode === 'self') return []
  const attrs: CartAttribute[] = [
    { key: KEY_SEND, value: 'true' },
    { key: KEY_EMAIL, value: d.recipientEmail.trim() },
    { key: KEY_NAME, value: d.recipientName.trim() },
  ]
  if (d.message.trim()) attrs.push({ key: KEY_MESSAGE, value: d.message.trim() })
  if (d.sendOn) {
    attrs.push({ key: KEY_SEND_ON, value: d.sendOn })
    attrs.push({ key: KEY_OFFSET, value: String(tzOffsetMinutes) })
  }
  if (d.fromName.trim()) attrs.push({ key: GIFT_CARD_FROM_KEY, value: d.fromName.trim() })
  return attrs
}

/** The basket's one-line summary of a gift card line, or null for any other line. */
export function giftCardLineSummary(attributes: CartAttribute[] | undefined, today: Date): string | null {
  if (!attributes) return null
  const get = (k: string) => attributes.find((a) => a.key === k)?.value
  if (get(KEY_SEND) !== 'true') return null
  const name = get(KEY_NAME) || get(KEY_EMAIL) || 'them'
  const sendOn = get(KEY_SEND_ON)
  if (!sendOn || sendOn <= isoLocalDate(today)) return `For ${name}, sending now`
  const [y, m, d] = sendOn.split('-').map(Number)
  const when = new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  return `For ${name}, sending ${when}`
}
