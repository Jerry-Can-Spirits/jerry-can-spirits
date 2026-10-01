// POST /api/trade/accounts/rotate-code
// Body: { account_id, discount?: { percent } | { case_price_inc_vat } }
// Mints the venue its own Shopify code and points the account at it. The PIN
// does not change; the venue notices nothing.
//
// Two reasons to call it. A code has leaked, or is suspected to have, and the
// venue needs a fresh one with the old one dead. Or an account is still on a
// shared or hand-made code (TRADE10, TRADE15, TRADECASE150) and should be on
// its own, which is how the first four accounts moved over on 1 Oct 2026.
//
// With no `discount` in the body the account's stored rule is reused, so a
// rotation keeps the deal. With one, the deal changes too. The old code is
// deactivated in Shopify unless another account still carries it, which is
// what makes the shared codes safe to migrate one venue at a time.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { insertReviewLog } from '@/lib/trade-applications'
import { pushApplicationToSharePoint } from '@/lib/sharepoint/push'
import type { GraphEnv } from '@/lib/sharepoint/graph'
import { getTradeProducts } from '@/lib/trade-products'
import { ruleForAccount } from '@/lib/trade-portal/product-data'
import {
  deactivateTradeDiscountCode,
  mintTradeDiscountCode,
  specFromRequest,
  specToColumns,
  variantIdsFor,
  venueCodeFor,
  type DiscountRequest,
  type DiscountSpec,
} from '@/lib/trade-portal/discount-codes'

export const runtime = 'nodejs'

function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

interface AccountRow {
  id: string
  venue_name: string
  application_id: string | null
  discount_code: string
  discount_kind: string | null
  discount_value: number | null
  discount_handles: string | null
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext()
  const e = env as unknown as { DB: D1Database; TRADE_ADMIN_TOKEN?: string; SHOPIFY_ADMIN_API_TOKEN?: string }

  const expected = e.TRADE_ADMIN_TOKEN
  const presented = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || !presented || !tokensMatch(expected, presented)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!e.SHOPIFY_ADMIN_API_TOKEN) {
    return NextResponse.json({ error: 'SHOPIFY_ADMIN_API_TOKEN is not set' }, { status: 503 })
  }

  let body: { account_id?: string; discount?: DiscountRequest }
  try {
    body = (await request.json()) as { account_id?: string; discount?: DiscountRequest }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const accountId = body.account_id?.trim()
  if (!accountId) return NextResponse.json({ error: 'account_id is required' }, { status: 400 })

  const db = e.DB
  const account = await db
    .prepare(
      `SELECT id, venue_name, application_id, discount_code, discount_kind, discount_value, discount_handles
       FROM trade_accounts WHERE id = ?1 AND active = 1`,
    )
    .bind(accountId)
    .first<AccountRow>()
  if (!account) return NextResponse.json({ error: 'No such active account' }, { status: 404 })

  // The deal: the request's, or the one already on the row.
  let spec: DiscountSpec
  let products: Awaited<ReturnType<typeof getTradeProducts>>
  if (body.discount) {
    const parsed = await specFromRequest(body.discount)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    ;({ spec, products } = parsed)
  } else {
    const rule = ruleForAccount(account)
    if (!rule) {
      return NextResponse.json({ error: 'Account has no stored rule; pass discount: {percent} or {case_price_inc_vat}' }, { status: 400 })
    }
    spec = rule.kind === 'percent' ? { kind: 'percent', percent: rule.percent } : { kind: 'amountOff', pencePerItem: rule.pencePerItem, handles: [...rule.handles] }
    products = await getTradeProducts()
  }

  let minted: { code: string; id: string }
  try {
    minted = await mintTradeDiscountCode(
      e.SHOPIFY_ADMIN_API_TOKEN,
      venueCodeFor(account.venue_name),
      spec,
      variantIdsFor(spec, products),
    )
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 })
  }

  const columns = specToColumns(spec)
  await db
    .prepare(
      `UPDATE trade_accounts SET discount_code = ?1, discount_kind = ?2, discount_value = ?3, discount_handles = ?4 WHERE id = ?5`,
    )
    .bind(minted.code, columns.kind, columns.value, columns.handles, accountId)
    .run()

  // Kill the old code only if nobody else is on it. TRADE10 stays live while
  // any account still carries it.
  const oldCode = account.discount_code
  let oldDeactivated = false
  const others = await db
    .prepare(`SELECT COUNT(*) AS n FROM trade_accounts WHERE discount_code = ?1 AND active = 1 AND id != ?2`)
    .bind(oldCode, accountId)
    .first<{ n: number }>()
  if (oldCode !== minted.code && (others?.n ?? 0) === 0) {
    try {
      oldDeactivated = await deactivateTradeDiscountCode(e.SHOPIFY_ADMIN_API_TOKEN, oldCode)
    } catch (err) {
      console.error('[trade] could not deactivate old code %s:', oldCode, err)
    }
  }

  if (account.application_id) {
    await insertReviewLog(db, {
      trade_application_id: account.application_id,
      event_type: 'code_rotated',
      reviewed_by: 'trade-accounts-api',
      next_review_date: null,
      notes: `Discount code ${oldCode} -> ${minted.code}${oldDeactivated ? ` (${oldCode} deactivated)` : ''}.`,
      created_at: new Date().toISOString(),
    })
    await pushApplicationToSharePoint(db, env as unknown as GraphEnv, env.SITE_OPS as KVNamespace, account.application_id)
  }

  return NextResponse.json({
    account_id: accountId,
    venue_name: account.venue_name,
    old_code: oldCode,
    old_code_deactivated: oldDeactivated,
    new_code: minted.code,
    rule: spec,
  })
}
