/**
 * The verification helpers, tested against the real first trade application.
 *
 * Every case below is drawn from what Litchfield Vaults actually submitted on
 * 23 August 2026 and what the sources actually returned, rather than from
 * invented examples. The form was already strict and still accepted "Sole
 * Trader" for a registered company, "hereford council" for Herefordshire, and
 * "Megan" as a personal licence number.
 */
import { describe, it, expect } from 'vitest'
import { normaliseCompanyNumber, assessCompany, type CompanyRecord } from '@/lib/verification/companies-house'
import { looksLikePostcode, administrativeArea } from '@/lib/verification/postcode'

// Exactly as Companies House returned it for 15137252.
const LICHFIELD: CompanyRecord = {
  company_number: '15137252',
  company_name: 'THE LICHFIELD VAULTS LTD',
  company_status: 'active',
  type: 'ltd',
  date_of_creation: '2023-09-13',
  registered_office_address: 'Hereford House, 3 Offa Street, Hereford, United Kingdom, HR1 2LL',
  sic_codes: ['56302'],
}

describe('company number normalisation', () => {
  it('accepts the standard eight-digit form', () => {
    expect(normaliseCompanyNumber('15137252')).toBe('15137252')
    expect(normaliseCompanyNumber(' 15137252 ')).toBe('15137252')
  })

  it('accepts the two-letter prefixed forms Scotland and NI use', () => {
    expect(normaliseCompanyNumber('SC123456')).toBe('SC123456')
    expect(normaliseCompanyNumber('ni123456')).toBe('NI123456')
  })

  it('pads dropped leading zeros, which people omit constantly', () => {
    expect(normaliseCompanyNumber('1234567')).toBe('01234567')
    expect(normaliseCompanyNumber('123')).toBe('00000123')
  })

  it('rejects anything that is not a company number', () => {
    expect(normaliseCompanyNumber('')).toBeNull()
    expect(normaliseCompanyNumber('not a number')).toBeNull()
    expect(normaliseCompanyNumber('123456789')).toBeNull()
    expect(normaliseCompanyNumber('ABC12345')).toBeNull()
  })
})

describe('assessing a company against what was declared', () => {
  it('flags the exact contradiction the first real application contained', () => {
    const { flags } = assessCompany(LICHFIELD, {
      legal_structure: 'Sole Trader',
      legal_entity_name: 'Litchfield vaults ltd',
      years_trading: 25,
    })

    expect(flags.some((f) => /Sole Trader/.test(f))).toBe(true)
    expect(flags.some((f) => /differs from "THE LICHFIELD VAULTS LTD"/.test(f))).toBe(true)
    expect(flags.some((f) => /25 years trading but incorporated/.test(f))).toBe(true)
  })

  it('confirms the things that were right, so evidence is recorded and not just problems', () => {
    const { confirmations } = assessCompany(LICHFIELD, {
      legal_structure: 'Limited company',
      legal_entity_name: 'THE LICHFIELD VAULTS LTD',
      years_trading: 2,
    })

    expect(confirmations).toContain('Companies House status is active')
    expect(confirmations).toContain('Declared entity name matches Companies House')
    expect(confirmations.some((c) => /56302/.test(c))).toBe(true)
  })

  it('does not flag a recent incorporation on its own', () => {
    // A pub trading 25 years and incorporated in 2023 after a buyout is
    // ordinary. Only the mismatch against a declared figure is worth raising.
    const { flags } = assessCompany(LICHFIELD, { legal_structure: 'Limited company' })
    expect(flags).toHaveLength(0)
  })

  it('flags a dissolved company', () => {
    const { flags } = assessCompany({ ...LICHFIELD, company_status: 'dissolved' }, {})
    expect(flags.some((f) => /not active/.test(f))).toBe(true)
  })

  it('flags a SIC code that is not a licensed venue', () => {
    const { flags } = assessCompany({ ...LICHFIELD, sic_codes: ['62012'] }, {})
    expect(flags.some((f) => /not a licensed-venue code/.test(f))).toBe(true)
  })
})

describe('postcode handling', () => {
  it('recognises the applicant postcode and common formats', () => {
    expect(looksLikePostcode('HR1 2LR')).toBe(true)
    expect(looksLikePostcode('hr12lr')).toBe(true)
    expect(looksLikePostcode('SW1A 1AA')).toBe(true)
    expect(looksLikePostcode('M1 1AE')).toBe(true)
  })

  it('rejects things that are not postcodes', () => {
    expect(looksLikePostcode('')).toBe(false)
    expect(looksLikePostcode('hereford')).toBe(false)
    expect(looksLikePostcode('11 church street')).toBe(false)
  })

  /**
   * The first version of this returned "County of Herefordshire" — the county,
   * not the licensing authority, and a wrong answer that looks more official
   * than the "hereford council" it was replacing. It returns the bare area now
   * and the venue confirms the council's actual name.
   */
  it('undoes the ONS inversion without inventing a council name', () => {
    expect(administrativeArea('Herefordshire, County of')).toBe('Herefordshire')
    expect(administrativeArea('Bristol, City of')).toBe('Bristol')
    expect(administrativeArea('Kingston upon Hull, City of')).toBe('Kingston upon Hull')
    expect(administrativeArea('Manchester')).toBe('Manchester')
  })

  it('never appends "Council", because no suffix rule gets them all right', () => {
    for (const area of ['Herefordshire, County of', 'Bristol, City of', 'Cheshire West and Chester']) {
      expect(administrativeArea(area)).not.toMatch(/Council/)
    }
  })
})
