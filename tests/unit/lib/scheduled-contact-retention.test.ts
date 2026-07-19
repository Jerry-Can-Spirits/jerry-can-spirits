import { describe, expect, it, vi } from 'vitest'
import { runContactRetentionPurge } from '@/lib/scheduled-contact-retention'

function mockDb(changes: number) {
  const run = vi.fn().mockResolvedValue({ meta: { changes } })
  const bind = vi.fn().mockReturnValue({ run })
  const prepare = vi.fn().mockReturnValue({ bind })
  return { db: { prepare } as unknown as D1Database, prepare, bind, run }
}

describe('runContactRetentionPurge', () => {
  it('deletes contact_submissions older than the 2-year window', async () => {
    const { db, prepare, bind } = mockDb(3)
    await runContactRetentionPurge({ DB: db })
    expect(prepare.mock.calls[0][0]).toContain('DELETE FROM contact_submissions')
    expect(prepare.mock.calls[0][0]).toContain("datetime('now', ?)")
    expect(bind).toHaveBeenCalledWith('-2 years')
  })

  it('never throws when the purge query fails (best-effort sweep)', async () => {
    const prepare = vi.fn().mockImplementation(() => {
      throw new Error('D1 unavailable')
    })
    const db = { prepare } as unknown as D1Database
    await expect(runContactRetentionPurge({ DB: db })).resolves.toBeUndefined()
  })
})
