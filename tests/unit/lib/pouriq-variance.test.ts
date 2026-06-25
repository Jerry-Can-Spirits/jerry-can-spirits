import { describe, it, expect } from 'vitest'
import { classifyVariance, calcVarianceCostP, sumAmountsInWindow, countInWindow, canonTs } from '@/lib/pouriq/variance'

const BOTTLE = 700 // tolerance floor = 0.2 * 700 = 140 ml

describe('calcVarianceCostP with purchase_qty', () => {
  it('divides the bottle price by purchase_qty (case of 24)', () => {
    // 200ml short of a £14.40/24×200ml case: per-ml 0.3p * 200 = 60p
    expect(calcVarianceCostP(200, 200, 1440, 24)).toBe(60)
  })
  it('qty 1 matches the old behaviour', () => {
    // 100ml of a £20/700ml bottle: (2000/700)*100 = 285.7 -> 286
    expect(calcVarianceCostP(100, 700, 2000, 1)).toBe(286)
  })
  it('returns null when variance is null', () => {
    expect(calcVarianceCostP(null, 700, 2000, 1)).toBeNull()
  })
})

describe('classifyVariance', () => {
  it('returns "none" when there is no actual count', () => {
    expect(classifyVariance(null, null, BOTTLE)).toBe('none')
  })

  it('treats a small absolute variance as within tolerance even at a high %', () => {
    // 100 ml is under the 140 ml floor, so the big % is just noise on a small base.
    expect(classifyVariance(100, 80, BOTTLE)).toBe('within-tolerance')
  })

  it('treats a small percentage as within tolerance even above the ml floor', () => {
    // 200 ml is over the floor, but 5% on high throughput is noise.
    expect(classifyVariance(200, 5, BOTTLE)).toBe('within-tolerance')
  })

  it('flags amber between 10% and 20% (and above the ml floor)', () => {
    expect(classifyVariance(200, 15, BOTTLE)).toBe('amber')
  })

  it('flags red above 20%', () => {
    expect(classifyVariance(300, 30, BOTTLE)).toBe('red')
  })

  it('flags amber when over the ml floor but % is undefined (no sales base)', () => {
    expect(classifyVariance(300, null, BOTTLE)).toBe('amber')
  })

  it('is symmetric for under- and over-variance', () => {
    expect(classifyVariance(-300, -30, BOTTLE)).toBe('red')
    expect(classifyVariance(-50, -40, BOTTLE)).toBe('within-tolerance')
  })
})

describe('sumAmountsInWindow', () => {
  const rows = [
    { amount: 1, at: '2026-06-01 09:00:00' },       // = ws, excluded
    { amount: 2, at: '2026-06-02 09:00:00' },       // space-form, in window
    { amount: 16, at: '2026-06-02T12:00:00.000Z' }, // ISO, in window
    { amount: 32, at: '2026-06-03' },               // date-only, in window
    { amount: 4, at: '2026-06-03 09:00:00' },       // = we, included
    { amount: 8, at: '2026-06-04 09:00:00' },       // > we, excluded
  ]
  it('sums amounts in (ws, we] across timestamp formats', () => {
    expect(sumAmountsInWindow(rows, '2026-06-01 09:00:00', '2026-06-03 09:00:00')).toBe(54)
  })
  it('includes a same-day ISO delivery that precedes the closing count', () => {
    // The ISO "T" must not sort after the space-form count bound.
    const r = [{ amount: 5, at: '2026-06-03T08:00:00.000Z' }]
    expect(sumAmountsInWindow(r, '2026-06-01 09:00:00', '2026-06-03 09:00:00')).toBe(5)
  })
  it('returns 0 for no rows', () => {
    expect(sumAmountsInWindow([], 'a', 'b')).toBe(0)
  })
})

describe('countInWindow', () => {
  it('counts rows in (ws, we] with the same boundary as the sum', () => {
    const rows = [
      { at: '2026-06-01 09:00:00' }, { at: '2026-06-02 09:00:00' },
      { at: '2026-06-03 09:00:00' }, { at: '2026-06-04 09:00:00' },
    ]
    expect(countInWindow(rows, '2026-06-01 09:00:00', '2026-06-03 09:00:00')).toBe(2)
  })
})

describe('canonTs', () => {
  it('normalises ISO and date-only to space-form seconds', () => {
    expect(canonTs('2026-06-02T12:00:00.000Z')).toBe('2026-06-02 12:00:00')
    expect(canonTs('2026-06-02 12:00:00')).toBe('2026-06-02 12:00:00')
    expect(canonTs('2026-06-02')).toBe('2026-06-02')
  })
})
