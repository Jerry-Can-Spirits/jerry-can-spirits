import { batchCountLine } from '@/lib/batch-stock'

// One line near the price: how many bottles of the batch are left, exactly as
// Shopify counts them. Renders nothing unless the count is a positive number,
// so an unknown figure never reads as zero and zero never reads as a claim.
export default function BatchCount({ count }: { count?: number }) {
  if (count === undefined || !(count > 0)) return null
  return <p className="text-sm text-parchment-300 mt-2">{batchCountLine(count)}</p>
}
