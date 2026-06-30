import { describe, it, expect } from 'vitest'
import { costConfidenceBadge, menuCostConfidence } from '@/lib/pouriq/cost-confidence'
import type { CostConfidence } from '@/lib/pouriq/types'

describe('costConfidenceBadge', () => {
  it('maps each value to a label', () => {
    expect(costConfidenceBadge('estimated').label).toBe('Estimated')
    expect(costConfidenceBadge('set').label).toBe('Set')
    expect(costConfidenceBadge('confirmed').label).toBe('Confirmed')
  })
})

describe('menuCostConfidence', () => {
  const drink = (confidences: CostConfidence[]) => ({ ingredients: confidences.map((c) => ({ library: { cost_confidence: c } })) })
  it('all confirmed -> 0 unconfirmed, 0 estimated', () => {
    expect(menuCostConfidence([drink(['confirmed', 'confirmed'])])).toEqual({ unconfirmed_drinks: 0, estimated_drinks: 0 })
  })
  it('one set ingredient -> unconfirmed only', () => {
    expect(menuCostConfidence([drink(['confirmed', 'set'])])).toEqual({ unconfirmed_drinks: 1, estimated_drinks: 0 })
  })
  it('one estimated ingredient -> unconfirmed + estimated', () => {
    expect(menuCostConfidence([drink(['estimated'])])).toEqual({ unconfirmed_drinks: 1, estimated_drinks: 1 })
  })
  it('empty menu -> 0', () => {
    expect(menuCostConfidence([])).toEqual({ unconfirmed_drinks: 0, estimated_drinks: 0 })
  })
})
