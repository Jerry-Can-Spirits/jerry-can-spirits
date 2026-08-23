// GET /api/trade/lookup?company=15137252
// GET /api/trade/lookup?postcode=HR1+2LR
//
// Lookups for the application form, so a venue is helped while typing rather
// than corrected afterwards.
//
// WHY THIS EXISTS SEPARATELY FROM THE SUBMISSION CHECKS. The verification in
// lib/verification/store.ts runs after submit and writes evidence. That catches
// bad data; it does not prevent it. The first real application declared "Sole
// Trader" for a registered company and "hereford council" for Herefordshire,
// and both would have been answered by a lookup at the moment of typing.
//
// WHY IT IS A PROXY RATHER THAN A DIRECT CALL. The Companies House key is a
// server secret and must never reach a browser. postcodes.io needs no key and
// could be called directly from the page, but routing both through one endpoint
// keeps the origin and rate-limit policy in a single place rather than half in
// the client.
//
// WHAT IT DELIBERATELY DOES NOT DO. It does not decide anything. It returns
// what the source says and the form offers it as a suggestion the venue can
// overwrite. A lookup that silently rewrote someone's answer would replace one
// kind of wrong data with another kind nobody had agreed to.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { lookupCompany } from '@/lib/verification/companies-house'
import { lookupPostcode, administrativeArea } from '@/lib/verification/postcode'

export const runtime = 'nodejs'

// Generous for someone filling in a form, tight enough that the endpoint is not
// a free Companies House proxy for anyone who finds it.
const LOOKUP_RATE_LIMIT = 40 // per hour per IP

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const e = env as unknown as { COMPANIES_HOUSE_API_KEY?: string }

  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown')
    .split(',')[0]
    .trim()
  if (await isRateLimited(kv, 'trade-lookup', ip, LOOKUP_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many lookups. Please try again later.' }, { status: 429 })
  }

  const url = new URL(request.url)
  const company = url.searchParams.get('company')
  const postcode = url.searchParams.get('postcode')

  if (postcode) {
    const result = await lookupPostcode(postcode)
    if (result.outcome !== 'match') {
      return NextResponse.json({ found: false }, { status: 200 })
    }
    return NextResponse.json({
      found: true,
      area: administrativeArea(result.record.admin_district),
      admin_district: result.record.admin_district,
    })
  }

  if (company) {
    if (!e.COMPANIES_HOUSE_API_KEY) {
      // Not an error the applicant can do anything about, and not a reason to
      // stop them typing. The form falls back to manual entry.
      return NextResponse.json({ found: false }, { status: 200 })
    }
    const result = await lookupCompany(e.COMPANIES_HOUSE_API_KEY, company)
    if (result.outcome !== 'match') {
      return NextResponse.json({ found: false }, { status: 200 })
    }
    return NextResponse.json({
      found: true,
      company_number: result.company.company_number,
      company_name: result.company.company_name,
      company_status: result.company.company_status,
      date_of_creation: result.company.date_of_creation,
      registered_office_address: result.company.registered_office_address,
    })
  }

  return NextResponse.json({ error: 'Pass either company or postcode' }, { status: 400 })
}
