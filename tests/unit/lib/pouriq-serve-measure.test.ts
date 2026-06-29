import { describe, it, expect } from 'vitest'
import { formatServeMeasure, serveUnitsFor, parsePackFormat } from '@/lib/pouriq/measures'

describe('formatServeMeasure', () => {
  describe('ml and g units', () => {
    it('formats ml with no pluralisation', () => {
      expect(formatServeMeasure('ml', 50, 50, null)).toBe('50 ml')
    })

    it('formats ml with a decimal qty', () => {
      expect(formatServeMeasure('ml', 12.5, 12.5, null)).toBe('12.5 ml')
    })

    it('formats g with no pluralisation', () => {
      expect(formatServeMeasure('g', 5, null, null)).toBe('5 g')
    })
  })

  describe('dash pluralisation (-sh ending)', () => {
    it('keeps singular for 1 dash', () => {
      expect(formatServeMeasure('dash', 1, null, null)).toBe('1 dash')
    })

    it('pluralises to dashes for 2 dashes', () => {
      expect(formatServeMeasure('dash', 2, null, null)).toBe('2 dashes')
    })
  })

  describe('bean and other regular units', () => {
    it('keeps singular for 1 bean', () => {
      expect(formatServeMeasure('bean', 1, null, null)).toBe('1 bean')
    })

    it('pluralises to beans for 3 beans', () => {
      expect(formatServeMeasure('bean', 3, null, null)).toBe('3 beans')
    })
  })

  describe('wedge (-e ending, not a sibilant)', () => {
    it('keeps singular for 1 wedge', () => {
      expect(formatServeMeasure('wedge', 1, null, null)).toBe('1 wedge')
    })

    it('pluralises to wedges for 2 wedges', () => {
      expect(formatServeMeasure('wedge', 2, null, null)).toBe('2 wedges')
    })
  })

  describe('barspoon (-n ending)', () => {
    it('keeps singular for 1 barspoon', () => {
      expect(formatServeMeasure('barspoon', 1, null, null)).toBe('1 barspoon')
    })

    it('pluralises to barspoons for 2 barspoons', () => {
      expect(formatServeMeasure('barspoon', 2, null, null)).toBe('2 barspoons')
    })
  })

  describe('draught and wine serve presets', () => {
    it('formats a single pint', () => {
      expect(formatServeMeasure('pint', 1, 568, null)).toBe('1 pint')
    })

    it('pluralises half pint to half pints', () => {
      expect(formatServeMeasure('half pint', 2, 568, null)).toBe('2 half pints')
    })

    it('pluralises a wine glass with -es (glass -> glasses)', () => {
      expect(formatServeMeasure('large glass', 2, 500, null)).toBe('2 large glasses')
    })
  })

  describe('fallback to base-amount fields (recipe_unit is null)', () => {
    it('falls back to pour_ml when recipe_unit is null', () => {
      expect(formatServeMeasure(null, null, 50, null)).toBe('50ml')
    })

    it('falls back to pour_ml even when recipe_qty is also null', () => {
      expect(formatServeMeasure(null, null, 25, null)).toBe('25ml')
    })

    it('falls back to unit_count singular', () => {
      expect(formatServeMeasure(null, null, null, 1)).toBe('1 unit')
    })

    it('falls back to unit_count plural', () => {
      expect(formatServeMeasure(null, null, null, 3)).toBe('3 units')
    })

    it('returns empty string when all fields are null', () => {
      expect(formatServeMeasure(null, null, null, null)).toBe('')
    })
  })
})

describe('parsePackFormat', () => {
  it('parses "N × Mml" (unicode times) into {purchase_qty, pack_size}', () => {
    expect(parsePackFormat('Peroni Nastro Azzurro 24 × 330ml')).toEqual({ purchase_qty: 24, pack_size: 330 })
  })
  it('parses "N x Mml" (ascii x) with no spaces', () => {
    expect(parsePackFormat('Heineken 12x330ml')).toEqual({ purchase_qty: 12, pack_size: 330 })
  })
  it('converts cl to ml (×10)', () => {
    expect(parsePackFormat('Gordon\'s Gin 6 x 70cl')).toEqual({ purchase_qty: 6, pack_size: 700 })
  })
  it('converts L to ml (×1000)', () => {
    expect(parsePackFormat('Cola 12 x 1L')).toEqual({ purchase_qty: 12, pack_size: 1000 })
  })
  it('is case-insensitive for unit (CL, ML, L)', () => {
    expect(parsePackFormat('Tonic 24 x 200ML')).toEqual({ purchase_qty: 24, pack_size: 200 })
    expect(parsePackFormat('Soda 6 x 1.5L')).toEqual({ purchase_qty: 6, pack_size: 1500 })
  })
  it('returns null when there is no count (bare size only)', () => {
    expect(parsePackFormat('Whisky 1L')).toBeNull()
    expect(parsePackFormat('Rum 700ml')).toBeNull()
  })
  it('returns null when the name has no volume at all', () => {
    expect(parsePackFormat('House Gin')).toBeNull()
    expect(parsePackFormat('')).toBeNull()
  })
})

describe('serveUnitsFor', () => {
  it('offers pint and wine-glass presets for ml ingredients', () => {
    const names = serveUnitsFor('ml', []).map((u) => u.name)
    expect(names).toContain('pint')
    expect(names).toContain('large glass')
    expect(names).toContain('ml')
  })

  it('does not offer ml-only presets for each-based ingredients', () => {
    const names = serveUnitsFor('each', []).map((u) => u.name)
    expect(names).not.toContain('pint')
    expect(names).toEqual(['item'])
  })
})
