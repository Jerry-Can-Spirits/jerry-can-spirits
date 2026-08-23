// POST /api/trade/accounts/reissue
// Body: { account_id }
// Returns a new PIN exactly once. The old one stops working immediately.
//
// WHY THIS EXISTS. The provisioning route tells the caller "This PIN is shown
// once and is not recoverable. Reissue if it is lost." — and until now there
// was no reissue. An error message promising a capability that does not exist
// is worse than saying nothing: the first time a venue rings up having lost
// their PIN, the only route would have been hand-written SQL against
// production, which is exactly the situation the provisioning route was built
// to remove.
//
// Reissue rather than recovery is the correct shape. The stored value is a
// peppered PBKDF2 hash and cannot be reversed, which is the point of storing it
// that way. Anyone offering to tell a venue their existing PIN would be
// admitting it was never hashed properly.
//
// The old PIN dies the moment this runs. That is deliberate: a lost credential
// is a credential of unknown whereabouts, and leaving it live during a grace
// period would keep whoever found it logged in.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { hashPin, pinLookupKey } from '@/lib/trade-portal/credentials'
import { insertReviewLog } from '@/lib/trade-applications'
import { pushApplicationToSharePoint } from '@/lib/sharepoint/push'
import type { GraphEnv } from '@/lib/sharepoint/graph'

export const runtime = 'nodejs'

const PIN_DIGITS = 8

function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Rejection-sampled so every digit is uniform; see the provisioning route. */
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pepper = e.PIN_PEPPER
  if (!pepper) {
    return NextResponse.json({ error: 'PIN_PEPPER is not set; refusing to write a plaintext PIN.' }, { status: 503 })
  }

  let body: { account_id?: string }
  try {
    body = (await request.json()) as { account_id?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const accountId = body.account_id?.trim()
  if (!accountId) return NextResponse.json({ error: 'account_id is required' }, { status: 400 })

  const db = e.DB
  const account = await db
    .prepare(`SELECT id, venue_name, application_id, active FROM trade_accounts WHERE id = ?1`)
    .bind(accountId)
    .first<{ id: string; venue_name: string; application_id: string | null; active: number }>()
  if (!account) return NextResponse.json({ error: 'No such account' }, { status: 404 })

  let pin = ''
  let lookup = ''
  let hashed = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    pin = generatePin()
    lookup = await pinLookupKey(pepper, pin)
    const clash = await db
      .prepare(`SELECT 1 AS hit FROM trade_accounts WHERE pin_lookup = ?1 AND id != ?2`)
      .bind(lookup, accountId)
      .first<{ hit: number }>()
    if (!clash) {
      hashed = await hashPin(pepper, pin)
      break
    }
    hashed = ''
  }
  if (!hashed) return NextResponse.json({ error: 'Could not generate a unique PIN' }, { status: 500 })

  await db
    .prepare(`UPDATE trade_accounts SET pin = ?1, pin_lookup = ?2 WHERE id = ?3`)
    .bind(hashed, lookup, accountId)
    .run()

  // Recorded against the application where there is one, so the audit trail
  // shows a credential changing hands rather than a silent update.
  if (account.application_id) {
    await insertReviewLog(db, {
      trade_application_id: account.application_id,
      event_type: 'pin_reissued',
      reviewed_by: 'trade-accounts-api',
      next_review_date: null,
      notes: `PIN reissued for account ${accountId} ("${account.venue_name}"). The previous PIN stopped working at this point.`,
      created_at: new Date().toISOString(),
    })
  }

  if (account.application_id) {
    await pushApplicationToSharePoint(db, e as GraphEnv, env.SITE_OPS as KVNamespace, account.application_id)
  }

  return NextResponse.json({
    account_id: accountId,
    venue_name: account.venue_name,
    active: account.active === 1,
    pin,
    notice: 'The previous PIN no longer works. This one is shown once and is not recoverable.',
  })
}
