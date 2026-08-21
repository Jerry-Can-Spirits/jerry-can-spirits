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

  it('accepts a quarter and three quarters of an ounce', () => {
    // Dan's ruling of 16 August 2026, which closed an inconsistency: the policy
    // took 30, 45 and 60 as one, one and a half and two ounces, then rejected
    // 7.5 and 22.5, which are a quarter and three quarters of the same ounce.
    // That left 31 of our own IBA-attributed pages failing our own test.
    expect([7.5, 22.5].every(isPourable)).toBe(true)
  })

  it('accepts both ends of the 20/40 jigger', () => {
    // Same ruling, same inconsistency. 20ml was already accepted and appears 77
    // times; 40 is the other end of the jigger it is marked on.
    expect([20, 40].every(isPourable)).toBe(true)
  })

  it('rejects what is left, which is the genuinely odd', () => {
    // 22ml converts from nothing: three quarters of an ounce is 22.18ml, which
    // rounds to 22.5, and this was truncated somewhere upstream. It stays
    // unpourable so the repair keeps finding it if it recurs.
    expect(isPourable(22)).toBe(false)
    expect(isPourable(35)).toBe(false)
    expect(isPourable(52.5)).toBe(false)
  })

  it('leaves jug quantities alone', () => {
    // A 330ml can and a 300ml punch measure are poured from the container.
    expect(awkward([300, 330, 22])).toEqual([22])
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
  it('leaves a recipe alone when every line already pours', () => {
    // Three quarters of an ounce is the recipe in a New Era drink rather than a
    // conversion artefact — the Last Word and the Naked and Famous are four
    // equal parts of it — so since the 16 August ruling this needs no rescuing.
    expect(scaleOptions([22.5, 22.5, 22.5])[0]).toBe(1)
    expect(scaleOptions([45, 22.5])[0]).toBe(1)
  })

  it('repairs a truncated measure rather than inflating the drink', () => {
    // 22 is a truncation of 22.5, so the nearest pourable value is the number it
    // was truncated from. Scaling it to 25 would correct a typo by making the
    // drink an eighth larger.
    const [k] = scaleOptions([22, 22, 22, 22])
    expect(22 * k).toBeCloseTo(22.5, 6)
  })

  it('scales a genuinely odd measure onto the nearest pourable one', () => {
    // 35ml is neither an ounce measure nor a mark on either jigger.
    const [k] = scaleOptions([35])
    expect(35 * k).toBeCloseTo(37.5, 6)
  })

  it('prefers the factor that moves the drink least, once direction is settled', () => {
    const options = scaleOptions([20])
    expect(options[0]).toBe(1)
  })

  it('offers nothing when one factor cannot clear every line', () => {
    // 35 wants scaling up and 20 is already pourable. Every factor that lands
    // the first takes the second off a mark, and none lands both.
    expect(scaleOptions([35, 20])).toEqual([])
  })

  it('does not rescue a recipe by changing how much is in the glass', () => {
    // Scaling is honest only while it changes nothing a drinker can taste. A
    // factor outside 0.8 to 1.25 is a bigger or smaller drink, not the same one
    // measured differently, so it is reported as a decision instead.
    for (const k of scaleOptions([35, 52.5])) {
      expect(k).toBeGreaterThanOrEqual(0.8)
      expect(k).toBeLessThanOrEqual(1.25)
    }
  })
})
