// The October 2026 offer: the gift-boxed bottle at the bottle price, by a
// Shopify automatic discount that runs 18 to 31 October and ends itself. The
// product page shows list price (the Storefront API does not expose automatic
// discounts on a product), so the pages state the offer in words and the cart
// shows the discounted total. Everything here is time-boxed by OFFER_ENDS_AT.

// 31 October 2026, 11.59pm in Europe/London. British Summer Time ended on
// 25 October 2026, so London is on GMT that night and the instant is UTC.
export const OFFER_ENDS_AT = Date.UTC(2026, 9, 31, 23, 59, 0)

export const OFFER_HEADLINE = 'Gift boxed at the bottle price. Until 31 October.'

export const OFFER_LINE =
  'Expedition Spiced Rum in its presentation box, ready to hand over, for the price of the bottle: £40, delivered. Until 31 October, 11.59pm.'

export const OFFER_ENDED_LINE = 'The October offer has ended.'

export const PROOF_LINES = [
  'Caribbean rum, seven real spices, two natural sweeteners and bourbon oak. Every ingredient listed.',
  'IWSC 2026 Bronze for the rum. Silver for the serve with Franklin & Sons cola. Judged blind.',
  'Dispatched within two working days. Tracked. Age-verified at your door.',
]

export const OFFER_CTA = 'Add the gift-boxed bottle to your basket'

// The taste guarantee. The wording is not final (brief section 5, Dan to
// approve the text and the cap of 100); the slot renders only once this is
// non-empty, and the Shipping and Returns page and the Terms gain the clause
// on the same day it goes live.
export const GUARANTEE_COPY: string = ''

export function offerLive(now: number): boolean {
  return now < OFFER_ENDS_AT
}

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Whole units until the offer ends, or null once it has. */
export function timeLeft(now: number): TimeLeft | null {
  const ms = OFFER_ENDS_AT - now
  if (ms <= 0) return null
  const total = Math.floor(ms / 1000)
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

function unit(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function formatTimeLeft(t: TimeLeft): string {
  const parts = [unit(t.hours, 'hour'), unit(t.minutes, 'minute'), unit(t.seconds, 'second')]
  if (t.days > 0) parts.unshift(unit(t.days, 'day'))
  return parts.join(', ')
}
