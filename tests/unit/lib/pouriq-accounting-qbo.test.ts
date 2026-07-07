import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createQuickBooksAdapter, resetQuickBooksDiscoveryCache,
} from '@/lib/pouriq/accounting/providers/quickbooks'
import type { AccountingConnection, NeutralBill } from '@/lib/pouriq/accounting/types'

const env = { QUICKBOOKS_CLIENT_ID: 'id', QUICKBOOKS_CLIENT_SECRET: 'secret', QUICKBOOKS_ENV: 'sandbox' }

const connection: AccountingConnection = {
  id: 'c1', trade_account_id: 't1', provider: 'quickbooks',
  external_account_id: 'realm-9', external_account_name: 'Sandbox Company',
  access_token: 'at', refresh_token: 'rt', token_expires_at: '2026-07-07T13:00:00Z',
  default_account_code: '82', default_tax_code: '3',
  last_push_at: null, last_push_error: null, enabled: 1,
  created_at: '2026-07-07 10:00:00', updated_at: '2026-07-07 10:00:00',
}

const bill: NeutralBill = {
  supplierName: "O'Brien's Wholesale", reference: 'INV-4471-LONG-REFERENCE-X', dateISO: '2026-07-01',
  amountsIncludeTax: false,
  lines: [
    { description: 'Rum 70cl', quantity: 6, unitAmountP: 2250, lineTotalP: 13500 },
    { description: 'Limes', quantity: 3, unitAmountP: 120, lineTotalP: null },
  ],
}

const discovery = {
  authorization_endpoint: 'https://appcenter.intuit.com/connect/oauth2',
  token_endpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

const fetchMock = vi.fn()

beforeEach(() => { vi.stubGlobal('fetch', fetchMock); resetQuickBooksDiscoveryCache() })
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset() })

describe('createQuickBooksAdapter', () => {
  it('fetches the sandbox discovery document and exchanges the code', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(discovery))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ CompanyInfo: { CompanyName: 'Sandbox Company' } }))
    const adapter = createQuickBooksAdapter(env)
    const result = await adapter.exchangeCodeForToken('code123', 'https://x/callback', 'realm-9')
    expect(result.externalAccountId).toBe('realm-9')
    expect(result.externalAccountName).toBe('Sandbox Company')
    expect(fetchMock.mock.calls[0][0]).toBe('https://developer.api.intuit.com/.well-known/openid_sandbox_configuration')
    expect(fetchMock.mock.calls[1][0]).toBe(discovery.token_endpoint)
  })

  it('rejects a callback with no realmId', async () => {
    const adapter = createQuickBooksAdapter(env)
    await expect(adapter.exchangeCodeForToken('code123', 'https://x/callback', null))
      .rejects.toThrow(/realmId/)
  })

  it('reuses an existing vendor and pushes the bill', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ QueryResponse: { Vendor: [{ Id: 'v7' }] } }))
      .mockResolvedValueOnce(jsonResponse({ Bill: { Id: 'qbo-bill-1' } }))
    const adapter = createQuickBooksAdapter(env)
    const result = await adapter.pushBill(connection, bill)
    expect(result.externalBillId).toBe('qbo-bill-1')
    // Vendor lookup escaped the apostrophe in the supplier name.
    expect(String(fetchMock.mock.calls[0][0])).toContain(encodeURIComponent("O\\'Brien\\'s Wholesale"))
    const billCall = fetchMock.mock.calls[1]
    expect(String(billCall[0])).toBe('https://sandbox-quickbooks.api.intuit.com/v3/company/realm-9/bill?minorversion=75')
    const payload = JSON.parse(billCall[1].body as string)
    expect(payload.VendorRef).toEqual({ value: 'v7' })
    expect(payload.TxnDate).toBe('2026-07-01')
    expect(payload.DocNumber).toBe('INV-4471-LONG-REFEREN')  // 21 chars
    expect(payload.GlobalTaxCalculation).toBe('TaxExcluded')
    expect(payload.Line[0].Amount).toBe(135)
    expect(payload.Line[0].AccountBasedExpenseLineDetail).toEqual({
      AccountRef: { value: '82' }, TaxCodeRef: { value: '3' },
    })
    expect(payload.Line[1].Amount).toBe(3.6)  // 3 x 120p, no extracted line total
  })

  it('creates the vendor when none matches', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ QueryResponse: {} }))
      .mockResolvedValueOnce(jsonResponse({ Vendor: { Id: 'v-new' } }))
      .mockResolvedValueOnce(jsonResponse({ Bill: { Id: 'qbo-bill-2' } }))
    const adapter = createQuickBooksAdapter(env)
    await adapter.pushBill(connection, bill)
    const vendorCreate = fetchMock.mock.calls[1]
    expect(String(vendorCreate[0])).toBe('https://sandbox-quickbooks.api.intuit.com/v3/company/realm-9/vendor?minorversion=75')
    expect(JSON.parse(vendorCreate[1].body as string)).toEqual({ DisplayName: "O'Brien's Wholesale" })
    const payload = JSON.parse(fetchMock.mock.calls[2][1].body as string)
    expect(payload.VendorRef).toEqual({ value: 'v-new' })
  })

  it('includes intuit_tid in provider errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"Fault":{}}', { status: 400, headers: { intuit_tid: 'tid-123' } }))
    const adapter = createQuickBooksAdapter(env)
    await expect(adapter.pushBill(connection, bill)).rejects.toThrow(/intuit_tid tid-123/)
  })

  it('lists expense accounts via the query endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ QueryResponse: { Account: [
      { Id: '82', Name: 'Cost of Goods Sold' },
      { Id: '90', Name: 'Rent' },
    ] } }))
    const adapter = createQuickBooksAdapter(env)
    const accounts = await adapter.listExpenseAccounts(connection)
    expect(accounts).toEqual([
      { code: '82', name: 'Cost of Goods Sold' },
      { code: '90', name: 'Rent' },
    ])
  })

  it('marks inclusive bills as TaxInclusive', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ QueryResponse: { Vendor: [{ Id: 'v7' }] } }))
      .mockResolvedValueOnce(jsonResponse({ Bill: { Id: 'qbo-bill-3' } }))
    const adapter = createQuickBooksAdapter(env)
    await adapter.pushBill(connection, { ...bill, amountsIncludeTax: true })
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body as string)
    expect(payload.GlobalTaxCalculation).toBe('TaxInclusive')
  })
})
