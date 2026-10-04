/**
 * The serve economics sheet. The numbers a venue reads must follow from the
 * live rum price and the stated assumptions, and the gross profit must be
 * measured the way a bar measures it: on the ex VAT menu price.
 */
import { describe, expect, it } from 'vitest'
import {
  MENU_PRICES_P,
  SERVES,
  SERVES_PER_BOTTLE,
  buildCostP,
  exVatP,
  grossProfitPct,
  rumPerServeP,
  servesPerCase,
} from '@/lib/trade-portal/serve-economics'

describe('serve economics', () => {
  it('gets fourteen 50ml serves from a 700ml bottle', () => {
    expect(SERVES_PER_BOTTLE).toBe(14)
    expect(servesPerCase(6)).toBe(84)
  })

  it('prices a pour from the bottle price', () => {
    // £30.00 ex VAT a bottle, the standard trade rate on a £40 bottle.
    expect(rumPerServeP(3000)).toBe(214)
    // £28.50 ex VAT a bottle, the standard rate inside a six-bottle case.
    expect(rumPerServeP(2850)).toBe(204)
  })

  it('measures gross profit on the ex VAT menu price', () => {
    expect(exVatP(900)).toBe(750)
    const oldStandard = SERVES.find((s) => s.slug === 'the-old-standard')!
    const build = buildCostP(oldStandard, 214)
    expect(build).toBe(241)
    expect(grossProfitPct(1000, build)).toBe(71)
    expect(grossProfitPct(800, build)).toBe(64)
  })

  it('keeps every serve on the sheet inside a sensible range at every menu price', () => {
    for (const serve of SERVES) {
      for (const menu of MENU_PRICES_P) {
        const pct = grossProfitPct(menu, buildCostP(serve, 214))
        expect(pct).toBeGreaterThan(40)
        expect(pct).toBeLessThan(80)
      }
    }
  })

  it('has four serves, each with a build, a placement and an assumption a venue can check', () => {
    expect(SERVES).toHaveLength(4)
    for (const serve of SERVES) {
      expect(serve.build.length).toBeGreaterThan(20)
      expect(serve.assumes.length).toBeGreaterThan(10)
      expect(serve.placement.length).toBeGreaterThan(10)
      expect(serve.touches).toBeGreaterThan(0)
      expect(serve.seconds).toBeGreaterThan(0)
    }
  })
})
