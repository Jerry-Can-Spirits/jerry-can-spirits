// Server-authoritative validators for the trade application submission.
// Each returns { ok: true } | { ok: false, error: string } so callers
// can build a per-field error report.

export type ValidationResult = { ok: true } | { ok: false, error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
const COMPANIES_HOUSE_RE = /^([A-Z]{2}\d{6}|\d{8})$/
const AWRS_URN_RE = /^X[A-Z]{3}\d{11}$/
const VAT_RE = /^(GB)?(\d{9}|\d{12})$/i
const DIGITS_RE = /\d/g

export function validateEmail(value: string): ValidationResult {
  if (!value || value.length > 254) return { ok: false, error: 'Invalid email' }
  if (!EMAIL_RE.test(value)) return { ok: false, error: 'Invalid email format' }
  return { ok: true }
}

export function validatePostcode(value: string): ValidationResult {
  if (!value) return { ok: false, error: 'Postcode is required' }
  if (!UK_POSTCODE_RE.test(value.trim())) return { ok: false, error: 'Invalid UK postcode' }
  return { ok: true }
}

export function validatePhone(value: string): ValidationResult {
  const digits = (value.match(DIGITS_RE) ?? []).length
  if (digits < 10 || digits > 13) {
    return { ok: false, error: 'Phone number must contain 10–13 digits' }
  }
  return { ok: true }
}

export function validateCompaniesHouse(value: string): ValidationResult {
  if (!COMPANIES_HOUSE_RE.test(value)) {
    return { ok: false, error: 'Invalid Companies House number' }
  }
  return { ok: true }
}

export function validateAwrsUrn(value: string): ValidationResult {
  if (!AWRS_URN_RE.test(value)) {
    return { ok: false, error: 'Invalid AWRS URN (format: X + 3 letters + 11 digits)' }
  }
  return { ok: true }
}

export function validateVat(value: string): ValidationResult {
  if (!value) return { ok: true } // optional
  if (!VAT_RE.test(value.replace(/\s/g, ''))) {
    return { ok: false, error: 'Invalid VAT number' }
  }
  return { ok: true }
}

const REQUIRES_PREMISES_LICENCE = new Set([
  'Pub/Bar',
  'Restaurant',
  'Hotel',
  'Club',
  'Off-licence',
])

const REQUIRES_AWRS = new Set(['Wholesaler', 'Distributor'])

const REQUIRES_COMPANIES_HOUSE = new Set(['Ltd', 'LLP', 'PLC', 'CIC', 'Charity'])

export function requiresPremisesLicence(businessType: string): boolean {
  return REQUIRES_PREMISES_LICENCE.has(businessType)
}

export function requiresAwrs(businessType: string): boolean {
  return REQUIRES_AWRS.has(businessType)
}

export function requiresCompaniesHouse(legalStructure: string): boolean {
  return REQUIRES_COMPANIES_HOUSE.has(legalStructure)
}
