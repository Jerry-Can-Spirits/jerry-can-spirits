import { describe, it, expect } from 'vitest'
import { parseMeasurement } from '@/lib/pouriq/measurement-parse'

describe('parseMeasurement — existing cases', () => {
  it('parses explicit ml', () => {
    expect(parseMeasurement('50ml')).toEqual({ pour_ml: 50 })
    expect(parseMeasurement('25ml')).toEqual({ pour_ml: 25 })
  })

  it('parses oz → ml rounded to nearest integer', () => {
    const result = parseMeasurement('1.5oz')
    expect('pour_ml' in result).toBe(true)
  })

  it('parses grams and kilograms', () => {
    expect(parseMeasurement('5g')).toEqual({ weight_g: 5 })
    expect(parseMeasurement('2kg')).toEqual({ weight_g: 2000 })
  })

  it('parses top/splash as 50ml without serve_unit', () => {
    expect(parseMeasurement('top')).toEqual({ pour_ml: 50 })
    expect(parseMeasurement('splash')).toEqual({ pour_ml: 50 })
  })

  it('parses fractions as unit_count', () => {
    expect(parseMeasurement('1/2 lime')).toEqual({ unit_count: 0.5 })
    expect(parseMeasurement('wedge')).toEqual({ unit_count: 0.125 })
  })

  it('returns raw for unrecognised input', () => {
    expect(parseMeasurement('a handful')).toEqual({ raw: 'a handful' })
  })
})

describe('parseMeasurement — serve unit recognition', () => {
  it('returns serve_unit=barspoon and serve_qty=1 for a bare barspoon', () => {
    expect(parseMeasurement('barspoon')).toEqual({ pour_ml: 5, serve_unit: 'barspoon', serve_qty: 1 })
  })

  it('returns serve_unit=barspoon and serve_qty from count', () => {
    expect(parseMeasurement('2 barspoons')).toEqual({ pour_ml: 10, serve_unit: 'barspoon', serve_qty: 2 })
  })

  it('handles "bar spoon" spelling variant', () => {
    const r = parseMeasurement('bar spoon')
    expect(r).toEqual({ pour_ml: 5, serve_unit: 'barspoon', serve_qty: 1 })
  })

  it('returns serve_unit=dash and serve_qty=1 for a single dash', () => {
    expect(parseMeasurement('dash')).toEqual({ pour_ml: 1, serve_unit: 'dash', serve_qty: 1 })
  })

  it('returns serve_unit=dash and serve_qty from count for multiple dashes', () => {
    // 2 dashes × 0.6ml → Math.round(1.2) = 1
    expect(parseMeasurement('2 dashes')).toEqual({ pour_ml: 1, serve_unit: 'dash', serve_qty: 2 })
    // 3 dashes × 0.6ml → Math.round(1.8) = 2
    expect(parseMeasurement('3 dashes')).toEqual({ pour_ml: 2, serve_unit: 'dash', serve_qty: 3 })
  })

  it('handles "dashes" and "dash" spellings', () => {
    expect(parseMeasurement('dashes')).toMatchObject({ serve_unit: 'dash', serve_qty: 1 })
    expect(parseMeasurement('1 dash')).toMatchObject({ serve_unit: 'dash', serve_qty: 1 })
  })

  it('returns serve_unit=tsp and serve_qty=1 for a bare tsp', () => {
    expect(parseMeasurement('tsp')).toEqual({ pour_ml: 5, serve_unit: 'tsp', serve_qty: 1 })
  })

  it('returns serve_unit=tsp for teaspoon spelling', () => {
    expect(parseMeasurement('teaspoon')).toEqual({ pour_ml: 5, serve_unit: 'tsp', serve_qty: 1 })
    expect(parseMeasurement('teaspoons')).toEqual({ pour_ml: 5, serve_unit: 'tsp', serve_qty: 1 })
  })

  it('returns serve_unit=tsp with count for "2 tsp"', () => {
    expect(parseMeasurement('2 tsp')).toEqual({ pour_ml: 10, serve_unit: 'tsp', serve_qty: 2 })
  })

  it('does not attach serve_unit to plain ml measurements', () => {
    const r = parseMeasurement('50ml')
    expect('serve_unit' in r).toBe(false)
  })
})
