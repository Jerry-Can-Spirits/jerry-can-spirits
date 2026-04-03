'use client'

import { useState, useEffect } from 'react'
import { getProduct } from '@/lib/shopify'

const BOTTLE_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'
const TRADE_PACK_HANDLE = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'
const TOTAL_BATCH = 700

export default function BatchStockIndicator() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    async function fetchStock() {
      try {
        const [bottleProduct, tradePackProduct] = await Promise.all([
          getProduct(BOTTLE_HANDLE),
          getProduct(TRADE_PACK_HANDLE),
        ])

        let singleBottlesSold = 0
        let tradePacksSold = 0

        if (bottleProduct?.variants?.[0]) {
          const variant = bottleProduct.variants[0]
          const preorderSoldMeta = bottleProduct.metafields?.find(
            (m: { namespace: string; key: string; value: string } | null) =>
              m?.namespace === 'custom' && m?.key === 'pre_order_sold'
          )
          if (preorderSoldMeta?.value) {
            singleBottlesSold = parseInt(preorderSoldMeta.value, 10)
          } else if (variant.quantityAvailable !== undefined) {
            singleBottlesSold = Math.max(0, TOTAL_BATCH - variant.quantityAvailable)
          }
        }

        if (tradePackProduct?.metafields) {
          const tradePackSoldMeta = tradePackProduct.metafields.find(
            (m: { namespace: string; key: string; value: string } | null) =>
              m?.namespace === 'custom' && m?.key === 'pre_order_sold'
          )
          if (tradePackSoldMeta?.value) {
            tradePacksSold = parseInt(tradePackSoldMeta.value, 10)
          }
        }

        const totalSold = singleBottlesSold + tradePacksSold * 6
        setRemaining(Math.max(0, TOTAL_BATCH - totalSold))
      } catch {
        // Silently fail — stock indicator is non-critical
      }
    }

    fetchStock()
  }, [])

  if (remaining === null) {
    return <div className="h-4 w-40 bg-jerry-green-800/60 rounded animate-pulse" />
  }

  return (
    <p className="text-sm text-parchment-400">
      Batch 001 · {remaining} {remaining === 1 ? 'bottle' : 'bottles'} remaining
    </p>
  )
}
