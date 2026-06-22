'use client'

import { FileUpload } from './FileUpload'
import type { ApplicationFormState } from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepContact({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact_name" className={labelClass}>Primary contact name *</label>
          <input id="contact_name" className={inputClass} aria-required="true" autoComplete="name"
            value={data.contact_name} onChange={(e) => onChange('contact_name', e.target.value)} />
          {errors.contact_name && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_name}</p>}
        </div>
        <div>
          <label htmlFor="contact_role" className={labelClass}>Role / position *</label>
          <input id="contact_role" className={inputClass} aria-required="true"
            value={data.contact_role} onChange={(e) => onChange('contact_role', e.target.value)} />
          {errors.contact_role && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_role}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact_email" className={labelClass}>Email *</label>
          <input id="contact_email" type="email" className={inputClass} aria-required="true" autoComplete="email"
            value={data.contact_email} onChange={(e) => onChange('contact_email', e.target.value)} />
          {errors.contact_email && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_email}</p>}
        </div>
        <div>
          <label htmlFor="contact_phone" className={labelClass}>Phone *</label>
          <input id="contact_phone" type="tel" className={inputClass} aria-required="true" autoComplete="tel"
            value={data.contact_phone} onChange={(e) => onChange('contact_phone', e.target.value)} />
          {errors.contact_phone && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="director_name" className={labelClass}>Director / owner name *</label>
        <input id="director_name" className={inputClass} aria-required="true"
          value={data.director_name} onChange={(e) => onChange('director_name', e.target.value)} />
        {errors.director_name && <p role="alert" className="mt-1 text-sm text-red-300">{errors.director_name}</p>}
      </div>

      <FileUpload
        id="director_id_file"
        label="Photo ID of director or owner (passport or driving licence)"
        required
        value={data.director_id_file}
        onChange={(v) => onChange('director_id_file', v)}
      />
      {errors.director_id_file && <p role="alert" className="mt-1 text-sm text-red-300">{errors.director_id_file}</p>}
    </div>
  )
}
