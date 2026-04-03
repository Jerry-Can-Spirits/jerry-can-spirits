'use client'

import { useState, useEffect } from 'react'
import { getProduct } from '@/lib/shopify'

const BOTTLE_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'
const TRADE_PACK_HANDLE = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'

interface Props {
  handle: string
  total: number
  label: string
}

export default function BatchStockIndicator({ handle, total, label }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    async function fetchStock() {
      try {
        if (handle === BOTTLE_HANDLE) {
          // Single bottle: combine with trade pack sales (each pack = 6 bottles)
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
              singleBottlesSold = Math.max(0, total - variant.quantityAvailable)
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
          setRemaining(Math.max(0, total - totalSold))
        } else {
          // All other limited products: use Shopify quantityAvailable directly
          const product = await getProduct(handle)
          if (product?.variants?.[0]?.quantityAvailable !== undefined) {
            setRemaining(product.variants[0].quantityAvailable)
          }
        }
      } catch {
        // Silently fail — stock indicator is non-critical
      }
    }

    fetchStock()
  }, [handle, total])

  if (remaining === null) {
    return <div className="h-4 w-40 bg-jerry-green-800/60 rounded animate-pulse" />
  }

  return (
    <p className="text-sm text-parchment-400">
      {label} · {remaining} remaining
    </p>
  )
}
