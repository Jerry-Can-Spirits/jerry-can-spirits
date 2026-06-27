'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignOutLink() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSignOut() {
    setSubmitting(true)
    try {
      await fetch('/api/trade/logout', { method: 'POST' })
    } catch {
      // fall through — we still want to redirect even if revoke fails server-side
    }
    router.push('/trade/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={submitting}
      className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4 disabled:opacity-50"
    >
      {submitting ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
