import { describe, expect, it, vi } from 'vitest'
import {
  attributeTradeOrder,
  exVatSubtotalPence,
  statsFromRows,
  tradeAccountIdFromAttributes,
  TRADE_ACCOUNT_ATTRIBUTE,
} from '@/lib/trade-portal/orders'

describe('exVatSubtotalPence', () => {
  it('takes the line tax off the tax-inclusive subtotal', () => {
    // Saxtys: one case at £180 inc VAT after the £48 discount. Shopify reports
    // the line's tax as £30.00, so £150.00 ex VAT, the £25 a bottle agreed.
    const p = exVatSubtotalPence({
      subtotal_price: '180.00',
      line_items: [{ title: 'Expedition Pack', quantity: 1, product_id: 1, tax_lines: [{ price: '30.00' }] }],
    })
    expect(p).toBe(15000)
  })

  it('falls back to dividing by 1.2 when the payload carries no tax lines', () => {
    const p = exVatSubtotalPence({
      subtotal_price: '180.00',
      line_items: [{ title: 'Expedition Pack', quantity: 1, product_id: 1 }],
    })
    expect(p).toBe(15000)
  })

  it('is zero for a missing or zero subtotal', () => {
    expect(exVatSubtotalPence({ line_items: [] })).toBe(0)
    expect(exVatSubtotalPence({ subtotal_price: '0.00', line_items: [] })).toBe(0)
  })
})

describe('tradeAccountIdFromAttributes', () => {
  it('reads the stamped account id and ignores other attributes', () => {
    expect(
      tradeAccountIdFromAttributes({
        note_attributes: [
          { name: 'gift_message', value: 'Happy birthday' },
          { name: TRADE_ACCOUNT_ATTRIBUTE, value: ' abc123 ' },
        ],
      }),
    ).toBe('abc123')
    expect(tradeAccountIdFromAttributes({ note_attributes: [] })).toBeNull()
    expect(tradeAccountIdFromAttributes({})).toBeNull()
  })
})

// D1 stub: prepare(sql).bind(...).first() / .all() driven by a lookup on the SQL.
function mockDb(handlers: { first?: (sql: string, args: unknown[]) => unknown; all?: (sql: string, args: unknown[]) => unknown[] }) {
  const prepare = vi.fn((sql: string) => ({
    bind: (...args: unknown[]) => ({
      first: async () => handlers.first?.(sql, args) ?? null,
      all: async () => ({ results: handlers.all?.(sql, args) ?? [] }),
      run: async () => ({}),
    }),
  }))
  return { db: { prepare } as unknown as D1Database, prepare }
}

describe('attributeTradeOrder', () => {
  it('prefers the cart attribute when the account exists', async () => {
    const { db } = mockDb({
      first: (_sql, args) => (args[0] === 'acc1' ? { id: 'acc1', application_id: 'app1' } : null),
    })
    const hit = await attributeTradeOrder(db, {
      note_attributes: [{ name: TRADE_ACCOUNT_ATTRIBUTE, value: 'acc1' }],
      discount_codes: [{ code: 'TRADE10', amount: '1', type: 'percentage' }],
    })
    expect(hit).toEqual({ accountId: 'acc1', applicationId: 'app1', by: 'attribute' })
  })

  it('falls back to a discount code only when exactly one active account carries it', async () => {
    const { db } = mockDb({
      all: (_sql, args) => {
        if (args[0] === 'TRADECASE150') return [{ id: 'acc2', application_id: 'app2' }]
        if (args[0] === 'TRADE10') return [{ id: 'a', application_id: 'x' }, { id: 'b', application_id: 'y' }]
        return []
      },
    })
    await expect(
      attributeTradeOrder(db, { discount_codes: [{ code: 'TRADECASE150', amount: '48', type: 'fixed_amount' }] }),
    ).resolves.toEqual({ accountId: 'acc2', applicationId: 'app2', by: 'discount_code' })
    // TRADE10 is shared, so it never attributes: crediting the wrong venue is
    // worse than crediting none.
    await expect(
      attributeTradeOrder(db, { discount_codes: [{ code: 'TRADE10', amount: '1', type: 'percentage' }] }),
    ).resolves.toBeNull()
  })

  it('falls back to the application contact email when nothing else fits', async () => {
    // A venue typing TRADE10 into the public shop leaves no stamp and a shared
    // code; the order email against the application is the only link left.
    const { db } = mockDb({
      all: (sql, args) => {
        if (sql.includes('contact_email') && args[0] === 'meg@example.com') return [{ id: 'acc3', application_id: 'app3' }]
        if (args[0] === 'TRADE10') return [{ id: 'a', application_id: 'x' }, { id: 'b', application_id: 'y' }]
        return []
      },
    })
    await expect(
      attributeTradeOrder(db, { email: 'Meg@Example.com', discount_codes: [{ code: 'TRADE10', amount: '1', type: 'percentage' }] }),
    ).resolves.toEqual({ accountId: 'acc3', applicationId: 'app3', by: 'email' })
  })

  it('returns null for a retail order', async () => {
    const { db } = mockDb({})
    await expect(
      attributeTradeOrder(db, { note_attributes: [], discount_codes: [], email: 'someone@example.com' }),
    ).resolves.toBeNull()
  })
})

describe('statsFromRows', () => {
  it('returns null when there are no orders, so nothing blank is written over a hand-typed value', () => {
    expect(statsFromRows([])).toBeNull()
  })

  it('counts, totals, and keeps only the last twelve months in the rolling figure', () => {
    const now = new Date('2026-10-01T12:00:00Z')
    const stats = statsFromRows(
      [
        { created_at: '2025-06-01T10:00:00Z', ex_vat_p: 15000 }, // older than a year
        { created_at: '2026-03-10T10:00:00Z', ex_vat_p: 16150 },
        { created_at: '2026-10-01T09:00:00Z', ex_vat_p: 15000 },
      ],
      now,
    )
    expect(stats).toEqual({
      orderCount: 3,
      totalExVatP: 46150,
      last12MonthsExVatP: 31150,
      firstOrderAt: '2025-06-01T10:00:00Z',
      lastOrderAt: '2026-10-01T09:00:00Z',
    })
  })
})
