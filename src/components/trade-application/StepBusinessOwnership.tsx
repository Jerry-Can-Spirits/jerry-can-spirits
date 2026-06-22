'use client'

import type { ApplicationFormState, Psc } from './types'
import {
  LEGAL_STRUCTURES, BUSINESS_TYPES,
  STRUCTURES_REQUIRING_CH, TYPES_REQUIRING_AWRS,
} from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepBusinessOwnership({ data, errors, onChange }: Props) {
  const showCh = STRUCTURES_REQUIRING_CH.has(data.legal_structure)
  const showAwrs = TYPES_REQUIRING_AWRS.has(data.business_type)
  const showPsc = ['Ltd', 'LLP', 'PLC', 'CIC'].includes(data.legal_structure)

  function updatePsc(index: number, key: keyof Psc, value: string) {
    const next = [...data.psc]
    next[index] = { ...next[index], [key]: value }
    onChange('psc', next)
  }

  function addPsc() {
    if (data.psc.length >= 2) return
    onChange('psc', [...data.psc, { name: '', dob_month: '', dob_year: '' }])
  }

  function removePsc(index: number) {
    onChange('psc', data.psc.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="trading_name" label="Trading name" required error={errors.trading_name}>
          <input id="trading_name" className={inputClass} aria-required="true"
            value={data.trading_name} onChange={(e) => onChange('trading_name', e.target.value)} />
        </Field>
        <Field id="legal_entity_name" label="Legal entity name" required error={errors.legal_entity_name}>
          <input id="legal_entity_name" className={inputClass} aria-required="true"
            value={data.legal_entity_name} onChange={(e) => onChange('legal_entity_name', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="legal_structure" label="Legal structure" required error={errors.legal_structure}>
          <select id="legal_structure" className={inputClass} aria-required="true"
            value={data.legal_structure} onChange={(e) => onChange('legal_structure', e.target.value)}>
            <option value="">Select</option>
            {LEGAL_STRUCTURES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field id="business_type" label="Business type" required error={errors.business_type}>
          <select id="business_type" className={inputClass} aria-required="true"
            value={data.business_type} onChange={(e) => onChange('business_type', e.target.value)}>
            <option value="">Select</option>
            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      {showCh && (
        <Field id="companies_house_number" label="Companies House number" required error={errors.companies_house_number}>
          <input id="companies_house_number" className={inputClass} aria-required="true"
            placeholder="e.g. 12345678" maxLength={8}
            value={data.companies_house_number} onChange={(e) => onChange('companies_house_number', e.target.value.toUpperCase())} />
        </Field>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="vat_number" label="VAT number" hint="If VAT-registered" error={errors.vat_number}>
          <input id="vat_number" className={inputClass}
            placeholder="GB123456789"
            value={data.vat_number} onChange={(e) => onChange('vat_number', e.target.value.toUpperCase())} />
        </Field>
        {showAwrs && (
          <Field id="awrs_urn" label="AWRS URN" required error={errors.awrs_urn}
            hint="Format: X + 3 letters + 11 digits">
            <input id="awrs_urn" className={inputClass} aria-required="true"
              placeholder="XAAW00000123456" maxLength={15}
              value={data.awrs_urn} onChange={(e) => onChange('awrs_urn', e.target.value.toUpperCase())} />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="years_trading" label="Years trading" required error={errors.years_trading}>
          <input id="years_trading" type="number" min={0} max={200} className={inputClass} aria-required="true"
            value={data.years_trading} onChange={(e) => onChange('years_trading', e.target.value)} />
        </Field>
        <Field id="website" label="Website" hint="Optional" error={errors.website}>
          <input id="website" type="url" className={inputClass}
            placeholder="https://"
            value={data.website} onChange={(e) => onChange('website', e.target.value)} />
        </Field>
      </div>

      {showPsc && (
        <div className="border border-gold-500/20 rounded-lg p-5 bg-jerry-green-900/30">
          <h3 className="text-sm font-medium text-parchment-100 mb-4">Persons of Significant Control</h3>
          {data.psc.length === 0 && (
            <p className="text-xs text-parchment-400 mb-3">Add anyone with 25%+ ownership or voting rights. Up to two for now.</p>
          )}
          {data.psc.map((p, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input className={inputClass} placeholder="Name" aria-label={`PSC ${i + 1} name`}
                value={p.name} onChange={(e) => updatePsc(i, 'name', e.target.value)} />
              <input className={inputClass} placeholder="DOB month" type="number" min={1} max={12} aria-label={`PSC ${i + 1} DOB month`}
                value={p.dob_month} onChange={(e) => updatePsc(i, 'dob_month', e.target.value)} />
              <div className="flex gap-2">
                <input className={inputClass + ' flex-1'} placeholder="DOB year" type="number" min={1900} max={new Date().getFullYear()} aria-label={`PSC ${i + 1} DOB year`}
                  value={p.dob_year} onChange={(e) => updatePsc(i, 'dob_year', e.target.value)} />
                <button type="button" onClick={() => removePsc(i)} className="px-3 py-2 text-sm text-parchment-300 border border-gold-500/30 rounded-lg hover:bg-jerry-green-700/30">Remove</button>
              </div>
            </div>
          ))}
          {data.psc.length < 2 && (
            <button type="button" onClick={addPsc} className="text-sm text-gold-300 hover:text-gold-200 underline">
              Add{data.psc.length > 0 ? ' another' : ''} PSC
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ id, label, required, hint, error, children }: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}{required && <span aria-hidden="true"> *</span>}
        {hint && <span className="text-xs text-parchment-400 font-normal ml-2">({hint})</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  )
}
