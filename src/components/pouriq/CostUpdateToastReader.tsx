'use client'

import { useEffect, useState } from 'react'
import { CostUpdateToast } from './CostUpdateToast'

interface ToastData {
  ingredientName: string
  newlyBelowTarget: Array<{
    cocktail_id: string
    cocktail_name: string
    menu_id: string
    menu_name: string
    projected_gp_pct: number
    target_gp_pct: number
  }>
}

export function CostUpdateToastReader() {
  const [data, setData] = useState<ToastData | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('pouriq_cost_update_toast')
    if (!raw) return
    sessionStorage.removeItem('pouriq_cost_update_toast')
    try {
      const parsed = JSON.parse(raw) as ToastData
      if (parsed.newlyBelowTarget && parsed.newlyBelowTarget.length > 0) {
        setData(parsed)
      }
    } catch {
      // Malformed payload — drop it silently
    }
  }, [])

  if (!data) return null
  return (
    <CostUpdateToast
      ingredientName={data.ingredientName}
      newlyBelowTarget={data.newlyBelowTarget}
      onDismiss={() => setData(null)}
    />
  )
}
