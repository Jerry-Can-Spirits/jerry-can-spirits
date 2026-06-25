import { describe, it, expect } from 'vitest'
import { reorderQty } from '@/lib/pouriq/stock'

describe('reorderQty', () => {
  it('rounds up the shortfall to whole bottles', () => {
    expect(reorderQty(2.3, 6)).toBe(4)
  })
  it('is 0 at or above par', () => {
    expect(reorderQty(6, 6)).toBe(0)
    expect(reorderQty(7, 6)).toBe(0)
  })
  it('is 0 when on-hand is unknown or no par is set', () => {
    expect(reorderQty(null, 6)).toBe(0)
    expect(reorderQty(2, null)).toBe(0)
  })
  it('orders more when on-hand is negative', () => {
    expect(reorderQty(-1, 6)).toBe(7)
  })
})
