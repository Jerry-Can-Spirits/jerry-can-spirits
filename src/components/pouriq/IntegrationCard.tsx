'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PosConnection, PosProvider } from '@/lib/pouriq/pos/types'
import { PRIMARY_BUTTON, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON } from '@/lib/pouriq/button-styles'

interface MenuOption {
  id: string
  name: string
}

interface Props {
  provider: PosProvider
  title: string
  description: string
  connection: PosConnection | null
  menus: MenuOption[]
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

export function IntegrationCard({ provider, title, description, connection, menus, disabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [targetMenuId, setTargetMenuId] = useState<string>(connection?.target_menu_id ?? '')

  const targetMissing = connection !== null && !targetMenuId

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

  function updateTargetMenu(menuId: string) {
    setError(null)
    setTargetMenuId(menuId)
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/integrations/${provider}/target-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId: menuId || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setError(err.error ?? 'Could not update active menu')
        setTargetMenuId(connection?.target_menu_id ?? '')
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

      {connection && (
        <div className="mb-4">
          <label htmlFor={`target-menu-${provider}`} className="block text-xs font-medium text-parchment-300 mb-2">
            Route sales to
          </label>
          <select
            id={`target-menu-${provider}`}
            value={targetMenuId}
            onChange={(e) => updateTargetMenu(e.target.value)}
            disabled={pending || menus.length === 0}
            className="w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
          >
            <option value="">— Select an active menu —</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {targetMissing && (
            <p role="alert" className="mt-2 text-xs text-amber-300">
              Sales are paused until you pick an active menu. The next sync will backfill anything received while paused.
            </p>
          )}
          {menus.length === 0 && (
            <p className="mt-2 text-xs text-parchment-400">
              No menus yet — create one from the Pour IQ dashboard first.
            </p>
          )}
        </div>
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
