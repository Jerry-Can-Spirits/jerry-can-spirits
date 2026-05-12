'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMenuAction } from '@/lib/pouriq/server-actions'

interface Props {
  menuId: string
  menuName: string
}

export function DeleteMenuButton({ menuId, menuName }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleDelete() {
    const confirmed = confirm(
      `Delete "${menuName}"? This removes the menu and all its drinks and analyses. This cannot be undone.`
    )
    if (!confirmed) return
    setSubmitting(true)
    try {
      await deleteMenuAction(menuId)
    } catch {
      setSubmitting(false)
      alert('Could not delete the menu. Please try again.')
    }
    // deleteMenuAction redirects to /trade/pouriq on success, so we don't
    // need to handle the success path here.
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={submitting}
      className="text-sm text-red-300 hover:text-red-200 underline disabled:opacity-50"
    >
      {submitting ? 'Deleting…' : 'Delete menu'}
    </button>
  )
}
