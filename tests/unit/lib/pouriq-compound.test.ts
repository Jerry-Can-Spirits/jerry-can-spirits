import { describe, it, expect } from 'vitest'
import { splitCompoundIngredients, halfMeasure } from '@/lib/pouriq/compound'

describe('halfMeasure', () => {
  it('halves a plain volume, preserving the unit', () => {
    expect(halfMeasure('50ml')).toBe('25ml')
    expect(halfMeasure('1oz')).toBe('0.5oz')
  })
  it('returns null for non-volume measurements', () => {
    expect(halfMeasure('2 dashes')).toBeNull()
    expect(halfMeasure('wedge')).toBeNull()
    expect(halfMeasure('1 lime')).toBeNull()
  })
})

describe('splitCompoundIngredients', () => {
  it('splits a two-part compound with an even measurement', () => {
    const out = splitCompoundIngredients([{ name: 'Lime & Apple juice', raw_measurement: '50ml' }])
    expect(out).toEqual([
      { name: 'Lime juice', raw_measurement: '25ml' },
      { name: 'Apple juice', raw_measurement: '25ml' },
    ])
  })
  it('handles "and" and an uppercase noun', () => {
    const out = splitCompoundIngredients([{ name: 'Orange & Cranberry Juice', raw_measurement: '25ml' }])
    expect(out.map((i) => i.name)).toEqual(['Orange Juice', 'Cranberry Juice'])
  })
  it('keeps the original measurement on both when not a plain volume', () => {
    const out = splitCompoundIngredients([{ name: 'Lemon and Lime cordial', raw_measurement: 'dash' }])
    expect(out).toEqual([
      { name: 'Lemon cordial', raw_measurement: 'dash' },
      { name: 'Lime cordial', raw_measurement: 'dash' },
    ])
  })
  it('does not split a non-compound or a missing noun', () => {
    expect(splitCompoundIngredients([{ name: 'salt & pepper', raw_measurement: 'pinch' }])).toEqual([{ name: 'salt & pepper', raw_measurement: 'pinch' }])
    expect(splitCompoundIngredients([{ name: 'gin and tonic', raw_measurement: '50ml' }])).toEqual([{ name: 'gin and tonic', raw_measurement: '50ml' }])
    expect(splitCompoundIngredients([{ name: 'passion fruit juice', raw_measurement: '25ml' }])).toEqual([{ name: 'passion fruit juice', raw_measurement: '25ml' }])
  })
  it('leaves a 3-way list intact', () => {
    const out = splitCompoundIngredients([{ name: 'lime, lemon & orange juice', raw_measurement: '30ml' }])
    expect(out).toHaveLength(1)
  })
  it('preserves extra fields on the split atoms', () => {
    const out = splitCompoundIngredients([{ name: 'Lime & Apple juice', raw_measurement: '50ml', inferred_type: 'juice' }])
    expect(out.every((i) => i.inferred_type === 'juice')).toBe(true)
  })
  it('clears base_product and serve on split parts but not on passthrough', () => {
    const compound = splitCompoundIngredients([
      { name: 'Lime & Apple juice', raw_measurement: '50ml', base_product: 'Lime & Apple juice', serve: 'glass' },
    ])
    expect(compound).toHaveLength(2)
    expect(compound[0].base_product).toBeNull()
    expect(compound[0].serve).toBeNull()
    expect(compound[1].base_product).toBeNull()
    expect(compound[1].serve).toBeNull()
    // Non-split passthrough must keep its values.
    const passthrough = splitCompoundIngredients([
      { name: 'Guinness', raw_measurement: 'pint', base_product: 'Guinness', serve: 'pint' },
    ])
    expect(passthrough).toHaveLength(1)
    expect(passthrough[0].base_product).toBe('Guinness')
    expect(passthrough[0].serve).toBe('pint')
  })
})
