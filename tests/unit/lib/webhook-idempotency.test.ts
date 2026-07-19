import { describe, expect, it, vi } from 'vitest'
import { markOrderProcessed } from '@/lib/shopify-webhooks'

// Minimal D1 stub for the prepare().bind().first() chain markOrderProcessed uses.
// first() resolves to the RETURNING row on a fresh insert, or null when
// ON CONFLICT DO NOTHING skipped the insert (a duplicate). Verified against real
// D1: first insert returns [{order_id}], the second returns [].
function mockDb(firstResult: unknown) {
  const first = vi.fn().mockResolvedValue(firstResult)
  const bind = vi.fn().mockReturnValue({ first })
  const prepare = vi.fn().mockReturnValue({ bind })
  return { db: { prepare } as unknown as D1Database, prepare, bind, first }
}

describe('markOrderProcessed', () => {
  it('returns true on the first delivery (INSERT ... RETURNING yields a row)', async () => {
    const { db, prepare, bind } = mockDb({ order_id: '1271' })
    await expect(markOrderProcessed(db, 1271)).resolves.toBe(true)
    // Records into the dedup table, and binds the order id as a string.
    expect(prepare.mock.calls[0][0]).toContain('webhook_processed_orders')
    expect(prepare.mock.calls[0][0]).toContain('ON CONFLICT')
    expect(bind).toHaveBeenCalledWith('1271')
  })

  it('returns false on a duplicate/retry (ON CONFLICT DO NOTHING yields null)', async () => {
    const { db } = mockDb(null)
    await expect(markOrderProcessed(db, 1271)).resolves.toBe(false)
  })
})
