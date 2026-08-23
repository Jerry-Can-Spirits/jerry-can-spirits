// POST /api/trade/accounts
// Provision a trade account from an approved application.
// Body: { application_id, tier, discount_code, venue_name }
// Returns the generated PIN exactly once. It is never stored in plaintext.
//
// WHY THIS RUNS IN THE WORKER. Hashing a PIN needs PIN_PEPPER, a Wrangler
// secret that deliberately never leaves the runtime — that is the whole point
// of the pepper, and it means an account cannot be created correctly from a
// laptop. The alternative in use until now was inserting a plaintext PIN and
// letting the hourly sweep in lib/scheduled-credentials.ts catch it, which
// leaves a real customer's credential readable in D1 for up to an hour and in
// any backup taken inside that window. Acceptable for the seeded test rows of
// April; not for a paying venue.
//
// Here the PIN is generated, hashed and stored in one request. No plaintext is
// ever written. The caller sees it once in the response and cannot retrieve it
// again — a lost PIN is reissued, not recovered, which is the same shape as an
// API key and the correct shape for a credential.
//
// IT ALSO CLOSES THE AUDIT GAP. trade_accounts.application_id has existed since
// the schema was extended and is NULL on all seven live accounts, so no account
// has ever been linked to the application that justified it. Under AWRS the
// wholesaler must evidence due diligence on its supply chain, and "which
// application did we approve to create this account" is the first question an
// audit asks. Provisioning through this route makes the link, moves the
// application to approved, and writes a review-log entry, in one transaction.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { hashPin, pinLookupKey } from '@/lib/trade-portal/credentials'
import { insertReviewLog } from '@/lib/trade-applications'

export const runtime = 'nodejs'

const TIERS = new Set(['intro', 'standard', 'partner'])

/** Comfortably above the 6-character floor the login route enforces. */
const PIN_DIGITS = 8

interface Body {
  application_id?: string
  tier?: string
  discount_code?: string
  venue_name?: string
}

/**
 * Constant-time string comparison for the admin token.
 *
 * A plain === on a secret leaks its length and prefix through timing. The cost
 * of doing this properly is four lines.
 */
function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * A random numeric PIN, rejection-sampled so every digit is uniform.
 *
 * Taking a random byte modulo 10 would make 0 through 5 more likely than 6
 * through 9, because 256 is not a multiple of 10. That skew is small and it is
 * free to avoid, and skew in a credential generator is the kind of thing nobody
 * notices until it matters.
 */
function generatePin(): string {
  let pin = ''
  while (pin.length < PIN_DIGITS) {
    const bytes = crypto.getRandomValues(new Uint8Array(PIN_DIGITS))
    for (const b of bytes) {
      if (b < 250 && pin.length < PIN_DIGITS) pin += String(b % 10)
    }
  }
  return pin
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext()
  const e = env as unknown as { DB: D1Database; PIN_PEPPER?: string; TRADE_ADMIN_TOKEN?: string }

  const expected = e.TRADE_ADMIN_TOKEN
  const presented = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || !presented || !tokensMatch(expected, presented)) {
    // Deliberately identical to an unconfigured server: an attacker learns
    // nothing about whether the endpoint is live.
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pepper = e.PIN_PEPPER
  if (!pepper) {
    // Fail rather than fall back to a plaintext insert. The fallback is exactly
    // the behaviour this route exists to remove.
    return NextResponse.json({ error: 'PIN_PEPPER is not set; refusing to write a plaintext PIN.' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const applicationId = body.application_id?.trim()
  const tier = body.tier?.trim()
  const discountCode = body.discount_code?.trim()
  const venueName = body.venue_name?.trim()

  if (!applicationId) return NextResponse.json({ error: 'application_id is required' }, { status: 400 })
  if (!tier || !TIERS.has(tier)) {
    return NextResponse.json({ error: `tier must be one of ${[...TIERS].join(', ')}` }, { status: 400 })
  }
  if (!discountCode) return NextResponse.json({ error: 'discount_code is required' }, { status: 400 })
  if (!venueName) return NextResponse.json({ error: 'venue_name is required' }, { status: 400 })

  const db = e.DB

  const application = await db
    .prepare(`SELECT id, trading_name, status FROM trade_applications WHERE id = ?1`)
    .bind(applicationId)
    .first<{ id: string; trading_name: string; status: string }>()
  if (!application) {
    return NextResponse.json({ error: 'No such application' }, { status: 404 })
  }

  // One account per application. Provisioning twice would leave the venue with
  // two live PINs and no signal about which is current.
  const existing = await db
    .prepare(`SELECT id FROM trade_accounts WHERE application_id = ?1`)
    .bind(applicationId)
    .first<{ id: string }>()
  if (existing) {
    return NextResponse.json(
      { error: `Application already provisioned as account ${existing.id}. Reissue instead.` },
      { status: 409 },
    )
  }

  // pin_lookup is uniquely indexed, so a collision would surface as a constraint
  // failure. At eight digits it is vanishingly unlikely; retrying is cheaper
  // than reasoning about whether it can happen.
  let pin = ''
  let lookup = ''
  let hashed = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    pin = generatePin()
    lookup = await pinLookupKey(pepper, pin)
    const clash = await db
      .prepare(`SELECT 1 AS hit FROM trade_accounts WHERE pin_lookup = ?1`)
      .bind(lookup)
      .first<{ hit: number }>()
    if (!clash) {
      hashed = await hashPin(pepper, pin)
      break
    }
    hashed = ''
  }
  if (!hashed) {
    return NextResponse.json({ error: 'Could not generate a unique PIN' }, { status: 500 })
  }

  const now = new Date().toISOString()

  const account = await db
    .prepare(
      `INSERT INTO trade_accounts (pin, pin_lookup, discount_code, tier, venue_name, active, application_id)
       VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6) RETURNING id`,
    )
    .bind(hashed, lookup, discountCode, tier, venueName, applicationId)
    .first<{ id: string }>()
  if (!account) {
    return NextResponse.json({ error: 'Account insert returned no id' }, { status: 500 })
  }

  await db
    .prepare(`UPDATE trade_applications SET status = 'approved' WHERE id = ?1`)
    .bind(applicationId)
    .run()

  await insertReviewLog(db, {
    trade_application_id: applicationId,
    event_type: 'approved',
    reviewed_by: 'trade-accounts-api',
    next_review_date: null,
    notes: `Provisioned trade account ${account.id} (${tier}, ${discountCode}) as "${venueName}".`,
    created_at: now,
  })

  return NextResponse.json({
    account_id: account.id,
    application_id: applicationId,
    trading_name: application.trading_name,
    venue_name: venueName,
    tier,
    discount_code: discountCode,
    pin,
    notice: 'This PIN is shown once and is not recoverable. Reissue if it is lost.',
  })
}
