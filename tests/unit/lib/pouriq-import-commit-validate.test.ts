import { describe, expect, it } from 'vitest'
import { validateBody } from '@/lib/pouriq/import-commit-validate'

const base = {
  menuId: 'm1',
  drinks: [{
    name: 'Guinness Pint',
    sale_price_p: 620,
    ingredients: [{
      existing_library_id: 'lib-guinness',
      pour_ml: 568,
      unit_count: null,
      recipe_unit: 'pint',
      recipe_qty: 1,
    }],
  }],
}

describe('validateBody with serve fields', () => {
  it('accepts a line carrying recipe_unit + recipe_qty', () => {
    expect(validateBody(structuredClone(base) as never)).toBeNull()
  })
  it('accepts a line with no serve fields (backwards compatible)', () => {
    const b = structuredClone(base) as never as { drinks: { ingredients: Record<string, unknown>[] }[] }
    delete b.drinks[0].ingredients[0].recipe_unit
    delete b.drinks[0].ingredients[0].recipe_qty
    expect(validateBody(b as never)).toBeNull()
  })
  it('rejects a recipe_qty that is not positive when recipe_unit is set', () => {
    const b = structuredClone(base) as never as { drinks: { ingredients: Record<string, unknown>[] }[] }
    b.drinks[0].ingredients[0].recipe_qty = 0
    expect(validateBody(b as never)).toMatch(/recipe_qty/)
  })
})
