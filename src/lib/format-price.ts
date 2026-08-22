/**
 * One price formatter, because there were ten.
 *
 * Every shop page and every cart component carried its own copy, in three
 * different shapes: eight took (string, currencyCode), CartUpsell took
 * (number, currencyCode) and TradeOrderForm took (string | number) with the
 * pound sign hardcoded. Ten copies of four lines is cheap to write and
 * expensive to correct, and a rounding or symbol decision made in one of them
 * was a decision made in one tenth of the shop.
 *
 * THE FAILURE THIS FIXES. Every copy did `parseFloat(amount).toFixed(2)` with
 * nothing between a bad value and the page. parseFloat('') and
 * parseFloat(undefined as never) are both NaN, and NaN.toFixed(2) is the string
 * "NaN", so a missing price rendered as "£NaN" in the cart rather than failing
 * or falling back. A price we cannot compute is not zero and not free, so it
 * shows an em dash and says nothing it cannot support.
 */

const SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }

/** Shown when the amount is missing or unparseable. */
export const PRICE_UNAVAILABLE = '—'

export function formatPrice(amount: string | number | null | undefined, currencyCode = 'GBP'): string {
  const value = typeof amount === 'number' ? amount : parseFloat(amount ?? '')
  if (!Number.isFinite(value)) return PRICE_UNAVAILABLE
  return `${SYMBOLS[currencyCode] ?? currencyCode}${value.toFixed(2)}`
}
