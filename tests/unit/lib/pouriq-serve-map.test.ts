import { describe, expect, it } from 'vitest'
import { SERVE_TOKEN_ML, serveToRecipeUnit, packDefaultForServe, isKnownServeToken, SERVE_TOKEN_TO_UNIT_NAME } from '@/lib/pouriq/serve-map'

describe('SERVE_TOKEN_ML', () => {
  it('maps tokens to ml', () => {
    expect(SERVE_TOKEN_ML.pint).toBe(568)
    expect(SERVE_TOKEN_ML.half_pint).toBe(284)
    expect(SERVE_TOKEN_ML['175ml']).toBe(175)
    expect(SERVE_TOKEN_ML['50ml']).toBe(50)
  })
})

describe('serveToRecipeUnit', () => {
  it('maps draught to the standard pint/half units', () => {
    expect(serveToRecipeUnit('pint')).toEqual({ recipe_unit: 'pint', recipe_qty: 1, pour_ml: 568 })
    expect(serveToRecipeUnit('half_pint')).toEqual({ recipe_unit: 'half pint', recipe_qty: 1, pour_ml: 284 })
  })
  it('maps wine to glass units', () => {
    expect(serveToRecipeUnit('175ml')).toEqual({ recipe_unit: 'medium glass', recipe_qty: 1, pour_ml: 175 })
    expect(serveToRecipeUnit('250ml')).toEqual({ recipe_unit: 'large glass', recipe_qty: 1, pour_ml: 250 })
  })
  it('maps spirit measures to a raw ml pour', () => {
    expect(serveToRecipeUnit('25ml')).toEqual({ recipe_unit: 'ml', recipe_qty: 25, pour_ml: 25 })
    expect(serveToRecipeUnit('50ml')).toEqual({ recipe_unit: 'ml', recipe_qty: 50, pour_ml: 50 })
  })
})

describe('packDefaultForServe', () => {
  it('gives draught a 50L keg', () => {
    expect(packDefaultForServe('pint')).toEqual({ pack_format: 'keg', pack_size: 50000 })
    expect(packDefaultForServe('half_pint')).toEqual({ pack_format: 'keg', pack_size: 50000 })
  })
  it('gives wine a 750ml bottle', () => {
    expect(packDefaultForServe('125ml')).toEqual({ pack_format: 'bottle', pack_size: 750 })
    expect(packDefaultForServe('175ml')).toEqual({ pack_format: 'bottle', pack_size: 750 })
    expect(packDefaultForServe('250ml')).toEqual({ pack_format: 'bottle', pack_size: 750 })
  })
  it('gives spirit measures a 700ml bottle', () => {
    expect(packDefaultForServe('50ml')).toEqual({ pack_format: 'bottle', pack_size: 700 })
  })
  it('returns null for glass (no override)', () => {
    expect(packDefaultForServe('glass')).toBeNull()
  })
})

describe('isKnownServeToken', () => {
  it('recognises valid tokens and rejects others', () => {
    expect(isKnownServeToken('pint')).toBe(true)
    expect(isKnownServeToken('nonsense')).toBe(false)
  })
})

describe('SERVE_TOKEN_TO_UNIT_NAME', () => {
  it('maps tokens to standard unit names', () => {
    expect(SERVE_TOKEN_TO_UNIT_NAME.pint).toBe('pint')
    expect(SERVE_TOKEN_TO_UNIT_NAME.half_pint).toBe('half pint')
    expect(SERVE_TOKEN_TO_UNIT_NAME['250ml']).toBe('large glass')
    expect(SERVE_TOKEN_TO_UNIT_NAME['50ml']).toBe('ml')
  })
})
