import { describe, it, expect } from 'vitest'
import { insertAt } from '@/lib/pouriq/reorder'

describe('insertAt', () => {
  it('inserts moved id at the index', () => {
    expect(insertAt(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b'])
    expect(insertAt(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
  })

  it('no-op when index unchanged', () => {
    expect(insertAt(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'b', 'c'])
  })
})
