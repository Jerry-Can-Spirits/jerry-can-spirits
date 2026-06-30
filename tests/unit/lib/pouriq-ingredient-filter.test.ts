import { describe, it, expect } from 'vitest'
import { filterIngredients } from '@/lib/pouriq/ingredient-filter'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

function row(id: string, name: string, type: IngredientLibraryRow['ingredient_type']): IngredientLibraryRow {
  return {
    id, name, ingredient_type: type,
    base_unit: 'ml', pack_size: 700, price_p: 1000, purchase_qty: 1, yield_pct: 100,
    pack_format: null, subcategory: null, barcode: null, notes: null, is_prepared: 0, cost_confidence: 'set',
  } as IngredientLibraryRow
}

const entries = [
  row('1', 'Smirnoff', 'spirit'),
  row('2', 'Cointreau', 'liqueur'),
  row('3', 'Lime juice', 'juice'),
  row('4', 'Sloe Gin', 'liqueur'),
]
const lowStock = new Set(['1', '3'])

describe('filterIngredients', () => {
  it("returns everything for 'all' with no search", () => {
    expect(filterIngredients(entries, { search: '', category: 'all' }, lowStock)).toHaveLength(4)
  })
  it('searches by name, case-insensitive', () => {
    expect(filterIngredients(entries, { search: 'gin', category: 'all' }, lowStock).map((e) => e.id)).toEqual(['4'])
  })
  it('filters by ingredient type', () => {
    expect(filterIngredients(entries, { search: '', category: 'liqueur' }, lowStock).map((e) => e.id)).toEqual(['2', '4'])
  })
  it('filters to low stock', () => {
    expect(filterIngredients(entries, { search: '', category: 'low-stock' }, lowStock).map((e) => e.id)).toEqual(['1', '3'])
  })
  it('combines search and category', () => {
    expect(filterIngredients(entries, { search: 'cointreau', category: 'liqueur' }, lowStock).map((e) => e.id)).toEqual(['2'])
  })
})
