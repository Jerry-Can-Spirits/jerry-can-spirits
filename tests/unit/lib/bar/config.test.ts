import { describe, expect, it } from 'vitest'
import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  COMMON_DEFAULTS,
  INGREDIENT_OVERRIDES,
} from '@/lib/bar/config'

describe('bar config', () => {
  it('has five shelves in display order', () => {
    expect(SHELVES.map((s) => s.id)).toEqual([
      'spirits',
      'wines-liqueurs',
      'mixers',
      'fresh',
      'bitters',
    ])
    expect(SHELVES.find((s) => s.id === 'wines-liqueurs')?.label).toBe('Wines & Liqueurs')
  })

  it('maps ingredient categories to shelves, excluding garnishes', () => {
    expect(shelfForCategory('spirits')).toBe('spirits')
    expect(shelfForCategory('liqueurs')).toBe('wines-liqueurs')
    expect(shelfForCategory('creme-liqueurs')).toBe('wines-liqueurs')
    expect(shelfForCategory('anise-herbal')).toBe('wines-liqueurs')
    expect(shelfForCategory('wine')).toBe('wines-liqueurs')
    expect(shelfForCategory('champagne')).toBe('wines-liqueurs')
    expect(shelfForCategory('fortified')).toBe('wines-liqueurs')
    expect(shelfForCategory('mixers')).toBe('mixers')
    expect(shelfForCategory('fresh')).toBe('fresh')
    expect(shelfForCategory('bitters')).toBe('bitters')
    expect(shelfForCategory('aromatics')).toBe('bitters')
    expect(shelfForCategory('garnishes')).toBeNull()
  })

  it('maps categories to a vessel silhouette, defaulting to spirit', () => {
    expect(vesselForCategory('spirits')).toBe('spirit')
    expect(vesselForCategory('wine')).toBe('wine')
    expect(vesselForCategory('champagne')).toBe('wine')
    expect(vesselForCategory('fortified')).toBe('wine')
    expect(vesselForCategory('liqueurs')).toBe('liqueur')
    expect(vesselForCategory('fresh')).toBe('carton')
    expect(vesselForCategory('mixers')).toBe('can')
    expect(vesselForCategory('bitters')).toBe('dash')
    expect(vesselForCategory('unknown-x')).toBe('spirit')
  })

  it('treats water and ice as assumed basics', () => {
    expect(ASSUMED_BASIC_SLUGS).toContain('water')
    expect(ASSUMED_BASIC_SLUGS).toContain('ice')
  })

  it('curates household staples as the quick-start defaults', () => {
    // Common home bottles are defaults; cocktail-darlings that few homes stock
    // are not.
    expect(COMMON_DEFAULTS.has('spiced-rum')).toBe(true)
    expect(COMMON_DEFAULTS.has('gin')).toBe(true)
    expect(COMMON_DEFAULTS.has('benedictine')).toBe(false)
    expect(COMMON_DEFAULTS.has('cognac')).toBe(false)
  })

  it('shows branded mixers under a generic name and shelves vermouth with the wines', () => {
    expect(INGREDIENT_OVERRIDES['fever-tree-ginger-beer'].displayName).toBe('Ginger Beer')
    expect(INGREDIENT_OVERRIDES['fever-tree-premium-indian-tonic-water'].displayName).toBe('Tonic Water')
    expect(INGREDIENT_OVERRIDES['sweet-vermouth'].shelf).toBe('wines-liqueurs')
    expect(INGREDIENT_OVERRIDES['sweet-vermouth'].vessel).toBe('wine')
  })
})
