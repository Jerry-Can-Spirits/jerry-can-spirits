/**
 * The trade sheet's price arithmetic.
 *
 * These figures are the ones a venue reads before deciding what to order and
 * then checks against its invoice, so a penny out is a support email. The sheet
 * previously rendered from a hardcoded constant that had drifted £18 a case
 * behind Shopify; it now derives from the live price, which makes this rounding
 * the only thing left that can put the two out of step.
 */
import { describe, it, expect } from 'vitest'
import { priceRows, toPence, tradePricePence, tradeRule, TRADE_DISCOUNT_PCT } from '@/lib/trade-portal/product-data'

const CASE = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'
const BOTTLE = 'jerry-can-spirits-expedition-spiced-rum'

describe('toPence', () => {
  it('converts a Shopify money amount', () => {
    expect(toPence('228.00')).toBe(22800)
    expect(toPence('40.00')).toBe(4000)
    expect(toPence('18.50')).toBe(1850)
  })

  it('rounds rather than truncates', () => {
    // parseFloat('227.999999') * 100 is 22799.9999, and truncating would quote
    // the case a penny light. This is the case the rounding exists for.
    expect(toPence('227.999999')).toBe(22800)
  })

  it('is not asked to settle half a penny', () => {
    // Shopify money amounts carry two decimals, so a true half-penny never
    // reaches this function. Worth pinning because the answer is not the
    // arithmetic one: 39.995 * 100 is 3999.4999999999995 in float, so it rounds
    // DOWN. Anything relying on half-penny behaviour here would be wrong.
    expect(toPence('39.995')).toBe(3999)
  })
})

describe('priceRows', () => {
  it('quotes list and trade for a case', () => {
    const [list, trade] = priceRows(22800)

    expect(list.discount_pct).toBe(0)
    expect(list.inc_vat_p).toBe(22800)
    expect(list.ex_vat_p).toBe(19000)

    expect(trade.discount_pct).toBe(TRADE_DISCOUNT_PCT)
    expect(trade.discount_label).toBe('10% off')
    expect(trade.inc_vat_p).toBe(20520)
    expect(trade.ex_vat_p).toBe(17100)
  })

  it('quotes a bespoke case price as a fixed amount off, exactly', () => {
    // TRADECASE150: £48 off each case, so £228 becomes £180 and £150 ex VAT,
    // which is the £25 a bottle that was agreed. A percentage cannot land on
    // this figure (21.0526%), which is why the rule is an amount and the test
    // pins the pennies.
    const [list, trade] = priceRows(22800, tradeRule('TRADECASE150'), CASE)
    expect(list.inc_vat_p).toBe(22800)
    expect(trade.inc_vat_p).toBe(18000)
    expect(trade.ex_vat_p).toBe(15000)
    expect(trade.discount_pct).toBe(21)
    expect(trade.discount_label).toBe('£48.00 off')
  })

  it('shows no discount on a product an amount-off rule does not cover', () => {
    // The Shopify code is scoped to the case, so a single bottle goes through
    // at list. The sheet must not promise otherwise.
    const [list, trade] = priceRows(4000, tradeRule('TRADECASE150'), BOTTLE)
    expect(trade.inc_vat_p).toBe(list.inc_vat_p)
    expect(trade.discount_pct).toBe(0)
    expect(trade.discount_label).toBe('—')
    // And without a handle the rule is treated as not covering the product.
    expect(tradePricePence(tradeRule('TRADECASE150'), 22800)).toBe(22800)
  })

  it('treats an unknown code as no discount rather than guessing', () => {
    expect(tradeRule('NOT-A-CODE')).toBeNull()
    expect(tradeRule(null)).toBeNull()
    const [list, trade] = priceRows(22800, tradeRule('NOT-A-CODE'), CASE)
    expect(trade.inc_vat_p).toBe(list.inc_vat_p)
  })

  it('quotes list and trade for a single bottle', () => {
    const [list, trade] = priceRows(4000)

    expect(list.inc_vat_p).toBe(4000)
    // £40 inc VAT is £33.33 ex, not £32: VAT is a sixth of the gross, not a
    // fifth of it. Getting this backwards overstates the discount by 20%.
    expect(list.ex_vat_p).toBe(3333)

    expect(trade.inc_vat_p).toBe(3600)
    expect(trade.ex_vat_p).toBe(3000)
  })

  it('quotes a 15% account from its own code', () => {
    const [, trade] = priceRows(22800, tradeRule('TRADE15'), CASE)
    expect(trade.discount_pct).toBe(15)
    expect(trade.discount_label).toBe('15% off')
    expect(trade.inc_vat_p).toBe(19380)
    expect(trade.ex_vat_p).toBe(16150)
    const [, bottle] = priceRows(4000, tradeRule('TRADE15'), BOTTLE)
    expect(bottle.inc_vat_p).toBe(3400)
  })

  it('derives ex VAT from the rounded inc-VAT figure, not the raw base', () => {
    // Both columns of a row must describe the same penny. Dividing the
    // unrounded base by 1.2 can land a penny away from inc / 1.2, and a sheet
    // whose two columns disagree is worse than one that is merely approximate.
    for (const base of [22800, 4000, 1850, 999, 1]) {
      for (const row of priceRows(base)) {
        expect(row.ex_vat_p).toBe(Math.round(row.inc_vat_p / 1.2))
      }
    }
  })

  it('always returns list first and trade second', () => {
    const rows = priceRows(22800)
    expect(rows.map((r) => r.key)).toEqual(['rrp', 'trade'])
    // The trade row is the one the sheet highlights; a reordering here would
    // silently highlight the list price instead.
    expect(rows[1].inc_vat_p).toBeLessThan(rows[0].inc_vat_p)
  })
})
