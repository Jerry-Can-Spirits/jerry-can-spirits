import { describe, it, expect } from 'vitest'
import { pairLatestCounts, sumBucketsInWindow, persistentLossFlag, applyYield } from '@/lib/pouriq/variance'

describe('pairLatestCounts', () => {
  it('returns the two most recent counts (latest + previous) by counted_at', () => {
    const events = [
      { counted_at: '2026-01-01T00:00:00Z', count_qty: 5, reason: null },
      { counted_at: '2026-03-01T00:00:00Z', count_qty: 2, reason: 'theft' },
      { counted_at: '2026-02-01T00:00:00Z', count_qty: 4, reason: null },
    ]
    const p = pairLatestCounts(events)
    expect(p).not.toBeNull()
    expect(p!.latest.counted_at).toBe('2026-03-01T00:00:00Z')
    expect(p!.previous.counted_at).toBe('2026-02-01T00:00:00Z')
  })
  it('returns null with fewer than two counts', () => {
    expect(pairLatestCounts([{ counted_at: '2026-01-01T00:00:00Z', count_qty: 5, reason: null }])).toBeNull()
    expect(pairLatestCounts([])).toBeNull()
  })
})

describe('sumBucketsInWindow', () => {
  const buckets = [
    { period_start: '2026-01-01', period_end: '2026-01-31', units_sold: 10 },
    { period_start: '2026-02-01', period_end: '2026-02-28', units_sold: 20 },
    { period_start: '2026-03-01', period_end: '2026-03-31', units_sold: 5 },
  ]
  it('sums buckets whose period falls within (windowStart, windowEnd]', () => {
    expect(sumBucketsInWindow(buckets, '2026-01-31', '2026-02-28')).toBe(20)
  })
  it('includes multiple buckets in a wider window', () => {
    expect(sumBucketsInWindow(buckets, '2025-12-31', '2026-02-28')).toBe(30)
  })
  it('returns 0 when no bucket falls in the window', () => {
    expect(sumBucketsInWindow(buckets, '2026-03-31', '2026-04-30')).toBe(0)
  })
})

describe('persistentLossFlag', () => {
  it('flags when the last 3+ variances are all negative', () => {
    expect(persistentLossFlag([-100, -50, -200])).toBe(true)
    expect(persistentLossFlag([-100, -50, -200, -10])).toBe(true)
  })
  it('does not flag with fewer than 3, or a non-negative in the last 3', () => {
    expect(persistentLossFlag([-100, -50])).toBe(false)
    expect(persistentLossFlag([-100, 20, -200])).toBe(false)
    expect(persistentLossFlag([])).toBe(false)
  })
  it('uses only the most recent 3 (older positives do not save it)', () => {
    expect(persistentLossFlag([50, -100, -50, -200])).toBe(true)
  })
})

describe('applyYield', () => {
  it('is a no-op at 100%', () => {
    expect(applyYield(1000, 100)).toBe(1000)
  })
  it('increases expected usage as yield drops (90% -> ~+11%)', () => {
    expect(applyYield(1000, 90)).toBeCloseTo(1111.11, 1)
  })
  it('treats 0 or negative yield as 100% (defensive)', () => {
    expect(applyYield(1000, 0)).toBe(1000)
    expect(applyYield(1000, -5)).toBe(1000)
  })
})
