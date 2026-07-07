import { describe, expect, it, vi } from 'vitest'
import { getActiveMenu, deleteMenu, insertMenu } from '@/lib/pouriq/menus'

/**
 * Minimal D1Database stub that captures every prepared SQL string and spies
 * on db.batch(). firstResults are consumed in call order by .first().
 */
function makeDb(firstResults: Array<unknown> = []) {
  const sqls: string[] = []
  let firstIdx = 0
  const batchSpy = vi.fn(async (_stmts: unknown[]) => [] as unknown[])

  const db = {
    prepare(sql: string) {
      sqls.push(sql)
      const stmt = {
        bind: (..._args: unknown[]) => stmt,
        first: async <T>() => (firstResults[firstIdx++] ?? null) as T,
        all: async <T>() => ({ results: [] as T[] }),
        run: async () => ({ success: true, results: [], meta: {} }),
      }
      return stmt as unknown as D1PreparedStatement
    },
    batch: batchSpy,
  }

  return { db: db as unknown as D1Database, sqls, batchSpy }
}

describe('getActiveMenu', () => {
  it('excludes the serves menu from the active-menu lookup', async () => {
    const { db, sqls } = makeDb([null])

    await getActiveMenu(db, 'trade-1')

    const activeQuery = sqls.find((s) => s.includes('is_active = 1'))
    expect(activeQuery).toBeDefined()
    expect(activeQuery).toContain('is_serves_menu = 0')
  })
})

describe('deleteMenu', () => {
  it('uses db.batch so delete and promotion are a single atomic operation', async () => {
    // is_active = 1 → the deleted menu was the active one, promotion expected
    const { db, batchSpy } = makeDb([{ is_active: 1 }])

    await deleteMenu(db, 'menu-1', 'trade-1')

    expect(batchSpy).toHaveBeenCalledTimes(1)
    expect(batchSpy.mock.calls[0][0]).toHaveLength(2)
  })

  it('batch contains only the DELETE when the menu was not active', async () => {
    const { db, batchSpy } = makeDb([{ is_active: 0 }])

    await deleteMenu(db, 'menu-1', 'trade-1')

    expect(batchSpy).toHaveBeenCalledTimes(1)
    expect(batchSpy.mock.calls[0][0]).toHaveLength(1)
  })

  it('the promotion subquery filters out the serves menu', async () => {
    const { db, sqls } = makeDb([{ is_active: 1 }])

    await deleteMenu(db, 'menu-1', 'trade-1')

    const promotionSql = sqls.find((s) => s.includes('UPDATE') && s.includes('is_serves_menu = 0'))
    expect(promotionSql).toBeDefined()
  })
})

describe('insertMenu', () => {
  it('counts only real menus (not the serves menu) when deciding whether to auto-activate', async () => {
    // firstResults[0] → COUNT query, firstResults[1] → INSERT RETURNING id
    const { db, sqls } = makeDb([{ c: 0 }, { id: 'new-menu-id' }])

    await insertMenu(db, {
      trade_account_id: 'trade-1',
      name: 'Test Menu',
      venue_type: null,
      city: null,
      target_gp_pct: 70,
      positioning: null,
      notes: null,
      prices_include_vat: false,
    })

    const countSql = sqls.find((s) => s.includes('COUNT(*)'))
    expect(countSql).toBeDefined()
    expect(countSql).toContain('is_serves_menu = 0')
  })
})
