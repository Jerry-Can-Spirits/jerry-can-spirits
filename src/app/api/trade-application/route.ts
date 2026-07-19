// POST /api/trade-application
// JSON body with all form fields + premisesLicenceTicket + directorIdTicket.
//
// Env vars used:
//   TRADE_DOCS                (R2 binding)
//   DB                        (D1 binding)
//   SITE_OPS                  (KV binding for rate limit + origin check)
//   KLAVIYO_PRIVATE_KEY       (existing)
//   KLAVIYO_TRADE_LIST_ID     (new — marketing opt-in target)
//   RESEND_API_KEY            (new — Resend bearer token)
//   TRADE_APPLICATIONS_EMAIL  (new — destination inbox, e.g. trade@jerrycanspirits.co.uk)
//   R2_ACCESS_KEY_ID          (new — R2 S3-compatible API)
//   R2_SECRET_ACCESS_KEY      (new)
//   R2_ACCOUNT_ID             (new)
//
// From address is hardcoded to hello@jerrycanspirits.co.uk (existing verified Resend sender).

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { emailDomainAcceptsMail } from '@/lib/email-validation'
import { detectAllowedMime, extensionForMime, type AllowedMime } from '@/lib/validators/file-magic-bytes'
import {
  validateEmail, validatePostcode, validatePhone,
  validateCompaniesHouse, validateAwrsUrn, validateVat,
  requiresPremisesLicence, requiresAwrs, requiresCompaniesHouse,
} from '@/lib/validators/trade-application'
import { insertTradeApplication, insertReviewLog, type TradeApplicationInsert } from '@/lib/trade-applications'
import { presignR2GetUrl } from '@/lib/r2-presign'
import { sendEmail, toBase64 } from '@/lib/resend'
import { generateIcs } from '@/lib/ics'

export const runtime = 'nodejs'

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'
const KLAVIYO_REVISION = '2024-10-15'
const SUBMIT_RATE_LIMIT = 3 // per hour per IP
const FROM_EMAIL = 'Jerry Can Spirits <applications@send.jerrycanspirits.co.uk>'

interface Address {
  line1: string
  line2?: string
  town: string
  county?: string
  postcode: string
}

interface Psc {
  name: string
  dob_month: number
  dob_year: number
}

interface SubmitPayload {
  // Step 1
  trading_name: string
  legal_entity_name: string
  legal_structure: string
  business_type: string
  companies_house_number?: string
  vat_number?: string
  awrs_urn?: string
  years_trading: number
  website?: string
  psc?: Psc[]
  // Step 2
  trading_address: Address
  registered_address_same: boolean
  registered_address?: Address
  premises_licence_number?: string
  licensing_authority?: string
  dps_name?: string
  personal_licence_number?: string
  premises_licence_ticket?: string
  // Step 3
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  director_name: string
  director_id_ticket: string
  // Step 4
  expected_initial_volume: string
  expected_monthly_volume: string
  payment_terms_pref: string
  how_heard?: string
  notes?: string
  declaration: boolean
  marketing_opt_in: boolean
  // Honeypot
  website_url?: string
}

function badRequest(error: string): Response {
  return NextResponse.json({ error }, { status: 400 })
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database
  const r2 = env.TRADE_DOCS as R2Bucket

  let payload: SubmitPayload
  try {
    payload = (await request.json()) as SubmitPayload
  } catch {
    return badRequest('Invalid JSON body')
  }

  // Honeypot — silently accept to avoid tipping off bots
  if (payload.website_url && payload.website_url.trim() !== '') {
    return NextResponse.json({ success: true })
  }

  // Rate limit
  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'trade-app', ip, SUBMIT_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
  }

  // --- Validate required fields ---
  const required: Array<[unknown, string]> = [
    [payload.trading_name, 'Trading name'],
    [payload.legal_entity_name, 'Legal entity name'],
    [payload.legal_structure, 'Legal structure'],
    [payload.business_type, 'Business type'],
    [payload.years_trading, 'Years trading'],
    [payload.contact_name, 'Contact name'],
    [payload.contact_role, 'Contact role'],
    [payload.contact_email, 'Contact email'],
    [payload.contact_phone, 'Contact phone'],
    [payload.director_name, 'Director name'],
    [payload.director_id_ticket, 'Director ID upload'],
    [payload.expected_initial_volume, 'Expected initial volume'],
    [payload.expected_monthly_volume, 'Expected monthly volume'],
    [payload.payment_terms_pref, 'Payment terms preference'],
  ]
  for (const [val, label] of required) {
    if (val === undefined || val === null || val === '') return badRequest(`${label} is required`)
  }
  if (!payload.declaration) return badRequest('Declaration must be accepted')

  // --- Conditional rules ---
  if (requiresCompaniesHouse(payload.legal_structure)) {
    if (!payload.companies_house_number) return badRequest('Companies House number is required for this legal structure')
    const ch = validateCompaniesHouse(payload.companies_house_number)
    if (!ch.ok) return badRequest(ch.error)
  }
  if (requiresAwrs(payload.business_type)) {
    if (!payload.awrs_urn) return badRequest('AWRS URN is required for wholesalers and distributors')
    const urn = validateAwrsUrn(payload.awrs_urn)
    if (!urn.ok) return badRequest(urn.error)
  }
  if (payload.vat_number) {
    const vat = validateVat(payload.vat_number)
    if (!vat.ok) return badRequest(vat.error)
  }
  if (requiresPremisesLicence(payload.business_type)) {
    if (!payload.premises_licence_number) return badRequest('Premises licence number is required')
    if (!payload.licensing_authority) return badRequest('Issuing local authority is required')
    if (!payload.dps_name) return badRequest('Designated Premises Supervisor is required')
    if (!payload.personal_licence_number) return badRequest('Personal licence number is required')
    if (!payload.premises_licence_ticket) return badRequest('Premises licence upload is required')
  }

  // --- Format validation ---
  const emailCheck = validateEmail(payload.contact_email)
  if (!emailCheck.ok) return badRequest(emailCheck.error)
  if (!(await emailDomainAcceptsMail(payload.contact_email))) {
    return badRequest('That email domain does not appear to accept mail.')
  }
  const phoneCheck = validatePhone(payload.contact_phone)
  if (!phoneCheck.ok) return badRequest(phoneCheck.error)

  // Addresses
  if (!payload.trading_address) return badRequest('Trading address is required')
  const tradingPc = validatePostcode(payload.trading_address.postcode)
  if (!tradingPc.ok) return badRequest(`Trading address: ${tradingPc.error}`)
  if (!payload.registered_address_same) {
    if (!payload.registered_address) return badRequest('Registered address is required')
    const regPc = validatePostcode(payload.registered_address.postcode)
    if (!regPc.ok) return badRequest(`Registered address: ${regPc.error}`)
  }

  // --- Resolve upload tickets ---
  async function resolveTicket(ticket: string): Promise<{ object: R2ObjectBody, mime: AllowedMime } | null> {
    const obj = await r2.get(`pending/${ticket}`)
    if (!obj) return null
    const buf = new Uint8Array(await obj.arrayBuffer())
    const mime = detectAllowedMime(buf)
    if (!mime) return null
    // Re-get because we consumed the body
    const fresh = await r2.get(`pending/${ticket}`)
    if (!fresh) return null
    return { object: fresh, mime }
  }

  const directorIdResolved = await resolveTicket(payload.director_id_ticket)
  if (!directorIdResolved) return badRequest('Director ID upload is invalid or expired. Please re-upload.')

  let premisesLicenceResolved: { object: R2ObjectBody, mime: AllowedMime } | null = null
  if (payload.premises_licence_ticket) {
    premisesLicenceResolved = await resolveTicket(payload.premises_licence_ticket)
    if (!premisesLicenceResolved) return badRequest('Premises licence upload is invalid or expired. Please re-upload.')
  }

  // --- Insert D1 row + move R2 objects ---
  const submittedAt = new Date()
  const submittedAtIso = submittedAt.toISOString()
  const nextReview = new Date(submittedAt)
  nextReview.setUTCFullYear(nextReview.getUTCFullYear() + 1)
  const nextReviewIso = nextReview.toISOString()

  const insert: TradeApplicationInsert = {
    trading_name: payload.trading_name.trim(),
    legal_entity_name: payload.legal_entity_name.trim(),
    legal_structure: payload.legal_structure,
    business_type: payload.business_type,
    companies_house_number: payload.companies_house_number?.trim() || null,
    vat_number: payload.vat_number?.trim() || null,
    awrs_urn: payload.awrs_urn?.trim() || null,
    years_trading: Number(payload.years_trading),
    website: payload.website?.trim() || null,
    trading_address_json: JSON.stringify(payload.trading_address),
    registered_address_json: payload.registered_address_same
      ? null
      : JSON.stringify(payload.registered_address),
    premises_licence_number: payload.premises_licence_number?.trim() || null,
    licensing_authority: payload.licensing_authority?.trim() || null,
    dps_name: payload.dps_name?.trim() || null,
    personal_licence_number: payload.personal_licence_number?.trim() || null,
    contact_name: payload.contact_name.trim(),
    contact_role: payload.contact_role.trim(),
    contact_email: payload.contact_email.trim().toLowerCase(),
    contact_phone: payload.contact_phone.trim(),
    director_name: payload.director_name.trim(),
    psc_json: payload.psc && payload.psc.length > 0 ? JSON.stringify(payload.psc) : null,
    expected_initial_volume: payload.expected_initial_volume,
    expected_monthly_volume: payload.expected_monthly_volume,
    payment_terms_pref: payload.payment_terms_pref,
    how_heard: payload.how_heard?.trim() || null,
    notes: payload.notes?.trim() || null,
    marketing_opt_in: payload.marketing_opt_in ? 1 : 0,
    submitted_at: submittedAtIso,
    next_review_date: nextReviewIso,
    ip_address: ip === 'unknown' ? null : ip,
    user_agent: request.headers.get('user-agent'),
  }

  let appId: string
  try {
    appId = await insertTradeApplication(db, insert)
    await insertReviewLog(db, {
      trade_application_id: appId,
      event_type: 'submitted',
      reviewed_by: 'system',
      next_review_date: nextReviewIso,
      notes: null,
      created_at: submittedAtIso,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application' } })
    return NextResponse.json({ error: 'We could not save your application. Please try again.' }, { status: 500 })
  }

  // Move R2 objects from pending/ to applications/{appId}/
  async function moveTicket(ticket: string, name: string, mime: AllowedMime): Promise<string> {
    const sourceKey = `pending/${ticket}`
    const targetKey = `applications/${appId}/${name}.${extensionForMime(mime)}`
    const src = await r2.get(sourceKey)
    if (!src) throw new Error(`pending object ${sourceKey} disappeared`)
    await r2.put(targetKey, src.body, {
      httpMetadata: { contentType: mime },
      customMetadata: { ...(src.customMetadata ?? {}), applicationId: appId },
    })
    await r2.delete(sourceKey)
    return targetKey
  }

  let directorIdKey: string
  let premisesLicenceKey: string | null = null
  try {
    directorIdKey = await moveTicket(payload.director_id_ticket, 'director-id', directorIdResolved.mime)
    if (premisesLicenceResolved) {
      premisesLicenceKey = await moveTicket(payload.premises_licence_ticket!, 'premises-licence', premisesLicenceResolved.mime)
    }
  } catch (err) {
    // Roll back: best-effort delete of any partial uploads under this appId
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'r2-move' } })
    try {
      const list = await r2.list({ prefix: `applications/${appId}/` })
      await Promise.all(list.objects.map((o) => r2.delete(o.key)))
    } catch { /* swallow rollback failures */ }
    // Also roll back the D1 rows: without this, a failed upload leaves an orphan
    // application with zero documents in the register, and the applicant's retry
    // creates a duplicate row. Delete the review_log child first (FK), then the
    // application. Best-effort — a rollback failure is reported, not thrown.
    try {
      await db.prepare('DELETE FROM trade_application_review_log WHERE trade_application_id = ?').bind(appId).run()
      await db.prepare('DELETE FROM trade_applications WHERE id = ?').bind(appId).run()
    } catch (rollbackErr) {
      Sentry.captureException(rollbackErr, { tags: { route: 'trade-application', phase: 'd1-rollback' } })
    }
    return NextResponse.json({ error: 'Upload could not be finalised. Please try again.' }, { status: 500 })
  }

  // --- Presign download URLs (7 days) ---
  const expires = 7 * 24 * 3600
  let directorIdUrl = ''
  let premisesLicenceUrl: string | null = null
  try {
    directorIdUrl = await presignR2GetUrl({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: 'jerry-can-spirits-trade-docs',
      key: directorIdKey,
      expiresInSeconds: expires,
    })
    if (premisesLicenceKey) {
      premisesLicenceUrl = await presignR2GetUrl({
        accountId: env.R2_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: 'jerry-can-spirits-trade-docs',
        key: premisesLicenceKey,
        expiresInSeconds: expires,
      })
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'r2-presign' } })
    // Continue without URLs — admin email will include the application ID; founder can pull files manually
  }

  // --- Generate .ics ---
  // Organizer is the system sender address; attendee is the reviewer's inbox.
  // Distinct addresses make Outlook/Apple Mail render an inline Accept button.
  const ics = generateIcs({
    startUtc: nextReview,
    title: `Yearly trade review: ${payload.trading_name}`,
    description: `Trade application ${appId}\nContact: ${payload.contact_name} <${payload.contact_email}>\nBusiness type: ${payload.business_type}`,
    uid: appId,
    organizerEmail: 'applications@send.jerrycanspirits.co.uk',
    attendeeEmail: env.TRADE_APPLICATIONS_EMAIL,
  })

  // --- Admin email ---
  const html = renderAdminEmailHtml({
    applicationId: appId,
    payload,
    submittedAt: submittedAtIso,
    nextReview: nextReviewIso,
    directorIdUrl,
    premisesLicenceUrl,
    urlExpiry: new Date(Date.now() + expires * 1000).toISOString(),
  })
  const text = renderAdminEmailText({
    applicationId: appId,
    payload,
    submittedAt: submittedAtIso,
    nextReview: nextReviewIso,
    directorIdUrl,
    premisesLicenceUrl,
  })

  try {
    const result = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: FROM_EMAIL,
      to: env.TRADE_APPLICATIONS_EMAIL,
      replyTo: payload.contact_email,
      subject: `Trade Application: ${payload.trading_name} (${payload.business_type})`,
      html,
      text,
      attachments: [
        {
          filename: `trade-review-${appId}.ics`,
          content: toBase64(ics),
          contentType: 'text/calendar; method=REQUEST; charset=utf-8',
        },
      ],
    })
    if (!result.ok) {
      Sentry.captureMessage(`Resend send failed: ${result.error}`, { tags: { route: 'trade-application' } })
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'resend' } })
  }

  // --- Klaviyo event (non-sensitive props only) ---
  try {
    await fireKlaviyoEvent({
      apiKey: env.KLAVIYO_PRIVATE_KEY,
      contactEmail: payload.contact_email.toLowerCase(),
      contactName: payload.contact_name,
      tradingName: payload.trading_name,
      businessType: payload.business_type,
      expectedInitial: payload.expected_initial_volume,
      expectedMonthly: payload.expected_monthly_volume,
      applicationId: appId,
      submissionDate: submittedAtIso,
      marketingOptIn: payload.marketing_opt_in,
      listId: env.KLAVIYO_TRADE_LIST_ID,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'klaviyo' } })
  }

  return NextResponse.json({ success: true, applicationId: appId })
}

// ── Email rendering ──────────────────────────────────────────────────

interface EmailRenderArgs {
  applicationId: string
  payload: SubmitPayload
  submittedAt: string
  nextReview: string
  directorIdUrl: string
  premisesLicenceUrl: string | null
  urlExpiry?: string
}

function row(label: string, value: string | number | null | undefined): string {
  const v = value === null || value === undefined || value === '' ? '—' : String(value)
  return `<tr><td style="padding:4px 12px 4px 0;color:#5a6168;vertical-align:top">${label}</td><td style="padding:4px 0;color:#0a0a0a">${escapeHtml(v)}</td></tr>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderAdminEmailHtml(args: EmailRenderArgs): string {
  const p = args.payload
  const addr = p.trading_address
  const regAddr = p.registered_address_same ? null : p.registered_address
  const psc = p.psc ?? []
  const fileLinks: string[] = []
  if (args.directorIdUrl) fileLinks.push(`<a href="${args.directorIdUrl}">Download director ID</a>`)
  if (args.premisesLicenceUrl) fileLinks.push(`<a href="${args.premisesLicenceUrl}">Download premises licence</a>`)
  const linksHtml = fileLinks.length > 0
    ? `<p style="margin:12px 0">${fileLinks.join(' &nbsp;·&nbsp; ')}<br/><small style="color:#5a6168">Links expire ${args.urlExpiry?.split('T')[0] ?? 'in 7 days'}</small></p>`
    : '<p style="margin:12px 0;color:#a00">File download links could not be generated. Pull files manually from R2 under applications/' + args.applicationId + '/</p>'

  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;color:#0a0a0a;max-width:680px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 8px">Trade Application: ${escapeHtml(p.trading_name)}</h1>
<p style="color:#5a6168;margin:0 0 16px">Application ID: <code>${args.applicationId}</code> · Submitted ${args.submittedAt} · Next review ${args.nextReview.split('T')[0]}</p>
${linksHtml}
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 1 — Business & Ownership</h2>
<table style="border-collapse:collapse;width:100%">
${row('Trading name', p.trading_name)}
${row('Legal entity', p.legal_entity_name)}
${row('Legal structure', p.legal_structure)}
${row('Business type', p.business_type)}
${row('Companies House', p.companies_house_number)}
${row('VAT number', p.vat_number)}
${row('AWRS URN', p.awrs_urn)}
${row('Years trading', p.years_trading)}
${row('Website', p.website)}
${psc.map((person, i) => row(`PSC ${i + 1}`, `${person.name} (DOB ${person.dob_month}/${person.dob_year})`)).join('')}
</table>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 2 — Premises & Licensing</h2>
<table style="border-collapse:collapse;width:100%">
${row('Trading address', `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.town}${addr.county ? ', ' + addr.county : ''}, ${addr.postcode}`)}
${regAddr ? row('Registered address', `${regAddr.line1}${regAddr.line2 ? ', ' + regAddr.line2 : ''}, ${regAddr.town}${regAddr.county ? ', ' + regAddr.county : ''}, ${regAddr.postcode}`) : row('Registered address', 'Same as trading')}
${row('Premises licence #', p.premises_licence_number)}
${row('Issuing authority', p.licensing_authority)}
${row('DPS', p.dps_name)}
${row('Personal licence #', p.personal_licence_number)}
</table>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 3 — Contact & Director</h2>
<table style="border-collapse:collapse;width:100%">
${row('Contact', `${p.contact_name} (${p.contact_role})`)}
${row('Email', p.contact_email)}
${row('Phone', p.contact_phone)}
${row('Director / owner', p.director_name)}
</table>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 4 — Order Intent</h2>
<table style="border-collapse:collapse;width:100%">
${row('Initial volume', p.expected_initial_volume)}
${row('Monthly volume', p.expected_monthly_volume)}
${row('Payment terms', p.payment_terms_pref)}
${row('How heard', p.how_heard)}
${row('Notes', p.notes)}
${row('Marketing opt-in', p.marketing_opt_in ? 'Yes' : 'No')}
</table>
<p style="color:#5a6168;font-size:12px;margin:24px 0 0">Reply directly to this email to respond to the applicant.</p>
</body></html>`
}

function renderAdminEmailText(args: EmailRenderArgs): string {
  const p = args.payload
  const lines: string[] = [
    `Trade Application: ${p.trading_name}`,
    `Application ID: ${args.applicationId}`,
    `Submitted: ${args.submittedAt}`,
    `Next review: ${args.nextReview.split('T')[0]}`,
    '',
    `Director ID: ${args.directorIdUrl || 'link unavailable — pull from R2'}`,
    args.premisesLicenceUrl ? `Premises licence: ${args.premisesLicenceUrl}` : '',
    '',
    '— Business —',
    `Trading: ${p.trading_name}`,
    `Legal entity: ${p.legal_entity_name} (${p.legal_structure})`,
    `Business type: ${p.business_type}`,
    `Companies House: ${p.companies_house_number ?? '—'}`,
    `VAT: ${p.vat_number ?? '—'}`,
    `AWRS URN: ${p.awrs_urn ?? '—'}`,
    `Years trading: ${p.years_trading}`,
    '',
    '— Contact —',
    `${p.contact_name} (${p.contact_role}) · ${p.contact_email} · ${p.contact_phone}`,
    `Director: ${p.director_name}`,
    '',
    '— Order intent —',
    `Initial: ${p.expected_initial_volume} · Monthly: ${p.expected_monthly_volume} · Terms: ${p.payment_terms_pref}`,
    `How heard: ${p.how_heard ?? '—'}`,
    `Notes: ${p.notes ?? '—'}`,
    `Marketing opt-in: ${p.marketing_opt_in ? 'Yes' : 'No'}`,
  ]
  return lines.filter(Boolean).join('\n')
}

// ── Klaviyo ──────────────────────────────────────────────────────────

async function fireKlaviyoEvent(args: {
  apiKey: string
  contactEmail: string
  contactName: string
  tradingName: string
  businessType: string
  expectedInitial: string
  expectedMonthly: string
  applicationId: string
  submissionDate: string
  marketingOptIn: boolean
  listId: string
}): Promise<void> {
  const commonHeaders = {
    Authorization: `Klaviyo-API-Key ${args.apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    revision: KLAVIYO_REVISION,
  }

  // 1. Create or find the profile
  const profilePayload = {
    data: {
      type: 'profile',
      attributes: {
        email: args.contactEmail,
        first_name: args.contactName.split(' ')[0],
        last_name: args.contactName.split(' ').slice(1).join(' ') || '',
        properties: {
          last_contact_date: args.submissionDate,
          last_contact_type: 'trade_application',
        },
      },
    },
  }

  let profileId: string | undefined
  const createRes = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(profilePayload),
  })
  if (createRes.ok) {
    const data = await createRes.json() as { data?: { id?: string } }
    profileId = data.data?.id
  } else if (createRes.status === 409) {
    if (/^[A-Za-z0-9.@_+-]+$/.test(args.contactEmail)) {
      const filter = encodeURIComponent(`equals(email,"${args.contactEmail}")`)
      const searchRes = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
        headers: commonHeaders as Record<string, string>,
      })
      if (searchRes.ok) {
        const data = await searchRes.json() as { data?: { id?: string }[] }
        profileId = data.data?.[0]?.id
      }
    }
  } else {
    throw new Error(`Klaviyo profile create failed: ${createRes.status}`)
  }

  // 2. Fire the event
  const eventPayload = {
    data: {
      type: 'event',
      attributes: {
        properties: {
          trading_name: args.tradingName,
          business_type: args.businessType,
          contact_name: args.contactName,
          expected_initial_volume: args.expectedInitial,
          expected_monthly_volume: args.expectedMonthly,
          application_id: args.applicationId,
          submission_date: args.submissionDate,
        },
        metric: { data: { type: 'metric', attributes: { name: 'Trade Application Submitted' } } },
        profile: { data: { type: 'profile', attributes: { email: args.contactEmail } } },
      },
    },
  }
  await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(eventPayload),
  })

  // 3. Subscribe to trade list if opted in
  if (args.marketingOptIn && profileId && args.listId) {
    await fetch(`${KLAVIYO_API_BASE}/lists/${args.listId}/relationships/profiles/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({ data: [{ type: 'profile', id: profileId }] }),
    })
  }
}
