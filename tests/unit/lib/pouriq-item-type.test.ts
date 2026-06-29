import { describe, it, expect } from 'vitest'
import { itemTypeFromIngredients } from '@/lib/pouriq/item-type'
import type { IngredientType } from '@/lib/pouriq/types'

describe('itemTypeFromIngredients', () => {
  it('multiple ingredients -> cocktail', () => {
    expect(itemTypeFromIngredients(['spirit', 'juice', 'syrup'] as IngredientType[])).toBe('cocktail')
  })
  it('no ingredients -> cocktail', () => {
    expect(itemTypeFromIngredients([])).toBe('cocktail')
  })
  it.each([
    ['beer', 'beer'], ['cider', 'cider'], ['wine', 'wine'],
    ['spirit', 'spirit'], ['liqueur', 'spirit'],
    ['soft-drink', 'soft-drink'], ['alcohol-free', 'soft-drink'], ['mixer', 'soft-drink'], ['juice', 'soft-drink'],
    ['food', 'food'], ['syrup', 'other'], ['garnish', 'other'],
  ])('single %s ingredient -> %s', (ing, expected) => {
    expect(itemTypeFromIngredients([ing as IngredientType])).toBe(expected)
  })
})
