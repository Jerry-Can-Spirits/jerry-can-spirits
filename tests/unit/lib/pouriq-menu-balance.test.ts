import { describe, it, expect } from 'vitest'
import { classifyMenuBalance } from '@/lib/pouriq/menu-balance'

const drinks = [
  { id: 'a', name: 'A', gp_pct: 80, units: 100 }, // high margin, popular -> strong
  { id: 'b', name: 'B', gp_pct: 50, units: 100 }, // low margin, popular -> popular-low-margin
  { id: 'c', name: 'C', gp_pct: 80, units: 1 },   // high margin, not popular -> high-margin-low-sales
  { id: 'd', name: 'D', gp_pct: 50, units: 1 },   // low, low -> underperformers
]

describe('classifyMenuBalance', () => {
  it('places drinks in the four quadrants using target GP and 70% fair-share', () => {
    const r = classifyMenuBalance(drinks, { targetGpPct: 70, avgGpPct: 65 })
    // totalUnits 202, fairShare 50.5, popularityThreshold 35.35
    expect(r.marginThreshold).toBe(70)
    expect(r.popularityThreshold).toBeCloseTo(35.35, 2)
    expect(r.groups.strong.map((d) => d.id)).toEqual(['a'])
    expect(r.groups['popular-low-margin'].map((d) => d.id)).toEqual(['b'])
    expect(r.groups['high-margin-low-sales'].map((d) => d.id)).toEqual(['c'])
    expect(r.groups.underperformers.map((d) => d.id)).toEqual(['d'])
    expect(r.totalUnits).toBe(202)
    expect(r.includedCount).toBe(4)
  })

  it('falls back to average GP when target is null or zero', () => {
    expect(classifyMenuBalance(drinks, { targetGpPct: null, avgGpPct: 65 }).marginThreshold).toBe(65)
    expect(classifyMenuBalance(drinks, { targetGpPct: 0, avgGpPct: 65 }).marginThreshold).toBe(65)
  })

  it('treats a drink at exactly the thresholds as high margin and popular', () => {
    const one = [{ id: 'x', name: 'X', gp_pct: 70, units: 70 }]
    const r = classifyMenuBalance(one, { targetGpPct: 70, avgGpPct: 0 })
    // single drink: fairShare = 70, popularityThreshold = 49; units 70 >= 49 popular; gp 70 >= 70 high
    expect(r.groups.strong.map((d) => d.id)).toEqual(['x'])
  })

  it('returns empty groups and zero totals for no drinks', () => {
    const r = classifyMenuBalance([], { targetGpPct: 70, avgGpPct: 0 })
    expect(r.totalUnits).toBe(0)
    expect(r.includedCount).toBe(0)
    expect(r.popularityThreshold).toBe(0)
    expect(r.groups.strong).toEqual([])
    expect(r.groups.underperformers).toEqual([])
  })
})
