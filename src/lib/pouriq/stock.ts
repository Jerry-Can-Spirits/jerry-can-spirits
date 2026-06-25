import { applyYield } from './variance'

// Bottles received from one invoice line. extracted_quantity is the number of
// PURCHASE units on the line; one purchase unit holds purchase_qty bottles.
export function receiptBottlesFromInvoiceLine(extractedQuantity: number | null, purchaseQty: number): number | null {
  if (extractedQuantity === null) return null
  return extractedQuantity * (purchaseQty > 0 ? purchaseQty : 1)
}

// Whole bottles to order to reach par. 0 when at/above par, on-hand unknown,
// or no par set. Uses raw on-hand (a negative on-hand orders more).
export function reorderQty(onHandBottles: number | null, parBottles: number | null): number {
  if (onHandBottles === null || parBottles === null) return 0
  return Math.max(0, Math.ceil(parBottles - onHandBottles))
}

// Anchored perpetual on-hand, in bottles/containers.
export function computeOnHandBottles(input: {
  anchorCountQty: number
  receiptsSinceBottles: number
  usageSinceMl: number
  bottleSizeMl: number
  yieldPct: number
}): number {
  const expectedUsageBottles = applyYield(input.usageSinceMl, input.yieldPct) / input.bottleSizeMl
  return input.anchorCountQty + input.receiptsSinceBottles - expectedUsageBottles
}
