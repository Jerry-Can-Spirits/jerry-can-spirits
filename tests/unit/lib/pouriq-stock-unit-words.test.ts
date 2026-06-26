import { describe, it, expect } from 'vitest'
import { stockUnitWords } from '@/lib/pouriq/stock'

describe('stockUnitWords', () => {
  it('defaults to bottle/bottles when no pack format is set', () => {
    expect(stockUnitWords(null)).toEqual({ one: 'bottle', many: 'bottles' })
    expect(stockUnitWords('   ')).toEqual({ one: 'bottle', many: 'bottles' })
  })

  it('uses correct plurals for known formats, case-insensitively', () => {
    expect(stockUnitWords('keg')).toEqual({ one: 'keg', many: 'kegs' })
    expect(stockUnitWords('Box')).toEqual({ one: 'box', many: 'boxes' })
    expect(stockUnitWords('bag-in-box')).toEqual({ one: 'bag-in-box', many: 'bags-in-box' })
  })

  it('shows unknown free-text formats verbatim with a naive plural', () => {
    expect(stockUnitWords('polypin')).toEqual({ one: 'polypin', many: 'polypins' })
    expect(stockUnitWords('10L pouch')).toEqual({ one: '10L pouch', many: '10L pouches' })
  })
})
