import { describe, expect, it } from 'vitest'
import { specToColumns, variantIdsFor, venueCodeFor, venueCodeStem } from '@/lib/trade-portal/discount-codes'
import { ruleForAccount, tradePricePence } from '@/lib/trade-portal/product-data'
import type { TradeProduct } from '@/lib/trade-products'

const CASE = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'

describe('venueCodeStem', () => {
  it('drops a leading "The", punctuation and accents, and upper-cases', () => {
    expect(venueCodeStem('The Victory')).toBe('VICTORY')
    expect(venueCodeStem('Saxtys')).toBe('SAXTYS')
    expect(venueCodeStem('The Bank Bar & Grill')).toBe('BANKBARGRILL')
    expect(venueCodeStem("Café Rouge")).toBe('CAFEROUGE')
  })

  it('caps a long name and never returns an empty stem', () => {
    expect(venueCodeStem('The Lichfield Vaults and Cellar Bar').length).toBeLessThanOrEqual(16)
    expect(venueCodeStem('!!!')).toBe('VENUE')
  })
})

describe('venueCodeFor', () => {
  it('names the venue and nothing about the deal', () => {
    // The code shows at checkout and on every order email, so it says whose
    // it is and keeps the price to the account (Dan, 1 Oct 2026).
    expect(venueCodeFor('The Victory')).toBe('VICTORY-TRADE')
    expect(venueCodeFor('Saxtys')).toBe('SAXTYS-TRADE')
  })
})

const products: TradeProduct[] = [
  { handle: CASE, title: 'Case', category: 'spirits', variants: [{ id: 'gid://v/case', title: 'Default Title', price: '228.00' }] },
  { handle: 'jerry-can-spirits-expedition-spiced-rum', title: 'Bottle', category: 'spirits', variants: [{ id: 'gid://v/bottle', title: 'Default Title', price: '40.00' }] },
  { handle: 'uk-tree-fund', title: 'Tree', category: 'sustainability', excludeFromDiscount: true, variants: [{ id: 'gid://v/tree', title: 'Default Title', price: '1.00' }] },
]

describe('variantIdsFor', () => {
  it('scopes a percentage to the whole catalogue except the excluded items', () => {
    expect(variantIdsFor({ kind: 'percent', percent: 15 }, products)).toEqual(['gid://v/case', 'gid://v/bottle'])
  })
  it('scopes an amount off to the named handles only', () => {
    expect(variantIdsFor({ kind: 'amountOff', pencePerItem: 4800, handles: [CASE] }, products)).toEqual(['gid://v/case'])
  })
})

describe('ruleForAccount', () => {
  it('prices from the stored rule, so a new venue needs no entry in the code table', () => {
    const rule = ruleForAccount({ discount_code: 'VICTORY15', discount_kind: 'percent', discount_value: 15 })
    expect(rule?.kind).toBe('percent')
    expect(tradePricePence(rule, 22800, CASE)).toBe(19380)
    expect(rule?.summary).toBe('15% trade discount')
  })

  it('round-trips an amount-off rule through its columns', () => {
    const columns = specToColumns({ kind: 'amountOff', pencePerItem: 4800, handles: [CASE] })
    const rule = ruleForAccount({ discount_code: 'SAXTYS180', discount_kind: columns.kind, discount_value: columns.value, discount_handles: columns.handles })
    expect(tradePricePence(rule, 22800, CASE)).toBe(18000)
    expect(tradePricePence(rule, 4000, 'jerry-can-spirits-expedition-spiced-rum')).toBe(4000)
    expect(rule?.summary).toBe('£48.00 off each case')
  })

  it('falls back to the shared-code table when the row carries no rule', () => {
    expect(ruleForAccount({ discount_code: 'TRADE10' })?.kind).toBe('percent')
    expect(ruleForAccount({ discount_code: 'NOPE' })).toBeNull()
  })
})
