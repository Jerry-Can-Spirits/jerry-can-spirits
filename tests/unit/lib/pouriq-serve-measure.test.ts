import { describe, it, expect } from 'vitest'
import { formatServeMeasure } from '@/lib/pouriq/measures'

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
