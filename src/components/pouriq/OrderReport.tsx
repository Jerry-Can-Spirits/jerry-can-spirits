'use client'

import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'

interface OrderRow {
  id: string
  name: string
  pack_size: number
  on_hand: number | null
  par: number | null
  order_qty: number
}

export function OrderReport({ rows }: { rows: OrderRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-parchment-300">
        Nothing to order. Everything is at or above its par level.
      </p>
    )
  }

  return (
    <>
      <div className="no-print mb-6 flex justify-end">
        <button type="button" onClick={() => window.print()} className={PRIMARY_BUTTON}>
          Print
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-parchment-400 border-b border-gold-500/20">
            <th className="py-2 pr-4">Ingredient</th>
            <th className="py-2 pr-4 text-right">On hand</th>
            <th className="py-2 pr-4 text-right">Par</th>
            <th className="py-2 text-right">Order</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-gold-500/10">
              <td className="py-2 pr-4 text-parchment-100">{r.name} <span className="text-parchment-400">({r.pack_size}ml)</span></td>
              <td className="py-2 pr-4 text-right text-parchment-300">{r.on_hand !== null ? r.on_hand.toFixed(1) : '—'}</td>
              <td className="py-2 pr-4 text-right text-parchment-300">{r.par !== null ? r.par : '—'}</td>
              <td className="py-2 text-right text-parchment-100 font-semibold">{r.order_qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
