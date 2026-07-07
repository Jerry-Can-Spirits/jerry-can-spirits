import { describe, expect, it } from 'vitest'
import { bucketLines, upsertAdditiveVolumes } from '@/lib/pouriq/pos/volume-buckets'
import type { BucketEntry } from '@/lib/pouriq/pos/volume-buckets'

// Minimal D1 stub that records batch() calls without touching a real database.
function makeDb() {
  const batchCalls: unknown[][] = []
  const db = {
    prepare(sql: string) {
      const stmt = { sql, bind(..._args: unknown[]) { return this } }
      return stmt
    },
    async batch(stmts: unknown[]) {
      batchCalls.push([...stmts])
      return stmts.map(() => ({ results: [], success: true, meta: {} }))
    },
  }
  return { db: db as unknown as D1Database, batchCalls }
}

const entry = (n: number): BucketEntry => ({
  cocktailId: `cocktail-${n}`,
  periodStart: '2026-07-01T00:00:00Z',
  periodEnd: '2026-07-07T23:59:59Z',
  units: n * 3,
})

describe('upsertAdditiveVolumes', () => {
  it('issues exactly one db.batch containing N statements for N buckets', async () => {
    const { db, batchCalls } = makeDb()

    await upsertAdditiveVolumes(db, [entry(1), entry(2), entry(3)])

    expect(batchCalls).toHaveLength(1)
    expect(batchCalls[0]).toHaveLength(3)
  })

  it('issues one db.batch for a single bucket', async () => {
    const { db, batchCalls } = makeDb()

    await upsertAdditiveVolumes(db, [entry(1)])

    expect(batchCalls).toHaveLength(1)
    expect(batchCalls[0]).toHaveLength(1)
  })

  it('skips db.batch entirely when entries is empty', async () => {
    const { db, batchCalls } = makeDb()

    await upsertAdditiveVolumes(db, [])

    expect(batchCalls).toHaveLength(0)
  })
})

describe('bucketLines', () => {
  it('merges lines with the same cocktail and period', () => {
    const menu = { volume_cadence: 'weekly' as const }
    const lines = [
      { cocktail_id: 'c1', quantity: 2, sold_at: '2026-07-01T12:00:00Z' },
      { cocktail_id: 'c1', quantity: 5, sold_at: '2026-07-02T18:00:00Z' },
      { cocktail_id: 'c2', quantity: 1, sold_at: '2026-07-01T12:00:00Z' },
    ]

    const buckets = bucketLines(menu, lines)

    const c1 = buckets.find((b) => b.cocktailId === 'c1')
    const c2 = buckets.find((b) => b.cocktailId === 'c2')
    expect(c1?.units).toBe(7)
    expect(c2?.units).toBe(1)
    expect(buckets).toHaveLength(2)
  })
})
