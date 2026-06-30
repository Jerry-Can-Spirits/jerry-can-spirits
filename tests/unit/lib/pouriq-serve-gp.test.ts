import { describe, it, expect } from 'vitest'
import { serveGp } from '@/lib/pouriq/calculations'

describe('serveGp', () => {
  it('null when price is 0', () => {
    expect(serveGp({ costPerMlNetP: 2, pourMl: 25, salePriceP: 0, pricesIncludeVat: false })).toBeNull()
  })
  it('ex-VAT price: GP = (price - cost) / price', () => {
    // cost = 2p/ml * 25 = 50p; price 350p ex VAT -> (350-50)/350 = 85.71%
    expect(serveGp({ costPerMlNetP: 2, pourMl: 25, salePriceP: 350, pricesIncludeVat: false })).toBeCloseTo(85.71, 1)
  })
  it('inc-VAT price is netted first', () => {
    // price 360p inc VAT -> net 300p; cost 50p -> (300-50)/300 = 83.33%
    expect(serveGp({ costPerMlNetP: 2, pourMl: 25, salePriceP: 360, pricesIncludeVat: true })).toBeCloseTo(83.33, 1)
  })
  it('zero cost -> 100%', () => {
    expect(serveGp({ costPerMlNetP: 0, pourMl: 25, salePriceP: 350, pricesIncludeVat: false })).toBe(100)
  })
})
