import { it, expect } from 'vitest'
import { useLineCostP } from '@/lib/pouriq/calculations'
it('costs a use from its yield', () => {
  expect(useLineCostP(30, 30, 25)).toBe(25)   // 30p/lemon, 30ml/lemon, 25ml -> 25p
  expect(useLineCostP(30, 8, 1)).toBe(4)       // 30p/lemon, 8 wheels, 1 wheel -> 3.75 -> 4p
})
it('guards a zero/negative yield', () => {
  expect(useLineCostP(30, 0, 25)).toBe(0)
})
