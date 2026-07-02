import { describe, it, expect } from 'vitest'
import { PRODUCE_LIBRARY } from '@/lib/pouriq/produce-library'

const VALID_UNITS = ['ml', 'count', 'g'] as const

describe('PRODUCE_LIBRARY shape', () => {
  it('has exactly 10 entries', () => {
    expect(PRODUCE_LIBRARY).toHaveLength(10)
  })

  it('every template has at least one use', () => {
    for (const t of PRODUCE_LIBRARY) {
      expect(t.uses.length, `${t.name} must have >= 1 use`).toBeGreaterThanOrEqual(1)
    }
  })

  it('every use has yield_qty > 0', () => {
    for (const t of PRODUCE_LIBRARY) {
      for (const u of t.uses) {
        expect(u.yield_qty, `${t.name}/${u.name} yield_qty must be > 0`).toBeGreaterThan(0)
      }
    }
  })

  it('every use has a valid recipe_unit', () => {
    for (const t of PRODUCE_LIBRARY) {
      for (const u of t.uses) {
        expect(VALID_UNITS as readonly string[], `${t.name}/${u.name} recipe_unit invalid`).toContain(u.recipe_unit)
      }
    }
  })

  it('template names are unique', () => {
    const names = PRODUCE_LIBRARY.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
