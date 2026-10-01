// Trade orders: attribute a Shopify order to a trade account, record it, and
// keep the Customer Register's order columns current.
//
// The register (SharePoint) carries first and last order dates, an order
// count, a lifetime total and a last-twelve-months value per venue. They were
// typed in by hand, which works for four venues and not for fifty (Dan, 1 Oct
// 2026). Now the orders/create webhook calls syncTradeOrder, which finds the
// account behind the order, stores one row in trade_orders (migration 0078)
// and pushes the aggregate to the venue's register row. A daily cron calls
// refreshTradeOrderStats so the twelve-month figure decays on its own.
//
// Money is pence ex VAT, after discount, before shipping: the number a venue
// compares with its other suppliers. Shopify's subtotal_price is after line
// discounts and before shipping but, with UK tax-inclusive pricing, includes
// VAT; each line carries its own tax_lines, so the ex-VAT figure is subtotal
// minus the sum of line tax. If a payload has no tax lines (a test order, an
// old export) the fallback divides by 1.2, which is right for everything the
// trade catalogue sells.

import * as Sentry from '@sentry/nextjs'
import type { ShopifyOrder } from '@/lib/shopify-webhooks'
import { countBottles } from '@/lib/product-formats'
import { graphConfigured, type GraphEnv } from '@/lib/sharepoint/graph'
import { pushTradeOrderStats, type TradeOrderStats } from '@/lib/sharepoint/trade-list'

/** The cart attribute the trade checkout stamps. The underscore hides it from the customer at checkout. */
export const TRADE_ACCOUNT_ATTRIBUTE = '_trade_account_id'

const VAT_DIVISOR = 1.2
const YEAR_MS = 365 * 24 * 60 * 60 * 1000

export interface TradeAttribution {
  accountId: string
  applicationId: string | null
  by: 'attribute' | 'discount_code' | 'email'
}

function toPence(amount: string | number | undefined): number {
  const n = typeof amount === 'number' ? amount : parseFloat(amount ?? '')
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** The trade account id the checkout stamped on the cart, if any. */
export function tradeAccountIdFromAttributes(order: Pick<ShopifyOrder, 'note_attributes'>): string | null {
  const hit = order.note_attributes?.find((a) => a.name === TRADE_ACCOUNT_ATTRIBUTE)
  const value = hit?.value?.trim()
  return value ? value : null
}

/** Pence ex VAT, after discount, before shipping. */
export function exVatSubtotalPence(order: Pick<ShopifyOrder, 'subtotal_price' | 'line_items'>): number {
  const subtotal = toPence(order.subtotal_price)
  if (subtotal <= 0) return 0
  let tax = 0
  let sawTaxLines = false
  for (const li of order.line_items) {
    if (!li.tax_lines) continue
    sawTaxLines = true
    for (const t of li.tax_lines) tax += toPence(t.price)
  }
  return sawTaxLines ? Math.max(0, subtotal - tax) : Math.round(subtotal / VAT_DIVISOR)
}

/**
 * Which trade account placed this order.
 *
 * The cart attribute is the key and wins when present. Without it, the order
 * is matched by discount code, then by email, each only when exactly one
 * active account fits: TRADE10 is shared, so it never matches on code, and a
 * shared match would credit the wrong venue, which is worse than none.
 *
 * Email matters more than it looks. The first day's orders showed venues
 * typing their code into the public shop rather than using the portal, which
 * leaves no stamp; the order email against the application's contact email
 * is then the only thing that says whose order it was.
 */
export async function attributeTradeOrder(
  db: D1Database,
  order: Pick<ShopifyOrder, 'note_attributes' | 'discount_codes' | 'email'>,
): Promise<TradeAttribution | null> {
  const stamped = tradeAccountIdFromAttributes(order)
  if (stamped) {
    const row = await db
      .prepare(`SELECT id, application_id FROM trade_accounts WHERE id = ?1`)
      .bind(stamped)
      .first<{ id: string; application_id: string | null }>()
    if (row) return { accountId: row.id, applicationId: row.application_id, by: 'attribute' }
  }
  for (const d of order.discount_codes ?? []) {
    const code = d.code?.trim()
    if (!code) continue
    const rows = await db
      .prepare(`SELECT id, application_id FROM trade_accounts WHERE discount_code = ?1 AND active = 1`)
      .bind(code)
      .all<{ id: string; application_id: string | null }>()
    const matches = rows.results ?? []
    if (matches.length === 1) return { accountId: matches[0].id, applicationId: matches[0].application_id, by: 'discount_code' }
  }
  const email = order.email?.trim().toLowerCase()
  if (email) {
    const rows = await db
      .prepare(
        `SELECT a.id, a.application_id FROM trade_accounts a
         JOIN trade_applications p ON p.id = a.application_id
         WHERE a.active = 1 AND lower(p.contact_email) = ?1`,
      )
      .bind(email)
      .all<{ id: string; application_id: string | null }>()
    const matches = rows.results ?? []
    if (matches.length === 1) return { accountId: matches[0].id, applicationId: matches[0].application_id, by: 'email' }
  }
  return null
}

/** Store the order once. A retry or a duplicate delivery is a no-op. */
export async function recordTradeOrder(
  db: D1Database,
  order: ShopifyOrder,
  attribution: TradeAttribution,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO trade_orders (order_id, order_number, trade_account_id, application_id, created_at, ex_vat_p, bottles, attributed_by)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(order_id) DO NOTHING`,
    )
    .bind(
      String(order.id),
      order.order_number,
      attribution.accountId,
      attribution.applicationId,
      order.created_at,
      exVatSubtotalPence(order),
      countBottles(order.line_items),
      attribution.by,
    )
    .run()
}

interface OrderRow {
  created_at: string
  ex_vat_p: number
}

/** The register's numbers for one account, from its stored orders. */
export function statsFromRows(rows: OrderRow[], now: Date = new Date()): TradeOrderStats | null {
  if (rows.length === 0) return null
  const cutoff = now.getTime() - YEAR_MS
  let total = 0
  let last12 = 0
  let first = rows[0].created_at
  let last = rows[0].created_at
  for (const r of rows) {
    total += r.ex_vat_p
    const t = new Date(r.created_at).getTime()
    if (t >= cutoff) last12 += r.ex_vat_p
    if (r.created_at < first) first = r.created_at
    if (r.created_at > last) last = r.created_at
  }
  return {
    orderCount: rows.length,
    totalExVatP: total,
    last12MonthsExVatP: last12,
    firstOrderAt: first,
    lastOrderAt: last,
  }
}

async function statsFor(db: D1Database, accountId: string): Promise<TradeOrderStats | null> {
  const rows = await db
    .prepare(`SELECT created_at, ex_vat_p FROM trade_orders WHERE trade_account_id = ?1`)
    .bind(accountId)
    .all<OrderRow>()
  return statsFromRows(rows.results ?? [])
}

interface OrdersEnv extends GraphEnv {
  DB: D1Database
  SITE_OPS: KVNamespace
}

/**
 * Called from the orders/create webhook after the idempotency guard. Never
 * throws: a register that lags one order is reconciled by the daily refresh,
 * and a venue's order must not fail because Microsoft is having an afternoon.
 */
export async function syncTradeOrder(env: OrdersEnv, order: ShopifyOrder): Promise<void> {
  try {
    const attribution = await attributeTradeOrder(env.DB, order)
    if (!attribution) return
    await recordTradeOrder(env.DB, order, attribution)
    console.log(
      `[trade-orders] order #${order.order_number} -> account ${attribution.accountId} (by ${attribution.by})`,
    )
    if (!attribution.applicationId || !graphConfigured(env)) return
    const stats = await statsFor(env.DB, attribution.accountId)
    if (stats) await pushTradeOrderStats(env, env.SITE_OPS, attribution.applicationId, stats)
  } catch (err) {
    console.error('[trade-orders] sync failed for order #%s (non-fatal):', order.order_number, err)
    Sentry.captureException(err, { tags: { integration: 'sharepoint', phase: 'trade-order-sync' } })
  }
}

/**
 * Daily: recompute every ordering account's figures and push them, so the
 * twelve-month value falls as orders age out, not only when a new one lands.
 */
export async function refreshTradeOrderStats(
  env: OrdersEnv,
): Promise<{ accounts: number; updated: number; failed: string[] }> {
  const summary = { accounts: 0, updated: 0, failed: [] as string[] }
  if (!graphConfigured(env)) return summary
  const accounts = await env.DB.prepare(
    `SELECT DISTINCT a.id, a.application_id FROM trade_orders o JOIN trade_accounts a ON a.id = o.trade_account_id WHERE a.application_id IS NOT NULL`,
  ).all<{ id: string; application_id: string }>()
  for (const a of accounts.results ?? []) {
    summary.accounts++
    try {
      const stats = await statsFor(env.DB, a.id)
      if (stats) {
        const r = await pushTradeOrderStats(env, env.SITE_OPS, a.application_id, stats)
        if (r.updated) summary.updated++
      }
    } catch (err) {
      summary.failed.push(a.id)
      console.error('[trade-orders] refresh failed for account %s:', a.id, err)
      Sentry.captureException(err, { tags: { integration: 'sharepoint', phase: 'trade-order-refresh' } })
    }
  }
  return summary
}
