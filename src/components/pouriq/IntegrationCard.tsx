'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PosConnection, PosProvider } from '@/lib/pouriq/pos/types'
import { PRIMARY_BUTTON, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON } from '@/lib/pouriq/button-styles'

interface Props {
  provider: PosProvider
  title: string
  description: string
  connection: PosConnection | null
  disabled?: boolean
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function IntegrationCard({ provider, title, description, connection, disabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function connect() {
    window.location.href = `/api/pouriq/integrations/${provider}/oauth/start`
  }

  function disconnect() {
    if (!confirm(`Disconnect ${title}? Volumes already imported are kept.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/integrations/${provider}/disconnect`, { method: 'POST' })
      if (!res.ok) setError('Could not disconnect')
      else router.refresh()
    })
  }

  function sync() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/integrations/${provider}/sync`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setError(err.error ?? 'Sync failed')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <h2 className="text-lg font-serif font-bold text-white">{title}</h2>
        {connection ? (
          <span className="text-xs text-emerald-300">Connected</span>
        ) : disabled ? (
          <span className="text-xs text-parchment-500">Coming soon</span>
        ) : (
          <span className="text-xs text-parchment-400">Not connected</span>
        )}
      </div>
      <p className="text-sm text-parchment-300 mb-4">{description}</p>
      {connection && (
        <p className="text-xs text-parchment-400 mb-4">
          Last sync: {formatRelativeTime(connection.last_synced_at)}
          {connection.last_sync_error && (
            <span className="block text-red-300 mt-1">Last error: {connection.last_sync_error}</span>
          )}
        </p>
      )}
      {error && <p role="alert" className="text-xs text-red-300 mb-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {connection ? (
          <>
            <button type="button" onClick={sync} disabled={pending} className={SECONDARY_BUTTON_SM}>
              {pending ? 'Syncing…' : 'Sync now'}
            </button>
            <button type="button" onClick={disconnect} disabled={pending} className={DESTRUCTIVE_BUTTON}>
              Disconnect
            </button>
          </>
        ) : (
          <button type="button" onClick={connect} disabled={disabled || pending} className={PRIMARY_BUTTON}>
            Connect {title}
          </button>
        )}
      </div>
    </div>
  )
}
