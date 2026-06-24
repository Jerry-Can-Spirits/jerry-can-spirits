import { describe, it, expect } from 'vitest'
import { costPerBaseUnitP, usableCostPerBaseUnitP } from '@/lib/pouriq/calculations'

describe('costPerBaseUnitP', () => {
  it('700ml bottle for £20 -> ~0.0286p/ml', () => {
    expect(costPerBaseUnitP(2000, 1, 700)).toBeCloseTo(2000 / 700, 6)
  })
  it('case of 24x200ml for £14.40 -> 0.003p/ml', () => {
    expect(costPerBaseUnitP(1440, 24, 200)).toBeCloseTo((1440 / 24) / 200, 6)
  })
  it('40 lemons for £8 -> 20p each', () => {
    expect(costPerBaseUnitP(800, 40, 1)).toBeCloseTo(20, 6)
  })
  it('5kg sugar for £6 -> 0.0012p/g', () => {
    expect(costPerBaseUnitP(600, 1, 5000)).toBeCloseTo(600 / 5000, 6)
  })
  it('defends against zero packs/size', () => {
    expect(costPerBaseUnitP(700, 0, 0)).toBeCloseTo(700, 6)
  })
})

describe('usableCostPerBaseUnitP', () => {
  it('is a no-op at 100% yield', () => {
    expect(usableCostPerBaseUnitP(2000, 1, 700, 100)).toBeCloseTo(2000 / 700, 6)
  })
  it('raises cost as yield drops (lime 75%)', () => {
    expect(usableCostPerBaseUnitP(800, 40, 1, 75)).toBeCloseTo(20 / 0.75, 6)
  })
  it('treats 0/negative yield as 100%', () => {
    expect(usableCostPerBaseUnitP(2000, 1, 700, 0)).toBeCloseTo(2000 / 700, 6)
  })
})
