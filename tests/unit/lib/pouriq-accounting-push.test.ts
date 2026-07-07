import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccountingConnection } from '@/lib/pouriq/accounting/types'

// Controllable fake adapter injected in place of the real provider registry.
const fakeAdapter = {
  provider: 'xero' as const,
  refreshAccessToken: vi.fn(),
  pushBill: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  listTenants: vi.fn(),
  listExpenseAccounts: vi.fn(),
  listTaxOptions: vi.fn(),
  revokeToken: vi.fn(),
}

vi.mock('@/lib/pouriq/accounting/providers', () => ({
  getAccountingAdapter: vi.fn(() => fakeAdapter),
}))

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

import { pushInvoiceWithConnection, pushInvoiceToAccounting, runAccountingPushSweep } from '@/lib/pouriq/accounting/push'

const baseConn: AccountingConnection = {
  id: 'c1', trade_account_id: 't1', provider: 'xero',
  external_account_id: 'tenant-1', external_account_name: 'Demo Company (UK)',
  access_token: 'at', refresh_token: 'rt', token_expires_at: '2999-01-01T00:00:00Z',
  default_account_code: '310', default_tax_code: 'INPUT2',
  last_push_at: null, last_push_error: null, enabled: 1,
  created_at: '2026-07-07 10:00:00', updated_at: '2026-07-07 10:00:00',
}

const invoiceHeader = {
  supplier_name: 'Matthew Clark', invoice_number: 'INV-1', invoice_date: '2026-07-01',
  created_at: '2026-07-07 11:00:00', prices_include_vat: 0,
}
const appliedLine = {
  extracted_name: 'Rum 70cl', extracted_quantity: 6,
  extracted_unit_price_p: 2250, extracted_line_total_p: 13500, applied: 1,
}

interface DbConfig {
  pushRow?: { status: string } | null
  invoiceRow?: typeof invoiceHeader | null
  lines?: Array<typeof appliedLine>
  sweepConnections?: AccountingConnection[]
  pending?: Array<{ id: string }>
}

function route(sql: string, cfg: DbConfig): unknown {
  if (sql.includes('FROM pouriq_accounting_connections WHERE enabled = 1')) return { results: cfg.sweepConnections ?? [] }
  if (sql.includes('FROM pouriq_accounting_pushes WHERE invoice_id')) return cfg.pushRow ?? null
  if (sql.includes('LEFT JOIN pouriq_accounting_pushes')) return { results: cfg.pending ?? [] }
  if (sql.includes('FROM pouriq_invoices WHERE id')) return cfg.invoiceRow ?? null
  if (sql.includes('FROM pouriq_invoice_lines')) return { results: cfg.lines ?? [] }
  return null
}

function makeDb(cfg: DbConfig) {
  const ran: string[] = []
  const db = {
    prepare(sql: string) {
      // Some statements bind params, some (the sweep connection list) do not,
      // so first/all/run must be reachable both directly and after bind().
      const executor = {
        async first() { ran.push(sql); return route(sql, cfg) },
        async all() { ran.push(sql); return route(sql, cfg) },
        async run() { ran.push(sql); return { success: true } },
      }
      return { ...executor, bind: () => executor }
    },
  }
  return { db: db as unknown as D1Database, ran }
}

const ranHas = (ran: string[], needle: string) => ran.some((s) => s.includes(needle))

beforeEach(() => {
  fakeAdapter.refreshAccessToken.mockReset()
  fakeAdapter.pushBill.mockReset()
})

describe('pushInvoiceWithConnection', () => {
  it('records a failed push (never throws) on a provider 4xx from pushBill', async () => {
    const { db, ran } = makeDb({ pushRow: null, invoiceRow: invoiceHeader, lines: [appliedLine] })
    fakeAdapter.pushBill.mockRejectedValue(new Error('Xero 400: Validation'))

    const outcome = await pushInvoiceWithConnection(db, {}, baseConn, 'inv-1')

    expect(outcome).toBe('failed')
    expect(ranHas(ran, 'INSERT INTO pouriq_accounting_pushes')).toBe(true)
    expect(ranHas(ran, 'SET last_push_error = ?1')).toBe(true)
    expect(ranHas(ran, 'SET enabled = 0')).toBe(false)
  })

  it('does not misclassify a 400 error with "401" in the body as auth-failed', async () => {
    const { db, ran } = makeDb({ pushRow: null, invoiceRow: invoiceHeader, lines: [appliedLine] })
    fakeAdapter.pushBill.mockRejectedValue(new Error('Xero 400: LineAmount 401.00 is invalid'))

    const outcome = await pushInvoiceWithConnection(db, {}, baseConn, 'inv-1')

    expect(outcome).toBe('failed')
    expect(ranHas(ran, 'INSERT INTO pouriq_accounting_pushes')).toBe(true)
    expect(ranHas(ran, 'SET last_push_error = ?1')).toBe(true)
    expect(ranHas(ran, 'SET enabled = 0')).toBe(false)
  })

  it('refreshes an expired access token, persists it, then pushes', async () => {
    const conn = { ...baseConn, token_expires_at: '2000-01-01T00:00:00Z' }
    const { db, ran } = makeDb({ pushRow: null, invoiceRow: invoiceHeader, lines: [appliedLine] })
    fakeAdapter.refreshAccessToken.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt', expiresAt: '2999-01-01T00:00:00Z' })
    fakeAdapter.pushBill.mockResolvedValue({ externalBillId: 'bill-1' })

    const outcome = await pushInvoiceWithConnection(db, {}, conn, 'inv-1')

    expect(outcome).toBe('pushed')
    expect(fakeAdapter.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fakeAdapter.refreshAccessToken.mock.invocationCallOrder[0])
      .toBeLessThan(fakeAdapter.pushBill.mock.invocationCallOrder[0])
    expect(ranHas(ran, 'access_token = ?1')).toBe(true)
    expect(ranHas(ran, 'SET last_push_at')).toBe(true)
  })

  it('pauses the connection when the refresh token is revoked', async () => {
    const conn = { ...baseConn, token_expires_at: '2000-01-01T00:00:00Z' }
    const { db, ran } = makeDb({ pushRow: null, invoiceRow: invoiceHeader, lines: [appliedLine] })
    fakeAdapter.refreshAccessToken.mockRejectedValue(new Error('invalid_grant'))

    const outcome = await pushInvoiceWithConnection(db, {}, conn, 'inv-1')

    expect(outcome).toBe('auth-failed')
    expect(ranHas(ran, 'SET enabled = 0')).toBe(true)
    expect(ranHas(ran, 'INSERT INTO pouriq_accounting_pushes')).toBe(true)
    expect(fakeAdapter.pushBill).not.toHaveBeenCalled()
  })

  it('skips an invoice that is already pushed without touching the adapter', async () => {
    const { db } = makeDb({ pushRow: { status: 'pushed' } })

    const outcome = await pushInvoiceWithConnection(db, {}, baseConn, 'inv-1')

    expect(outcome).toBe('skipped')
    expect(fakeAdapter.pushBill).not.toHaveBeenCalled()
    expect(fakeAdapter.refreshAccessToken).not.toHaveBeenCalled()
  })
})

describe('runAccountingPushSweep', () => {
  it('abandons a connection batch after an auth failure (no second attempt)', async () => {
    const conn = { ...baseConn, token_expires_at: '2000-01-01T00:00:00Z' }
    const { db } = makeDb({
      sweepConnections: [conn],
      pending: [{ id: 'inv-1' }, { id: 'inv-2' }],
      pushRow: null, invoiceRow: invoiceHeader, lines: [appliedLine],
    })
    fakeAdapter.refreshAccessToken.mockRejectedValue(new Error('invalid_grant'))

    await runAccountingPushSweep({ DB: db })

    expect(fakeAdapter.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fakeAdapter.pushBill).not.toHaveBeenCalled()
  })
})

describe('pushInvoiceToAccounting', () => {
  it('resolves even when db.prepare throws', async () => {
    const db = { prepare() { throw new Error('no such table: pouriq_accounting_connections') } } as unknown as D1Database

    await expect(pushInvoiceToAccounting(db, {}, 't1', 'inv-1')).resolves.toBeUndefined()
  })
})
