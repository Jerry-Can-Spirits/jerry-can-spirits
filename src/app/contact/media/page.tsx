import { getProduct } from '@/lib/shopify'
import MediaCentreClient from './MediaCentreClient'

export const revalidate = 3600

// The media centre itself is a client component (interactive form, galleries).
// This server shell exists to read the live RRP from Shopify so the fact
// sheet never carries a hardcoded price (Audit 8 PR B).
export default async function MediaPage() {
  let rrp: string | null = null
  try {
    const product = await getProduct('jerry-can-spirits-expedition-spiced-rum')
    const amount = product?.priceRange?.minVariantPrice?.amount
    if (amount) {
      const value = Number.parseFloat(amount)
      if (Number.isFinite(value)) {
        rrp = `£${value.toFixed(2).replace(/\.00$/, '')}`
      }
    }
  } catch {
    // Price row is simply omitted if Shopify is unreachable.
  }

  return <MediaCentreClient rrp={rrp} />
}
