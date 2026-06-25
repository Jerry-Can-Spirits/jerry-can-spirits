import { usableCostPerBaseUnitP } from './calculations'

export interface PreparedComponentCost {
  price_p: number
  purchase_qty: number
  pack_size: number
  yield_pct: number
  amount_base: number
}

// Total cost (pence) of one batch: sum each component's usable cost-per-base x amount.
export function batchCostP(components: PreparedComponentCost[]): number {
  return components.reduce(
    (sum, c) => sum + Math.round(usableCostPerBaseUnitP(c.price_p, c.purchase_qty, c.pack_size, c.yield_pct) * c.amount_base),
    0,
  )
}
