import { describe, it, expect } from 'vitest'
import { servePresetsFor, defaultServeName } from '@/lib/pouriq/serve-presets'

describe('servePresetsFor', () => {
  it('spirit -> single + double', () => {
    expect(servePresetsFor('spirit').map((p) => [p.name, p.ml])).toEqual([['Single', 25], ['Double', 50]])
  })
  it('wine -> glass sizes + bottle', () => {
    expect(servePresetsFor('wine').map((p) => p.ml)).toEqual([125, 175, 250, 750])
  })
  it('soft-drink -> splash + half + pint', () => {
    expect(servePresetsFor('soft-drink').map((p) => p.name)).toEqual(['Splash', 'Small (half)', 'Pint'])
  })
  it('unknown type -> no presets', () => {
    expect(servePresetsFor('food')).toEqual([])
  })
})
describe('defaultServeName', () => {
  it('combines ingredient + preset', () => {
    expect(defaultServeName("Gordon's", 'Double')).toBe("Gordon's Double")
  })
})
