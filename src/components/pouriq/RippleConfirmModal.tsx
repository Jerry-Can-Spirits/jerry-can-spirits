'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { ProjectedCocktail } from '@/lib/pouriq/cost-impact'

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

interface Props {
  isOpen: boolean
  ingredientName: string
  newlyBelowTarget: ProjectedCocktail[]
  onCancel: () => void
  onConfirm: () => void
  submitting?: boolean
}

export function RippleConfirmModal({
  isOpen,
  ingredientName,
  newlyBelowTarget,
  onCancel,
  onConfirm,
  submitting = false,
}: Props) {
  const count = newlyBelowTarget.length
  return (
    <Dialog open={isOpen} onClose={() => { if (!submitting) onCancel() }} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg bg-jerry-green-800 border border-gold-500/30 rounded-xl p-6 shadow-2xl">
          <DialogTitle className="text-lg font-serif font-bold text-white">
            {count === 1 ? '1 drink will drop below target' : `${count} drinks will drop below target`}
          </DialogTitle>
          <p className="mt-2 text-sm text-parchment-300">
            Saving the new cost for <span className="font-medium text-parchment-100">{ingredientName}</span> would push the following below their menu&rsquo;s target GP:
          </p>

          <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {newlyBelowTarget.map((p) => (
              <li key={p.cocktail_id} className="text-sm bg-jerry-green-900/40 border border-gold-500/10 rounded-lg px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-parchment-100 font-medium">{p.cocktail_name}</span>
                  <span className="text-parchment-400 text-xs">{p.menu_name}</span>
                </div>
                <div className="mt-1 text-xs text-parchment-300">
                  GP {formatPct(p.current_gp_pct)} {'→'}{' '}
                  <strong className="text-red-300">{formatPct(p.projected_gp_pct)}</strong>
                  <span className="text-parchment-500"> (target {p.menu_target_gp_pct}%)</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-sm text-parchment-200 hover:text-parchment-50 disabled:text-parchment-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="px-6 py-2 bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg text-sm"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
