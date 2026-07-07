import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createXeroAdapter } from '@/lib/pouriq/accounting/providers/xero'
import type { AccountingConnection, NeutralBill } from '@/lib/pouriq/accounting/types'

const env = { XERO_CLIENT_ID: 'id', XERO_CLIENT_SECRET: 'secret' }

const connection: AccountingConnection = {
  id: 'c1', trade_account_id: 't1', provider: 'xero',
  external_account_id: 'tenant-1', external_account_name: 'Demo Company (UK)',
  access_token: 'at', refresh_token: 'rt', token_expires_at: '2026-07-07T13:00:00Z',
  default_account_code: '310', default_tax_code: 'INPUT2',
  last_push_at: null, last_push_error: null, enabled: 1,
  created_at: '2026-07-07 10:00:00', updated_at: '2026-07-07 10:00:00',
}

const bill: NeutralBill = {
  supplierName: 'Matthew Clark', reference: 'INV-4471', dateISO: '2026-07-01',
  amountsIncludeTax: false,
  lines: [{ description: 'Rum 70cl', quantity: 6, unitAmountP: 2250, lineTotalP: 13500 }],
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

const fetchMock = vi.fn()

beforeEach(() => { vi.stubGlobal('fetch', fetchMock) })
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset() })

describe('createXeroAdapter', () => {
  it('exchanges a code and resolves a single org directly', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 1800 }))
      .mockResolvedValueOnce(jsonResponse([{ tenantId: 'tenant-1', tenantName: 'Demo Company (UK)' }]))
    const adapter = createXeroAdapter(env)
    const result = await adapter.exchangeCodeForToken('code123', 'https://x/callback', null)
    expect(result.externalAccountId).toBe('tenant-1')
    expect(result.externalAccountName).toBe('Demo Company (UK)')
    expect(result.tenantCandidates).toBeNull()
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]
    expect(tokenUrl).toBe('https://identity.xero.com/connect/token')
    expect((tokenInit.headers as Record<string, string>).Authorization).toMatch(/^Basic /)
  })

  it('returns empty externalAccountId plus candidates when the login holds several orgs', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'at', refresh_token: 'rt', expires_in: 1800 }))
      .mockResolvedValueOnce(jsonResponse([
        { tenantId: 'tenant-1', tenantName: 'Bar One' },
        { tenantId: 'tenant-2', tenantName: 'Bar Two' },
      ]))
    const adapter = createXeroAdapter(env)
    const result = await adapter.exchangeCodeForToken('code123', 'https://x/callback', null)
    expect(result.externalAccountId).toBe('')
    expect(result.tenantCandidates).toEqual([
      { id: 'tenant-1', name: 'Bar One' },
      { id: 'tenant-2', name: 'Bar Two' },
    ])
  })

  it('pushes a draft ACCPAY invoice with tenant header and exclusive amounts', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Invoices: [{ InvoiceID: 'xero-bill-1' }] }))
    const adapter = createXeroAdapter(env)
    const result = await adapter.pushBill(connection, bill)
    expect(result.externalBillId).toBe('xero-bill-1')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.xero.com/api.xro/2.0/Invoices')
    expect((init.headers as Record<string, string>)['Xero-Tenant-Id']).toBe('tenant-1')
    const payload = JSON.parse(init.body as string)
    const inv = payload.Invoices[0]
    expect(inv.Type).toBe('ACCPAY')
    expect(inv.Status).toBe('DRAFT')
    expect(inv.LineAmountTypes).toBe('Exclusive')
    expect(inv.Contact).toEqual({ Name: 'Matthew Clark' })
    expect(inv.InvoiceNumber).toBe('INV-4471')
    expect(inv.Date).toBe('2026-07-01')
    expect(inv.LineItems[0]).toEqual({
      Description: 'Rum 70cl', Quantity: 6, UnitAmount: 22.5, LineAmount: 135,
      AccountCode: '310', TaxType: 'INPUT2',
    })
  })

  it('marks inclusive bills as Inclusive', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Invoices: [{ InvoiceID: 'x' }] }))
    const adapter = createXeroAdapter(env)
    await adapter.pushBill(connection, { ...bill, amountsIncludeTax: true })
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(payload.Invoices[0].LineAmountTypes).toBe('Inclusive')
  })

  it('throws with status and body detail on a provider error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"Message":"Validation"}', { status: 400 }))
    const adapter = createXeroAdapter(env)
    await expect(adapter.pushBill(connection, bill)).rejects.toThrow(/Xero 400/)
  })

  it('filters expense accounts to active expense-class types', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Accounts: [
      { Code: '310', Name: 'Cost of Sales', Type: 'DIRECTCOSTS', Status: 'ACTIVE' },
      { Code: '200', Name: 'Sales', Type: 'REVENUE', Status: 'ACTIVE' },
      { Code: '404', Name: 'Old expenses', Type: 'EXPENSE', Status: 'ARCHIVED' },
    ] }))
    const adapter = createXeroAdapter(env)
    const accounts = await adapter.listExpenseAccounts(connection)
    expect(accounts).toEqual([{ code: '310', name: 'Cost of Sales' }])
  })

  it('filters tax options to active expense-applicable rates', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ TaxRates: [
      { TaxType: 'INPUT2', Name: '20% (VAT on Expenses)', Status: 'ACTIVE', CanApplyToExpenses: true, DisplayTaxRate: 20 },
      { TaxType: 'OUTPUT2', Name: '20% (VAT on Income)', Status: 'ACTIVE', CanApplyToExpenses: false, DisplayTaxRate: 20 },
    ] }))
    const adapter = createXeroAdapter(env)
    const options = await adapter.listTaxOptions(connection)
    expect(options).toEqual([{ code: 'INPUT2', name: '20% (VAT on Expenses)' }])
  })
})
