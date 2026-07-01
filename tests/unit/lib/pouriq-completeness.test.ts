import { it, expect } from 'vitest'
import { ingredientCompleteness } from '@/lib/pouriq/cost-confidence'
const base = { price_p: 500, pack_size: 700, purchase_qty: 1, is_prepared: 0 } as Parameters<typeof ingredientCompleteness>[0]
it('complete when price, pack, qty present', () => {
  expect(ingredientCompleteness(base)).toEqual({ complete: true, missing: [] })
})
it('lists each missing field', () => {
  expect(ingredientCompleteness({ ...base, price_p: 0 }).missing).toContain('price')
  expect(ingredientCompleteness({ ...base, pack_size: 0 }).missing).toContain('pack size')
  expect(ingredientCompleteness({ ...base, purchase_qty: 0 }).missing).toContain('purchase quantity')
})
it('prepared ingredient needs only a price', () => {
  expect(ingredientCompleteness({ price_p: 300, pack_size: 0, purchase_qty: 0, is_prepared: 1 } as Parameters<typeof ingredientCompleteness>[0])).toEqual({ complete: true, missing: [] })
})
