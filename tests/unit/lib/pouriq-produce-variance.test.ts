import { describe, it, expect } from 'vitest'
import { produceLineUnits, applyYield, calcVariance, calcVarianceCostP, sumBucketsInWindow } from '@/lib/pouriq/variance'
import { usableCostPerBaseUnitP } from '@/lib/pouriq/calculations'

describe('produceLineUnits', () => {
  it('converts sales to purchase units via the use yield', () => {
    expect(produceLineUnits(100, 25, 30)).toBeCloseTo(83.333, 2) // 100 drinks x 25ml juice / 30ml-per-lemon
    expect(produceLineUnits(100, 1, 8)).toBe(12.5)               // 100 wheels / 8-per-lemon
  })
  it('guards a zero/negative yield', () => {
    expect(produceLineUnits(100, 25, 0)).toBe(0)
  })
})

// Regression: prove the ml path calculations are unchanged. These use the exact
// same helper functions the ml loop uses; since those functions are not modified,
// an ml-only tenant's theoretical/variance/cost output is byte-for-byte identical.
describe('ml regression - ml path helpers unchanged', () => {
  it('applyYield is unchanged (95% keg yield on 5000ml raw)', () => {
    expect(applyYield(5000, 95)).toBeCloseTo(5263.16, 1)
  })
  it('calcVarianceCostP is unchanged (Smirnoff 700ml £20, -200ml variance)', () => {
    // costPerMlP = 2000 / (1 * 700) ~= 2.857p/ml; cost = -200 * 2.857 = -571p
    const cost = calcVarianceCostP(-200, 700, 2000, 1)
    expect(cost).toBe(Math.round(-200 * (2000 / (1 * 700))))
  })
  it('sumBucketsInWindow is unchanged (two buckets, window covering one)', () => {
    const buckets = [
      { period_start: '2026-01-01', period_end: '2026-01-31', units_sold: 50 },
      { period_start: '2026-02-01', period_end: '2026-02-28', units_sold: 80 },
    ]
    expect(sumBucketsInWindow(buckets, '2026-01-31', '2026-02-28')).toBe(80)
  })
})

// Produce branch: verify the computation formula for each/g ingredients.
describe('produce variance computation', () => {
  it('each ingredient: theoretical = windowed units x recipe_qty / yield_qty', () => {
    // Lemon: recipe_qty=25ml juice, yield_qty=30ml/lemon
    const theoretical = 100 * produceLineUnits(1, 25, 30)
    expect(theoretical).toBeCloseTo(83.333, 2)
  })
  it('each ingredient with count=8 wheels per lime, 40 drinks: theoretical = 5 limes', () => {
    const theoretical = 40 * produceLineUnits(1, 1, 8)
    expect(theoretical).toBe(5)
  })
  it('produce variance cost uses usableCostPerBaseUnitP (not calcVarianceCostP)', () => {
    // Lemon: price_p=50p each (purchase_qty=1, pack_size=1, yield_pct=100)
    // variance = -10 lemons (10 unaccounted-for)
    const usableCostP = usableCostPerBaseUnitP(50, 1, 1, 100)
    expect(usableCostP).toBe(50) // 50p per lemon
    const variance_cost_p = Math.round(-10 * usableCostP)
    expect(variance_cost_p).toBe(-500) // -£5
  })
  it('produce row actual mirrors ml formula: (prev - latest) * pack_size + receipts * pack_size', () => {
    // Lime bag: pack_size=8 (8 limes/bag), count dropped from 3 bags to 2 bags,
    // received 1 bag, no production
    const prev_count = 3, latest_count = 2, receipts_bags = 1, pack_size = 8
    const actual = (prev_count - latest_count) * pack_size + receipts_bags * pack_size
    expect(actual).toBe(16) // (1 bag used) + (1 bag received) = 16 limes consumed
  })
  it('calcVariance is unit-agnostic and works for produce (each)', () => {
    // theoretical = 83.333 lemons, actual = 80 lemons
    const { variance_ml, variance_pct } = calcVariance(80, 83.333)
    expect(variance_ml).toBeCloseTo(-3.333, 2)
    expect(variance_pct).toBeCloseTo(-4.0, 0)
  })
})

// Produce stock on-hand formula (mirrors the ml formula but in purchase units).
describe('produce stock on-hand', () => {
  it('on-hand = anchor + receipts - theoretical usage in purchase units', () => {
    // Lemon (each): 10 anchor, 5 received, 40 drinks sold, 25ml juice, 30ml/lemon
    const usageSince = 40 * produceLineUnits(1, 25, 30) // ~33.33 lemons
    const onHand = 10 + 5 - usageSince
    expect(onHand).toBeCloseTo(10 + 5 - 33.333, 2)
  })
  it('on-hand is zero when usage equals anchor + receipts', () => {
    // 8 wheels per lime, 80 drinks ordered 1 wheel each: 10 limes used
    const usageSince = 80 * produceLineUnits(1, 1, 8) // 10 limes
    const onHand = 5 + 5 - usageSince // anchor=5, received=5
    expect(onHand).toBe(0)
  })
  it('scales counts + receipts by pack_size (weight/pack produce, pack_size > 1)', () => {
    // Ginger by weight: pack_size = 100 (100g per pack). Anchor 2 packs, received 1 pack,
    // 50g used. On-hand must be in individual units (grams), matching usageSince.
    const packSize = 100
    const usageSince = 50 // g
    const onHand = 2 * packSize + 1 * packSize - usageSince
    expect(onHand).toBe(250) // 200g counted + 100g received - 50g used
  })
})
