'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { VARIANCE_REASONS } from '@/lib/pouriq/types'
import { setVarianceReasonAction } from '@/lib/pouriq/server-actions'

export function VarianceReasonControl({ ingredientId, current }: { ingredientId: string; current: string | null }) {
  const router = useRouter()
  const [reason, setReason] = useState(current ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        await setVarianceReasonAction(ingredientId, reason || null)
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not save reason.')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Variance reason"
        className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded-sm text-parchment-50 text-sm"
      >
        <option value="">No reason set</option>
        {VARIANCE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="px-3 py-1 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg text-sm font-semibold disabled:opacity-40"
      >
        Save reason
      </button>
      {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
    </div>
  )
}
