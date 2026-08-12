/**
 * The rule this encodes: a UK household jigger is 25/50 with a 12.5 mark, so a
 * 22.5ml line cannot be poured with one. The fix is to scale the whole recipe,
 * not to round the line, because rounding one measure changes the balance
 * against every other and scaling changes nothing a drinker can taste.
 */
import { describe, it, expect } from 'vitest'
import { awkward, isPourable, parseMl, scaleOptions } from '../../../scripts/measures'

describe('what a household jigger can pour', () => {
  it('accepts the jigger and its mark', () => {
    expect([12.5, 25, 37.5, 50].every(isPourable)).toBe(true)
  })

  it('accepts the short measures that stay as they are', () => {
    // Dan's ruling: 10ml and 15ml persist throughout the corpus, are poured
    // with a spoon, and are not the problem.
    expect([5, 10, 15, 20].every(isPourable)).toBe(true)
  })

  it('accepts one, one and a half, and two ounces', () => {
    // Dan's ruling of 12 August 2026. 30/45/60 are 378 of the corpus's lines
    // against 165 for 25/50, and converting them takes a sixth out of the drink
    // to fix a pour a 25ml jigger reads as "one and a bit" either way.
    expect([30, 45, 60].every(isPourable)).toBe(true)
  })

  it('rejects the measures that are neither an ounce nor a jigger pour', () => {
    // 22ml is a truncation of the 22.5ml that three quarters of an ounce
    // actually converts to, and the corpus carries both.
    expect(isPourable(22)).toBe(false)
    expect(isPourable(22.5)).toBe(false)
    expect(isPourable(7.5)).toBe(false)
    expect(isPourable(40)).toBe(false)
  })

  it('leaves jug quantities alone', () => {
    // A 330ml can and a 300ml punch measure are poured from the container.
    expect(awkward([300, 330, 22.5])).toEqual([22.5])
  })
})

describe('reading an amount string', () => {
  it('takes the measure at the front', () => {
    expect(parseMl('50ml')).toBe(50)
    expect(parseMl('22.5ml')).toBe(22.5)
    expect(parseMl('150ml, warmed')).toBe(150)
  })

  it('ignores anything that is not a poured measure', () => {
    // A top-up, an alternative to an egg, and a range are all approximations
    // already, and treating them as exact measures would invent precision.
    expect(parseMl('Top (approximately 90ml)')).toBeNull()
    expect(parseMl('1 (or 30ml aquafaba)')).toBeNull()
    expect(parseMl('100-125ml')).toBeNull()
    expect(parseMl('2 dashes')).toBeNull()
  })
})

describe('scaling a recipe onto the jigger', () => {
  it('turns three equal ounce measures into three jigger measures', () => {
    // Dan's case: 3 × 22.5ml is 3 × 25ml with the drink scaled by a ninth.
    const [k] = scaleOptions([22.5, 22.5, 22.5])
    expect(k).toBeCloseTo(25 / 22.5, 6)
  })

  it('keeps the ratios when the measures differ', () => {
    // 45 + 22.5 is a two-to-one split, and stays one at 50 + 25.
    const [k] = scaleOptions([45, 22.5])
    expect(45 * k).toBeCloseTo(50, 6)
    expect(22.5 * k).toBeCloseTo(25, 6)
  })

  it('scales up to the jigger rather than down to a spoon', () => {
    // Four measures of 22ml are marginally closer to 20 than to 25, and
    // nearest-to-unchanged alone sent the Naked and Famous back as four 20ml
    // pours. 22 becomes 25.
    const [k] = scaleOptions([22, 22, 22, 22])
    expect(22 * k).toBeCloseTo(25, 6)
  })

  it('prefers the factor that moves the drink least, once direction is settled', () => {
    const options = scaleOptions([20])
    expect(options[0]).toBe(1)
  })

  it('offers nothing when one factor cannot clear every line', () => {
    // 22.5 wants a ninth added and 15 is already pourable; the factor that
    // fixes the first breaks the second, and no other lands both.
    expect(scaleOptions([22.5, 15, 5])).toEqual([])
  })

  it('does not rescue a recipe by changing how much is in the glass', () => {
    // An Aviation is 45ml gin with 7.5ml liqueurs, and the only factor that
    // lands every line is a third larger. That is a bigger drink, not the same
    // drink measured differently, so it is reported as a decision instead.
    expect(scaleOptions([45, 15, 15, 7.5])).toEqual([])

    for (const k of scaleOptions([22.5, 45])) {
      expect(k).toBeGreaterThanOrEqual(0.8)
      expect(k).toBeLessThanOrEqual(1.25)
    }
  })
})
