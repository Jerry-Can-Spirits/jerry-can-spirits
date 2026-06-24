import { describe, it, expect } from 'vitest'
import { costPerMlP, unitPourCostP, bottlePourCostP, formatPurchaseBasis } from '@/lib/pouriq/calculations'

describe('purchase-basis cost helpers', () => {
  it('per-ml cost divides the purchase price by qty then by size', () => {
    // £14.40 case of 24 × 200ml -> 60p/bottle -> 0.3p/ml
    expect(costPerMlP(1440, 200, 24)).toBeCloseTo(0.3, 5)
  })
  it('per-ml cost for a single bottle (qty 1) is unchanged', () => {
    expect(costPerMlP(2000, 700, 1)).toBeCloseTo(2000 / 700, 5)
  })
  it('bottlePourCostP: 150ml from the £14.40/24×200ml case = ~45p', () => {
    expect(bottlePourCostP(1440, 200, 24, 150)).toBe(45)
  })
  it('unitPourCostP: 1/8 of a £2-for-6 lemon = ~4p', () => {
    expect(unitPourCostP(200, 6, 0.125)).toBe(4)
  })
  it('unitPourCostP qty 1 unchanged (30p unit, count 1)', () => {
    expect(unitPourCostP(30, 1, 1)).toBe(30)
  })
})

describe('formatPurchaseBasis', () => {
  it('case of small bottles', () => {
    expect(formatPurchaseBasis({ base_unit: 'ml', pack_size: 200, price_p: 1440, purchase_qty: 24 }))
      .toBe('£14.40 / 24 × 200ml (£0.003/ml)')
  })
  it('single bottle', () => {
    expect(formatPurchaseBasis({ base_unit: 'ml', pack_size: 700, price_p: 2000, purchase_qty: 1 }))
      .toBe('£20.00 / 700ml (£0.029/ml)')
  })
  it('pack of whole items', () => {
    expect(formatPurchaseBasis({ base_unit: 'each', pack_size: 1, price_p: 200, purchase_qty: 6 }))
      .toBe('£2.00 / 6 (£0.33 each)')
  })
  it('g base unit: 5kg sugar bag', () => {
    expect(formatPurchaseBasis({ base_unit: 'g', pack_size: 5000, price_p: 600, purchase_qty: 1 }))
      .toBe('£6.00 / 5000g (£0.001/g)')
  })
  it('single each item', () => {
    expect(formatPurchaseBasis({ base_unit: 'each', pack_size: 1, price_p: 33, purchase_qty: 1 }))
      .toBe('£0.33 (£0.33 each)')
  })
})
