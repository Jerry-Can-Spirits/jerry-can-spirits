import { describe, it, expect } from 'vitest'
import { produceLineUnits } from '@/lib/pouriq/variance'

describe('produceLineUnits', () => {
  it('converts sales to purchase units via the use yield', () => {
    expect(produceLineUnits(100, 25, 30)).toBeCloseTo(83.333, 2) // 100 drinks x 25ml juice / 30ml-per-lemon
    expect(produceLineUnits(100, 1, 8)).toBe(12.5)               // 100 wheels / 8-per-lemon
  })
  it('guards a zero/negative yield', () => {
    expect(produceLineUnits(100, 25, 0)).toBe(0)
  })
})
