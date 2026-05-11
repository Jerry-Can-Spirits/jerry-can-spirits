'use client'

import { useState } from 'react'
import { createMenuAction } from '@/lib/pouriq/server-actions'

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function CreateMenuForm() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function action(formData: FormData) {
    setError(null)
    setSubmitting(true)
    try {
      await createMenuAction(formData)
    } catch (e) {
      setError((e as Error).message || 'Could not create menu')
      setSubmitting(false)
    }
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className={labelClass}>Menu name *</label>
        <input id="name" name="name" required className={inputClass} placeholder="e.g. Summer 2026" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue_type" className={labelClass}>Venue type</label>
          <select id="venue_type" name="venue_type" className={inputClass}>
            <option value="">Select</option>
            <option value="pub">Pub</option>
            <option value="cocktail-bar">Cocktail bar</option>
            <option value="restaurant">Restaurant</option>
            <option value="hotel">Hotel</option>
            <option value="club">Club</option>
          </select>
        </div>
        <div>
          <label htmlFor="positioning" className={labelClass}>Positioning</label>
          <select id="positioning" name="positioning" className={inputClass}>
            <option value="">Select</option>
            <option value="premium">Premium</option>
            <option value="casual">Casual</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className={labelClass}>City</label>
          <input id="city" name="city" className={inputClass} />
        </div>
        <div>
          <label htmlFor="target_gp_pct" className={labelClass}>Target GP %</label>
          <input id="target_gp_pct" name="target_gp_pct" type="number" min={0} max={100} step={0.5} defaultValue={75} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" name="notes" rows={3} className={`${inputClass} resize-vertical`} />
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
        {submitting ? 'Creating…' : 'Create menu'}
      </button>
    </form>
  )
}
