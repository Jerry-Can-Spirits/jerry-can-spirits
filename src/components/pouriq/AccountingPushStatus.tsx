'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  invoiceId: string
  provider: 'xero' | 'quickbooks'
  providerTitle: string
  status: 'pushed' | 'failed' | 'pending'
  error: string | null
  pushedAt: string | null
  predatesConnection?: boolean
}

export function AccountingPushStatus({ invoiceId, provider, providerTitle, status, error, pushedAt, predatesConnection }: Props) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  async function retry() {
    setRetrying(true)
    try {
      await fetch(`/api/pouriq/integrations/accounting/${provider}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      router.refresh()
    } finally {
      setRetrying(false)
    }
  }

  if (status === 'pushed') {
    return (
      <p className="text-sm text-emerald-700">
        Pushed to {providerTitle} as a draft bill{pushedAt ? ` (${pushedAt})` : ''}.
      </p>
    )
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-rose-600" role={status === 'failed' ? 'alert' : undefined}>
        {status === 'failed'
          ? `Push to ${providerTitle} failed${error ? `: ${error}` : ''}`
          : predatesConnection
            ? `This invoice predates the ${providerTitle} connection. Push it now to send it across.`
            : `Queued for ${providerTitle}. It will push on the next hourly run.`}
      </span>
      <button
        type="button"
        onClick={retry}
        disabled={retrying}
        className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {retrying ? 'Pushing' : 'Push now'}
      </button>
    </div>
  )
}
