'use client'

import { useEffect, useRef, useState } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { StepProgress } from '@/components/trade-application/StepProgress'
import { StepBusinessOwnership } from '@/components/trade-application/StepBusinessOwnership'
import { StepPremises } from '@/components/trade-application/StepPremises'
import { StepContact } from '@/components/trade-application/StepContact'
import { StepOrderIntent } from '@/components/trade-application/StepOrderIntent'
import {
  INITIAL_STATE, type ApplicationFormState,
  STRUCTURES_REQUIRING_CH, TYPES_REQUIRING_AWRS, TYPES_REQUIRING_LICENCE,
} from '@/components/trade-application/types'

const TOTAL_STEPS = 4
const STORAGE_KEY = 'trade-application-draft'

const STEP_HEADINGS = [
  'Business & ownership',
  'Premises & licensing',
  'Primary contact & director',
  'Order intent & declaration',
]

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
const COMPANIES_HOUSE_RE = /^([A-Z]{2}\d{6}|\d{8})$/
const AWRS_URN_RE = /^X[A-Z]{3}\d{11}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function TradeApplyPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<ApplicationFormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Restore draft from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { step?: number, data?: Partial<ApplicationFormState> }
        if (parsed.data) setData({ ...INITIAL_STATE, ...parsed.data })
        if (parsed.step && parsed.step >= 1 && parsed.step <= TOTAL_STEPS) setStep(parsed.step)
      }
    } catch { /* ignore corrupt drafts */ }
  }, [])

  // Persist draft
  useEffect(() => {
    if (status === 'success') return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data: { ...data, premises_licence_file: data.premises_licence_file, director_id_file: data.director_id_file } }))
    } catch { /* quota or private mode — ignore */ }
  }, [step, data, status])

  // Focus step heading on step change
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function setField<K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) {
    setData((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  function validateStep(n: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (n === 1) {
      if (!data.trading_name.trim()) e.trading_name = 'Required'
      if (!data.legal_entity_name.trim()) e.legal_entity_name = 'Required'
      if (!data.legal_structure) e.legal_structure = 'Required'
      if (!data.business_type) e.business_type = 'Required'
      if (!data.years_trading || Number(data.years_trading) < 0) e.years_trading = 'Required'
      if (STRUCTURES_REQUIRING_CH.has(data.legal_structure)) {
        if (!data.companies_house_number) e.companies_house_number = 'Required for this legal structure'
        else if (!COMPANIES_HOUSE_RE.test(data.companies_house_number)) e.companies_house_number = 'Invalid format'
      }
      if (TYPES_REQUIRING_AWRS.has(data.business_type)) {
        if (!data.awrs_urn) e.awrs_urn = 'Required for wholesalers and distributors'
        else if (!AWRS_URN_RE.test(data.awrs_urn)) e.awrs_urn = 'Invalid format'
      }
    }
    if (n === 2) {
      const addr = data.trading_address
      if (!addr.line1.trim()) e.trading_line1 = 'Required'
      if (!addr.town.trim()) e.trading_town = 'Required'
      if (!UK_POSTCODE_RE.test(addr.postcode.trim())) e.trading_postcode = 'Invalid UK postcode'
      if (!data.registered_address_same) {
        const r = data.registered_address
        if (!r.line1.trim()) e.registered_line1 = 'Required'
        if (!r.town.trim()) e.registered_town = 'Required'
        if (!UK_POSTCODE_RE.test(r.postcode.trim())) e.registered_postcode = 'Invalid UK postcode'
      }
      if (TYPES_REQUIRING_LICENCE.has(data.business_type)) {
        if (!data.premises_licence_number.trim()) e.premises_licence_number = 'Required'
        if (!data.licensing_authority.trim()) e.licensing_authority = 'Required'
        if (!data.dps_name.trim()) e.dps_name = 'Required'
        if (!data.personal_licence_number.trim()) e.personal_licence_number = 'Required'
        if (!data.premises_licence_file) e.premises_licence_file = 'Upload required'
      }
    }
    if (n === 3) {
      if (!data.contact_name.trim()) e.contact_name = 'Required'
      if (!data.contact_role.trim()) e.contact_role = 'Required'
      if (!EMAIL_RE.test(data.contact_email)) e.contact_email = 'Invalid email'
      if (!data.contact_phone.trim()) e.contact_phone = 'Required'
      if (!data.director_name.trim()) e.director_name = 'Required'
      if (!data.director_id_file) e.director_id_file = 'Upload required'
    }
    if (n === 4) {
      if (!data.expected_initial_volume) e.expected_initial_volume = 'Required'
      if (!data.expected_monthly_volume) e.expected_monthly_volume = 'Required'
      if (!data.payment_terms_pref) e.payment_terms_pref = 'Required'
    }
    return e
  }

  function next() {
    const e = validateStep(step)
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setErrors({})
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  function back() {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleSubmit() {
    const e = validateStep(4)
    if (!data.declaration) e.declaration = 'You must accept the declaration to submit'
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setSubmitting(true)
    setStatus('idle')
    setServerError('')
    try {
      const body = {
        trading_name: data.trading_name,
        legal_entity_name: data.legal_entity_name,
        legal_structure: data.legal_structure,
        business_type: data.business_type,
        companies_house_number: data.companies_house_number || undefined,
        vat_number: data.vat_number || undefined,
        awrs_urn: data.awrs_urn || undefined,
        years_trading: Number(data.years_trading),
        website: data.website || undefined,
        psc: data.psc.length > 0
          ? data.psc.map((p) => ({ name: p.name, dob_month: Number(p.dob_month), dob_year: Number(p.dob_year) }))
          : undefined,
        trading_address: data.trading_address,
        registered_address_same: data.registered_address_same,
        registered_address: data.registered_address_same ? undefined : data.registered_address,
        premises_licence_number: data.premises_licence_number || undefined,
        licensing_authority: data.licensing_authority || undefined,
        dps_name: data.dps_name || undefined,
        personal_licence_number: data.personal_licence_number || undefined,
        premises_licence_ticket: data.premises_licence_file?.ticket,
        contact_name: data.contact_name,
        contact_role: data.contact_role,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        director_name: data.director_name,
        director_id_ticket: data.director_id_file?.ticket,
        expected_initial_volume: data.expected_initial_volume,
        expected_monthly_volume: data.expected_monthly_volume,
        payment_terms_pref: data.payment_terms_pref,
        how_heard: data.how_heard || undefined,
        notes: data.notes || undefined,
        declaration: data.declaration,
        marketing_opt_in: data.marketing_opt_in,
        website_url: data.website_url,
      }
      const res = await fetch('/api/trade-application/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setStatus('success')
        sessionStorage.removeItem(STORAGE_KEY)
      } else {
        let msg = ''
        try {
          const d = await res.json() as { error?: string }
          if (typeof d.error === 'string') msg = d.error
        } catch { /* keep fallback */ }
        setServerError(msg)
        setStatus('error')
      }
    } catch {
      setServerError('')
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
            <h1 className="text-2xl font-serif font-bold text-parchment-50 mb-3">Application received</h1>
            <p className="text-parchment-200 mb-2">We will review and get back to you within three working days.</p>
            <p className="text-parchment-300 text-sm">Check your inbox (and junk folder) for confirmation.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs items={[
          { label: 'Trade', href: '/trade' },
          { label: 'Apply' },
        ]} />
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Trade Application</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-parchment-50 mb-3">Apply for a Trade Account</h1>
            <p className="text-parchment-300 max-w-xl mx-auto">
              Four short steps. We review and respond within three working days.
            </p>
          </div>

          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20">
            <StepProgress step={step} total={TOTAL_STEPS} />

            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-serif font-bold text-parchment-50 mb-6 outline-none">
              {STEP_HEADINGS[step - 1]}
            </h2>

            {Object.keys(errors).length > 0 && (
              <div role="alert" aria-live="polite" className="mb-6 bg-red-600/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-200">
                Please fix the highlighted fields before continuing.
              </div>
            )}

            {step === 1 && <StepBusinessOwnership data={data} errors={errors} onChange={setField} />}
            {step === 2 && <StepPremises data={data} errors={errors} onChange={setField} />}
            {step === 3 && <StepContact data={data} errors={errors} onChange={setField} />}
            {step === 4 && <StepOrderIntent data={data} errors={errors} onChange={setField} />}

            {status === 'error' && (
              <div role="alert" className="mt-6 bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-sm text-red-200">
                {serverError || 'We could not submit your application. Please try again, or email hello@jerrycanspirits.co.uk if the problem persists.'}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t border-gold-500/10">
              {step > 1 ? (
                <button type="button" onClick={back}
                  className="px-6 py-3 border border-gold-500/30 rounded-lg text-parchment-100 hover:bg-jerry-green-700/40 transition-colors">
                  Back
                </button>
              ) : <span />}

              {step < TOTAL_STEPS && (
                <button type="button" onClick={next}
                  className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all">
                  Next
                </button>
              )}
              {step === TOTAL_STEPS && (
                <button type="button" onClick={handleSubmit} disabled={submitting || !data.declaration}
                  aria-disabled={submitting || !data.declaration}
                  className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-jerry-green-900 font-semibold rounded-lg transition-all">
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
