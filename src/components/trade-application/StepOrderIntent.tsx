'use client'

import type { ApplicationFormState } from './types'
import { VOLUMES, PAYMENT_TERMS } from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepOrderIntent({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="expected_initial_volume" className={labelClass}>Expected initial order *</label>
          <select id="expected_initial_volume" className={inputClass} aria-required="true"
            value={data.expected_initial_volume} onChange={(e) => onChange('expected_initial_volume', e.target.value)}>
            <option value="">Select</option>
            {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.expected_initial_volume && <p role="alert" className="mt-1 text-sm text-red-300">{errors.expected_initial_volume}</p>}
        </div>
        <div>
          <label htmlFor="expected_monthly_volume" className={labelClass}>Expected ongoing monthly *</label>
          <select id="expected_monthly_volume" className={inputClass} aria-required="true"
            value={data.expected_monthly_volume} onChange={(e) => onChange('expected_monthly_volume', e.target.value)}>
            <option value="">Select</option>
            {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.expected_monthly_volume && <p role="alert" className="mt-1 text-sm text-red-300">{errors.expected_monthly_volume}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="payment_terms_pref" className={labelClass}>Payment terms preference *</label>
        <select id="payment_terms_pref" className={inputClass} aria-required="true"
          value={data.payment_terms_pref} onChange={(e) => onChange('payment_terms_pref', e.target.value)}>
          <option value="">Select</option>
          {PAYMENT_TERMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.payment_terms_pref && <p role="alert" className="mt-1 text-sm text-red-300">{errors.payment_terms_pref}</p>}
      </div>

      <div>
        <label htmlFor="how_heard" className={labelClass}>How did you hear about us?</label>
        <input id="how_heard" className={inputClass}
          value={data.how_heard} onChange={(e) => onChange('how_heard', e.target.value)} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
        <textarea id="notes" rows={4} className={`${inputClass} resize-vertical`}
          value={data.notes} onChange={(e) => onChange('notes', e.target.value)} />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-gold-500" aria-required="true"
          checked={data.declaration}
          onChange={(e) => onChange('declaration', e.target.checked)} />
        <span className="text-sm text-parchment-200">
          I confirm the information provided is true and accurate, and I am authorised to apply for a trade account on behalf of this business. *
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-gold-500"
          checked={data.marketing_opt_in}
          onChange={(e) => onChange('marketing_opt_in', e.target.checked)} />
        <span className="text-sm text-parchment-200">
          Add me to trade updates and new product notifications.
        </span>
      </label>

      {/* Honeypot - visually hidden but reachable */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website_url">Website URL (leave blank)</label>
        <input id="website_url" type="text" tabIndex={-1} autoComplete="off"
          value={data.website_url} onChange={(e) => onChange('website_url', e.target.value)} />
      </div>
    </div>
  )
}
