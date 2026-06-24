import { describe, it, expect } from 'vitest'
import { planBulkFill, type BulkFillRow } from '@/lib/pouriq/import-bulk-fill'

const priced = { name: 'Sugar Syrup', ingredient_type: 'syrup' as const, base_unit: 'ml' as const, pack_size: 1000, price_p: 500, purchase_qty: 1 }
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
