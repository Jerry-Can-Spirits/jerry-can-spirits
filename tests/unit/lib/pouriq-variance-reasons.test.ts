import { describe, it, expect } from 'vitest'
import { summariseVarianceByReason } from '@/lib/pouriq/variance'

describe('summariseVarianceByReason', () => {
  it('returns empty when there are no losses', () => {
    expect(summariseVarianceByReason([
      { variance_cost_p: 500, latest_reason: 'spillage' },
      { variance_cost_p: null, latest_reason: null },
      { variance_cost_p: 0, latest_reason: null },
    ])).toEqual({ rows: [], total_loss_p: 0 })
  })

  it('sums losses by reason with shares and an unattributed bucket', () => {
    const s = summariseVarianceByReason([
      { variance_cost_p: -600, latest_reason: 'spillage' },
      { variance_cost_p: -300, latest_reason: 'spillage' },
      { variance_cost_p: -100, latest_reason: null },
      { variance_cost_p: 200, latest_reason: 'comps' }, // surplus, ignored
    ])
    expect(s.total_loss_p).toBe(1000)
    expect(s.rows[0]).toEqual({ reason: 'spillage', loss_p: 900, share_pct: 90 })
    expect(s.rows[1]).toEqual({ reason: 'unattributed', loss_p: 100, share_pct: 10 })
  })

  it('treats a blank reason as unattributed', () => {
    const s = summariseVarianceByReason([
      { variance_cost_p: -400, latest_reason: '  ' },
    ])
    expect(s.rows).toEqual([{ reason: 'unattributed', loss_p: 400, share_pct: 100 }])
  })

  it('always sorts unattributed last even when largest', () => {
    const s = summariseVarianceByReason([
      { variance_cost_p: -900, latest_reason: null },
      { variance_cost_p: -100, latest_reason: 'theft' },
    ])
    expect(s.rows.map((r) => r.reason)).toEqual(['theft', 'unattributed'])
  })
})
