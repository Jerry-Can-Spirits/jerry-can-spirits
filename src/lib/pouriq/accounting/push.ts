// Best-effort push of one committed invoice to the venue's accounting
// connection, plus the hourly retry sweep. A failed push NEVER fails the
// commit: the invoice is already safely in Pour IQ; this is downstream
// bookkeeping. Auth failures are never auto-retried in a loop (Intuit
// questionnaire commitment) — they land in the retry queue for the sweep
// or the per-invoice Retry action after the venue reconnects.

import * as Sentry from '@sentry/nextjs'
import { buildBill, needsTokenRefresh, type BillInvoiceHeader, type BillInvoiceLine } from './bill-builder'
import {
  isConnectionReady, listAccountingConnections,
  markAccountingPushError, markAccountingPushSuccess, updateAccountingTokens,
} from './connections'
import { getPushForInvoiceProvider, recordPushResult } from './pushes'
import { getAccountingAdapter, type AccountingProvidersEnv } from './providers'
import type { AccountingAdapter, AccountingConnection } from './types'

const SWEEP_BATCH_LIMIT = 25

async function ensureFreshToken(
  db: D1Database,
  adapter: AccountingAdapter,
  conn: AccountingConnection,
): Promise<AccountingConnection> {
  if (!needsTokenRefresh(conn.token_expires_at, Date.now())) return conn
  if (!conn.refresh_token) throw new Error('No refresh token; reconnect required')
  const tokens = await adapter.refreshAccessToken(conn.refresh_token)
  await updateAccountingTokens(db, conn.id, tokens)
  return {
    ...conn,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? conn.refresh_token,
    token_expires_at: tokens.expiresAt,
  }
}

export async function pushInvoiceToAccounting(
  db: D1Database,
  env: AccountingProvidersEnv,
  tradeAccountId: string,
  invoiceId: string,
): Promise<void> {
  let conn: AccountingConnection | null = null
  try {
    const connections = await listAccountingConnections(db, tradeAccountId)
    conn = connections.find(isConnectionReady) ?? null
    if (!conn) return

    const existing = await getPushForInvoiceProvider(db, invoiceId, conn.provider)
    if (existing?.status === 'pushed') return

    const adapter = getAccountingAdapter(conn.provider, env)
    if (!adapter) return

    const invoice = await db
      .prepare(`SELECT supplier_name, invoice_number, invoice_date, created_at, prices_include_vat
                FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
      .bind(invoiceId, tradeAccountId)
      .first<BillInvoiceHeader>()
    if (!invoice) return
    const lines = await db
      .prepare(`SELECT extracted_name, extracted_quantity, extracted_unit_price_p, extracted_line_total_p, applied
                FROM pouriq_invoice_lines WHERE invoice_id = ?1`)
      .bind(invoiceId)
      .all<BillInvoiceLine>()
    const bill = buildBill(invoice, lines.results ?? [])
    if (!bill) return

    const fresh = await ensureFreshToken(db, adapter, conn)
    const { externalBillId } = await adapter.pushBill(fresh, bill)

    await recordPushResult(db, {
      invoiceId, connectionId: conn.id, provider: conn.provider,
      status: 'pushed', externalBillId, error: null,
    })
    await markAccountingPushSuccess(db, conn.id)
  } catch (e) {
    try {
      const message = (e as Error)?.message ?? 'unknown'
      Sentry.captureException(e, {
        tags: { feature: 'pouriq-accounting-push', provider: conn?.provider ?? 'unknown' },
        extra: { invoiceId },
      })
      if (conn) {
        await recordPushResult(db, {
          invoiceId, connectionId: conn.id, provider: conn.provider,
          status: 'failed', externalBillId: null, error: message,
        })
        await markAccountingPushError(db, conn.id, message)
      }
    } catch { /* push bookkeeping must never break the caller */ }
  }
}

/** Hourly: re-attempt failed pushes and back-fill invoices committed while
 *  disconnected or half-set-up. Only invoices committed after the
 *  connection was created are considered. */
export async function runAccountingPushSweep(
  env: { DB: D1Database } & AccountingProvidersEnv,
): Promise<void> {
  const db = env.DB
  const result = await db
    .prepare(`SELECT * FROM pouriq_accounting_connections WHERE enabled = 1`)
    .all<AccountingConnection>()
  for (const conn of result.results ?? []) {
    if (!isConnectionReady(conn)) continue
    try {
      const pending = await db
        .prepare(`
          SELECT i.id FROM pouriq_invoices i
          LEFT JOIN pouriq_accounting_pushes p ON p.invoice_id = i.id AND p.provider = ?1
          WHERE i.trade_account_id = ?2
            AND i.created_at >= ?3
            AND (p.id IS NULL OR p.status = 'failed')
          ORDER BY i.created_at ASC
          LIMIT ${SWEEP_BATCH_LIMIT}
        `)
        .bind(conn.provider, conn.trade_account_id, conn.created_at)
        .all<{ id: string }>()
      for (const row of pending.results ?? []) {
        await pushInvoiceToAccounting(db, env, conn.trade_account_id, row.id)
      }
    } catch (e) {
      Sentry.captureException(e, { tags: { feature: 'pouriq-accounting-sweep', provider: conn.provider } })
    }
  }
}
