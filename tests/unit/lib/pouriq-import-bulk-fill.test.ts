import { describe, it, expect, test } from 'vitest'
import { planBulkFill, groupKeyFor, type BulkFillRow } from '@/lib/pouriq/import-bulk-fill'

const priced = { name: 'Sugar Syrup', ingredient_type: 'syrup' as const, base_unit: 'ml' as const, pack_size: 1000, price_p: 500, purchase_qty: 1, price_includes_vat: false }
const row = (groupKey: string | null, resolved: boolean, state: Partial<BulkFillRow['state']> = {}): BulkFillRow => ({
  groupKey,
  resolved,
  state: { pour_ml: 25, unit_count: null, recipe_unit: null, recipe_qty: null, ...state },
})

describe('planBulkFill', () => {
  it('fills other unresolved rows in the same group, copying the ingredient', () => {
    const rows = [
      row('cat:syr', true, { new_library: { ...priced } }),
      row('cat:syr', false),
      row('cat:syr', false),
    ]
    const plan = planBulkFill(rows, 0)
    expect(plan?.targets).toEqual([1, 2])
    expect(plan?.apply.new_library?.name).toBe('Sugar Syrup')
    // apply carries ingredient identity only, not the per-drink pour/unit
    expect('pour_ml' in (plan?.apply ?? {})).toBe(false)
  })

  it('skips rows already resolved by hand', () => {
    const rows = [
      row('cat:syr', true, { new_library: { ...priced } }),
      row('cat:syr', true, { existing_library_id: 'x' }),
      row('cat:syr', false),
    ]
    expect(planBulkFill(rows, 0)?.targets).toEqual([2])
  })

  it('leaves other groups untouched (no same-group targets -> null)', () => {
    const rows = [
      row('cat:syr', true, { new_library: { ...priced } }),
      row('name:gin', false),
    ]
    expect(planBulkFill(rows, 0)).toBeNull()
  })

  it('returns null when the source is unresolved or ungrouped', () => {
    expect(planBulkFill([row('cat:syr', false), row('cat:syr', false)], 0)).toBeNull()
    expect(planBulkFill([row(null, true, { existing_library_id: 'x' }), row('cat:syr', false)], 0)).toBeNull()
  })

  it('copies an existing-library resolution too', () => {
    const rows = [
      row('name:gin', true, { existing_library_id: 'lib-1' }),
      row('name:gin', false),
    ]
    const plan = planBulkFill(rows, 0)
    expect(plan?.targets).toEqual([1])
    expect(plan?.apply.existing_library_id).toBe('lib-1')
  })
})

test('spirit lines do not group (picked per cocktail)', () => {
  expect(groupKeyFor({ extracted_name: 'Gin', inferred_type: 'spirit', match: { kind: 'no-match' } } as Parameters<typeof groupKeyFor>[0])).toBeNull()
})
test('non-spirit identical names group', () => {
  expect(groupKeyFor({ extracted_name: 'Lemon Juice', inferred_type: 'juice', match: { kind: 'no-match' } } as Parameters<typeof groupKeyFor>[0]))
    .toBe('name:lemon juice')
})
test('catalogue matches group by name, not catalogue id (variants sharing one entry stay distinct)', () => {
  const peroni = groupKeyFor({ extracted_name: 'Peroni', inferred_type: 'beer', match: { kind: 'catalogue', catalogue_id: 'cat-peroni' } } as Parameters<typeof groupKeyFor>[0])
  const peroniGf = groupKeyFor({ extracted_name: 'Peroni Gluten Free', inferred_type: 'beer', match: { kind: 'catalogue', catalogue_id: 'cat-peroni' } } as Parameters<typeof groupKeyFor>[0])
  expect(peroni).toBe('name:peroni')
  expect(peroniGf).toBe('name:peroni gluten free')
  expect(peroni).not.toBe(peroniGf)
})
test('catalogue matches with the identical name still group (price once)', () => {
  const a = groupKeyFor({ extracted_name: 'Peroni', inferred_type: 'beer', match: { kind: 'catalogue', catalogue_id: 'cat-peroni' } } as Parameters<typeof groupKeyFor>[0])
  const b = groupKeyFor({ extracted_name: 'peroni', inferred_type: 'beer', match: { kind: 'catalogue', catalogue_id: 'cat-peroni' } } as Parameters<typeof groupKeyFor>[0])
  expect(a).toBe(b)
})

describe('groupKeyFor with base_product', () => {
  const cat = { kind: 'catalogue', catalogue_id: 'c-stout' }
  it('groups two serves of the same product by base_product', () => {
    const a = groupKeyFor({ extracted_name: 'Guinness Half', base_product: 'Guinness', inferred_type: 'beer', match: cat })
    const b = groupKeyFor({ extracted_name: 'Guinness Pint', base_product: 'Guinness', inferred_type: 'beer', match: cat })
    expect(a).not.toBeNull()
    expect(a).toBe(b)
  })
  it('keeps different products in different groups', () => {
    const a = groupKeyFor({ extracted_name: 'Guinness Pint', base_product: 'Guinness', inferred_type: 'beer', match: cat })
    const b = groupKeyFor({ extracted_name: 'Peroni Pint', base_product: 'Peroni', inferred_type: 'beer', match: cat })
    expect(a).not.toBe(b)
  })
  it('falls back to extracted_name when no base_product (unchanged behaviour)', () => {
    const a = groupKeyFor({ extracted_name: 'Triple Sec', inferred_type: 'liqueur', match: { kind: 'no-match' } })
    expect(a).toBe('name:triple sec')
  })
  it('allows grouping a spirit when base_product is present', () => {
    const a = groupKeyFor({ extracted_name: 'House Gin single', base_product: 'House Gin', inferred_type: 'spirit', match: cat })
    expect(a).toBe('name:house gin')
  })
  it('still excludes a measure-less spirit line (no base_product)', () => {
    const a = groupKeyFor({ extracted_name: 'House Gin', inferred_type: 'spirit', match: cat })
    expect(a).toBeNull()
  })
})
