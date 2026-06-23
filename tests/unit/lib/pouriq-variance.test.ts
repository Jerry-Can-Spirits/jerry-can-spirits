import { describe, it, expect } from 'vitest'
import { classifyVariance } from '@/lib/pouriq/variance'

const BOTTLE = 700 // tolerance floor = 0.2 * 700 = 140 ml

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
