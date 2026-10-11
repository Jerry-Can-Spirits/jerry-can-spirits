import { describe, expect, it } from 'vitest'
import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
  COMMON_DEFAULTS,
  FOLDED_BAR_INGREDIENTS,
  foldedTo,
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

  it('seeds the juices and syrups the recognisable classics need', () => {
    // Cosmopolitan / Woo Woo (cranberry), Hurricane (passion fruit + grenadine),
    // Piña Colada (pineapple) are all buildable from the defaults.
    for (const slug of [
      'fresh-cranberry-juice',
      'fresh-pineapple-juice',
      'grenadine',
      'passion-fruit-syrup',
      'peach-schnapps',
    ]) {
      expect(COMMON_DEFAULTS.has(slug)).toBe(true)
    }
  })

  it('defaults to the generic mixers, not the branded products', () => {
    expect(COMMON_DEFAULTS.has('ginger-beer')).toBe(true)
    expect(COMMON_DEFAULTS.has('tonic-water')).toBe(true)
    expect(COMMON_DEFAULTS.has('fever-tree-ginger-beer')).toBe(false)
  })

  it('shelves fortified wine (vermouth, sherry, port) with the wines & liqueurs', () => {
    // Vermouth carries the correct `fortified` category, so it is placed without
    // any tool-local override.
    expect(shelfForCategory('fortified')).toBe('wines-liqueurs')
    expect(vesselForCategory('fortified')).toBe('wine')
  })
})

describe('folded bar ingredients', () => {
  const idBySlug = new Map([
    ['pineapple', 'ingredient-pineapple'],
    ['chilli', 'ingredient-chilli'],
    ['gin', 'ingredient-gin'],
    ['cherry-brandy', 'ingredient-cherry-brandy'],
  ])

  it('resolves a folded slug from a shared link to the parent id', () => {
    expect(foldedTo('pineapple-chunks', idBySlug)).toBe('ingredient-pineapple')
    expect(foldedTo('red-chilli-pepper', idBySlug)).toBe('ingredient-chilli')
  })

  it('resolves the old cherry brandy slug from a shared link to the renamed page', () => {
    expect(foldedTo('cherry-liqueur-cherry-brandy-style', idBySlug)).toBe('ingredient-cherry-brandy')
  })

  it('resolves a folded id from a saved bar to the parent id', () => {
    expect(foldedTo('532542de-8727-491a-9b5c-105ca1bc7b11', idBySlug)).toBe('ingredient-pineapple')
    expect(foldedTo('ingredient-red-chilli-pepper', idBySlug)).toBe('ingredient-chilli')
  })

  it('leaves anything not folded alone', () => {
    expect(foldedTo('gin', idBySlug)).toBeUndefined()
    expect(foldedTo('ingredient-gin', idBySlug)).toBeUndefined()
  })

  it('never names a folded slug as a quick-start default', () => {
    for (const key of Object.keys(FOLDED_BAR_INGREDIENTS)) expect(COMMON_DEFAULTS.has(key)).toBe(false)
  })
})
