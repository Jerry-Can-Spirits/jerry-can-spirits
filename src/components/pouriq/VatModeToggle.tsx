'use client'

import { useState, useTransition } from 'react'
import { setMenuVatModeAction } from '@/lib/pouriq/server-actions'

interface Props {
  menuId: string
  pricesIncludeVat: boolean
}

export function VatModeToggle({ menuId, pricesIncludeVat }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function flip(next: boolean) {
    if (next === pricesIncludeVat) { setOpen(false); return }
    setError(null)
    startTransition(async () => {
      try {
        await setMenuVatModeAction(menuId, next)
        setOpen(false)
      } catch (e) {
        setError((e as Error).message || 'Could not update VAT mode')
      }
    })
  }

  const label = pricesIncludeVat ? 'Prices include VAT' : 'Prices net of VAT'

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-parchment-400 hover:text-parchment-200 underline underline-offset-4"
      >
        {label} (change)
      </button>
      {open && (
        <span className="bg-jerry-green-800/90 border border-gold-500/20 rounded-lg p-3 text-xs space-y-2 shadow-xl">
          <button
            type="button"
            disabled={pending}
            onClick={() => flip(true)}
            className={`block w-full text-left px-2 py-1 rounded ${pricesIncludeVat ? 'text-gold-200' : 'text-parchment-200 hover:bg-jerry-green-700/40'}`}
          >
            Include VAT (20%)
            <span className="block text-[10px] text-parchment-400">Customer-facing prices.</span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => flip(false)}
            className={`block w-full text-left px-2 py-1 rounded ${!pricesIncludeVat ? 'text-gold-200' : 'text-parchment-200 hover:bg-jerry-green-700/40'}`}
          >
            Net of VAT
            <span className="block text-[10px] text-parchment-400">Internal margin tracking.</span>
          </button>
          {error && <span role="alert" className="block text-red-300">{error}</span>}
        </span>
      )}
    </span>
  )
}
