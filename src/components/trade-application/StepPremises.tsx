'use client'

import { FileUpload } from './FileUpload'
import type { ApplicationFormState, Address } from './types'
import { TYPES_REQUIRING_LICENCE } from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-hidden transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepPremises({ data, errors, onChange }: Props) {
  const showLicensing = TYPES_REQUIRING_LICENCE.has(data.business_type)

  function updateAddress(which: 'trading_address' | 'registered_address', field: keyof Address, value: string) {
    onChange(which, { ...data[which], [field]: value })
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-parchment-100 mb-3">Trading address</legend>
        <AddressFields prefix="trading" address={data.trading_address}
          onField={(f, v) => updateAddress('trading_address', f, v)} errors={errors} />
      </fieldset>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-gold-500"
          checked={data.registered_address_same}
          onChange={(e) => onChange('registered_address_same', e.target.checked)} />
        <span className="text-sm text-parchment-200">Registered address is the same as the trading address</span>
      </label>

      {!data.registered_address_same && (
        <fieldset>
          <legend className="text-sm font-medium text-parchment-100 mb-3">Registered address</legend>
          <AddressFields prefix="registered" address={data.registered_address}
            onField={(f, v) => updateAddress('registered_address', f, v)} errors={errors} />
        </fieldset>
      )}

      {showLicensing && (
        <div className="border border-gold-500/20 rounded-lg p-5 bg-jerry-green-900/30 space-y-6">
          <h3 className="text-sm font-medium text-parchment-100">Premises licensing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="premises_licence_number" className={labelClass}>Premises licence number *</label>
              <input id="premises_licence_number" className={inputClass} aria-required="true"
                value={data.premises_licence_number} onChange={(e) => onChange('premises_licence_number', e.target.value)} />
              {errors.premises_licence_number && <p role="alert" className="mt-1 text-sm text-red-300">{errors.premises_licence_number}</p>}
            </div>
            <div>
              <label htmlFor="licensing_authority" className={labelClass}>Issuing local authority *</label>
              <input id="licensing_authority" className={inputClass} aria-required="true"
                value={data.licensing_authority} onChange={(e) => onChange('licensing_authority', e.target.value)} />
              {errors.licensing_authority && <p role="alert" className="mt-1 text-sm text-red-300">{errors.licensing_authority}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dps_name" className={labelClass}>Designated Premises Supervisor *</label>
              <input id="dps_name" className={inputClass} aria-required="true"
                value={data.dps_name} onChange={(e) => onChange('dps_name', e.target.value)} />
              {errors.dps_name && <p role="alert" className="mt-1 text-sm text-red-300">{errors.dps_name}</p>}
            </div>
            <div>
              <label htmlFor="personal_licence_number" className={labelClass}>Personal licence number *</label>
              <input id="personal_licence_number" className={inputClass} aria-required="true"
                value={data.personal_licence_number} onChange={(e) => onChange('personal_licence_number', e.target.value)} />
              {errors.personal_licence_number && <p role="alert" className="mt-1 text-sm text-red-300">{errors.personal_licence_number}</p>}
            </div>
          </div>

          <FileUpload
            id="premises_licence_file"
            label="Copy of premises licence"
            required
            value={data.premises_licence_file}
            onChange={(v) => onChange('premises_licence_file', v)}
          />
          {errors.premises_licence_file && <p role="alert" className="mt-1 text-sm text-red-300">{errors.premises_licence_file}</p>}
        </div>
      )}
    </div>
  )
}

function AddressFields({ prefix, address, onField, errors }: {
  prefix: string
  address: Address
  onField: (field: keyof Address, value: string) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${prefix}_line1`} className={labelClass}>Line 1 *</label>
        <input id={`${prefix}_line1`} className={inputClass} aria-required="true"
          value={address.line1} onChange={(e) => onField('line1', e.target.value)} />
        {errors[`${prefix}_line1`] && <p role="alert" className="mt-1 text-sm text-red-300">{errors[`${prefix}_line1`]}</p>}
      </div>
      <div>
        <label htmlFor={`${prefix}_line2`} className={labelClass}>Line 2</label>
        <input id={`${prefix}_line2`} className={inputClass}
          value={address.line2} onChange={(e) => onField('line2', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor={`${prefix}_town`} className={labelClass}>Town *</label>
          <input id={`${prefix}_town`} className={inputClass} aria-required="true"
            value={address.town} onChange={(e) => onField('town', e.target.value)} />
          {errors[`${prefix}_town`] && <p role="alert" className="mt-1 text-sm text-red-300">{errors[`${prefix}_town`]}</p>}
        </div>
        <div>
          <label htmlFor={`${prefix}_county`} className={labelClass}>County</label>
          <input id={`${prefix}_county`} className={inputClass}
            value={address.county} onChange={(e) => onField('county', e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${prefix}_postcode`} className={labelClass}>Postcode *</label>
          <input id={`${prefix}_postcode`} className={inputClass} aria-required="true"
            value={address.postcode} onChange={(e) => onField('postcode', e.target.value.toUpperCase())} />
          {errors[`${prefix}_postcode`] && <p role="alert" className="mt-1 text-sm text-red-300">{errors[`${prefix}_postcode`]}</p>}
        </div>
      </div>
    </div>
  )
}
