import { applyYield } from './variance'

// Bottles received from one invoice line. extracted_quantity is the number of
// PURCHASE units on the line; one purchase unit holds purchase_qty bottles.
export function receiptBottlesFromInvoiceLine(extractedQuantity: number | null, purchaseQty: number): number | null {
  if (extractedQuantity === null) return null
  return extractedQuantity * (purchaseQty > 0 ? purchaseQty : 1)
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
