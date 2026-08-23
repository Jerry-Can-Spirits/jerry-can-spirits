// Companies House lookup, for the due diligence AWRS actually asks for.
//
// WHY. The first real trade application declared "Sole Trader" with no company
// number and an entity name ending in "ltd". Companies House shows THE
// LICHFIELD VAULTS LTD, company 15137252, active, incorporated 13 September
// 2023, SIC 56302 public houses and bars, registered office at a different
// address from the one given as "same as trading". One lookup corrected four
// fields that a mandatory text box had cheerfully accepted as typed.
//
// That is the whole argument for verifying rather than mandating: the form was
// already strict and it still produced "Megan" in the personal licence field.
// Making a box required proves someone typed something, not that it is true.
//
// The API is free and needs a key from developer.company-information.service.gov.uk,
// passed as HTTP Basic username with an empty password — an unusual scheme, and
// the reason the header is built by hand here rather than with a helper.

const API = 'https://api.company-information.service.gov.uk'

export interface CompanyRecord {
  company_number: string
  company_name: string
  company_status: string
  type: string
  date_of_creation: string | null
  registered_office_address: string | null
  sic_codes: string[]
}

export type CompaniesHouseResult =
  | { outcome: 'match'; company: CompanyRecord; raw: unknown }
  | { outcome: 'not_found' }
  | { outcome: 'error'; message: string }

/** Companies House numbers are 8 characters: all digits, or two letters then six digits. */
export function normaliseCompanyNumber(input: string): string | null {
  const value = input.trim().toUpperCase().replace(/\s+/g, '')
  if (/^[0-9]{8}$/.test(value)) return value
  if (/^[A-Z]{2}[0-9]{6}$/.test(value)) return value
  // People drop leading zeros constantly — "1234567" is almost always 01234567.
  if (/^[0-9]{1,7}$/.test(value)) return value.padStart(8, '0')
  return null
}

function flattenAddress(address: Record<string, unknown> | undefined): string | null {
  if (!address) return null
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.locality,
    address.region,
    address.postal_code,
    address.country,
  ]
  const joined = parts.filter((p): p is string => typeof p === 'string' && p.trim() !== '').join(', ')
  return joined || null
}

export async function lookupCompany(apiKey: string, companyNumber: string): Promise<CompaniesHouseResult> {
  const number = normaliseCompanyNumber(companyNumber)
  if (!number) return { outcome: 'error', message: 'Not a valid company number format' }

  let response: Response
  try {
    response = await fetch(`${API}/company/${number}`, {
      headers: {
        // Basic auth with the key as username and no password.
        Authorization: `Basic ${btoa(`${apiKey}:`)}`,
        Accept: 'application/json',
      },
    })
  } catch (e) {
    return { outcome: 'error', message: e instanceof Error ? e.message : 'Request failed' }
  }

  if (response.status === 404) return { outcome: 'not_found' }
  if (!response.ok) return { outcome: 'error', message: `Companies House returned ${response.status}` }

  let raw: Record<string, unknown>
  try {
    raw = (await response.json()) as Record<string, unknown>
  } catch {
    return { outcome: 'error', message: 'Companies House returned unparseable JSON' }
  }

  return {
    outcome: 'match',
    raw,
    company: {
      company_number: String(raw.company_number ?? number),
      company_name: String(raw.company_name ?? ''),
      company_status: String(raw.company_status ?? ''),
      type: String(raw.type ?? ''),
      date_of_creation: typeof raw.date_of_creation === 'string' ? raw.date_of_creation : null,
      registered_office_address: flattenAddress(
        raw.registered_office_address as Record<string, unknown> | undefined,
      ),
      sic_codes: Array.isArray(raw.sic_codes) ? raw.sic_codes.map(String) : [],
    },
  }
}

/** SIC codes that correspond to a licensed on-trade venue. */
const ON_TRADE_SIC = new Set([
  '56301', // Licensed clubs
  '56302', // Public houses and bars
  '56101', // Licensed restaurants
  '56102', // Unlicensed restaurants and cafes
  '55100', // Hotels and similar accommodation
  '47250', // Retail sale of beverages in specialised stores
  '46342', // Wholesale of alcoholic beverages
])

export interface CompanyAssessment {
  /** Things that should be looked at before approving, in plain language. */
  flags: string[]
  /** Things that came back clean, worth recording as evidence. */
  confirmations: string[]
}

/**
 * Compare what Companies House says against what the applicant declared.
 *
 * This deliberately returns observations rather than a verdict. AWRS asks for a
 * risk assessment and mitigating action, not an automated approve or reject,
 * and a pub whose company was incorporated recently is a question to ask rather
 * than a reason to refuse — a 25-year-old pub bought out in 2023 looks exactly
 * like this and is entirely ordinary.
 */
export function assessCompany(
  company: CompanyRecord,
  declared: { legal_structure?: string; legal_entity_name?: string; years_trading?: number },
): CompanyAssessment {
  const flags: string[] = []
  const confirmations: string[] = []

  if (company.company_status.toLowerCase() === 'active') {
    confirmations.push('Companies House status is active')
  } else {
    flags.push(`Companies House status is "${company.company_status}", not active`)
  }

  const structure = declared.legal_structure?.toLowerCase() ?? ''
  if (structure && !structure.includes('limited') && !structure.includes('ltd')) {
    flags.push(`Declared "${declared.legal_structure}" but a company number resolves to a registered company`)
  }

  const declaredName = declared.legal_entity_name?.trim().toLowerCase()
  const actualName = company.company_name.trim().toLowerCase()
  if (declaredName && actualName && declaredName !== actualName) {
    flags.push(`Declared entity "${declared.legal_entity_name}" differs from "${company.company_name}"`)
  } else if (declaredName) {
    confirmations.push('Declared entity name matches Companies House')
  }

  if (company.sic_codes.some((c) => ON_TRADE_SIC.has(c))) {
    confirmations.push(`SIC ${company.sic_codes.filter((c) => ON_TRADE_SIC.has(c)).join(', ')} matches a licensed venue`)
  } else if (company.sic_codes.length) {
    flags.push(`SIC ${company.sic_codes.join(', ')} is not a licensed-venue code`)
  }

  if (company.date_of_creation && typeof declared.years_trading === 'number') {
    const incorporated = new Date(company.date_of_creation)
    const yearsSince = (Date.now() - incorporated.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    if (declared.years_trading > yearsSince + 1) {
      flags.push(
        `Declared ${declared.years_trading} years trading but incorporated ${company.date_of_creation} ` +
          `(${yearsSince.toFixed(1)} years) — normal after a buyout, worth confirming`,
      )
    }
  }

  return { flags, confirmations }
}
