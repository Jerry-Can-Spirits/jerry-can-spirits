import { it, expect } from 'vitest'
import { pctChange } from '@/lib/pouriq/cost-changes'
it('computes percentage', () => {
  expect(pctChange(100, 150)).toBe(50)
  expect(pctChange(200, 100)).toBe(-50)
})
it('null when old missing or zero', () => {
  expect(pctChange(null, 100)).toBeNull()
  expect(pctChange(0, 100)).toBeNull()
})
