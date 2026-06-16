import { describe, it, expect } from 'vitest'
import { normalise, bestGuessCocktail } from '@/lib/pouriq/pos/match'
import { bucketLines } from '@/lib/pouriq/pos/volume-buckets'

describe('normalise', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalise("Esp.  Martini")).toBe('esp martini')
    expect(normalise("L'Espresso,  Martini")).toBe('lespresso martini')
    expect(normalise('  RUM   PUNCH ')).toBe('rum punch')
  })
})

describe('bestGuessCocktail', () => {
  const cocktails = [
    { id: 'a', name: 'Espresso Martini' },
    { id: 'b', name: 'Rum Punch' },
    { id: 'c', name: 'Negroni' },
  ]

  it('returns the nearest cocktail by edit distance, beyond the auto-match threshold', () => {
    expect(bestGuessCocktail('Esp Martini', cocktails)?.id).toBe('a')
    expect(bestGuessCocktail('rumpunch', cocktails)?.id).toBe('b')
  })

  it('returns null when there are no cocktails', () => {
    expect(bestGuessCocktail('Anything', [])).toBeNull()
  })
})

describe('bucketLines', () => {
  const cid = 'cocktail-1'

  it('sums quantities for lines in the same weekly period', () => {
    const out = bucketLines({ volume_cadence: 'weekly' }, [
      { cocktail_id: cid, quantity: 2, sold_at: '2026-06-16T10:00:00Z' }, // Tue
      { cocktail_id: cid, quantity: 3, sold_at: '2026-06-17T22:00:00Z' }, // Wed, same ISO week
    ])
    expect(out).toHaveLength(1)
    expect(out[0].units).toBe(5)
    expect(out[0].cocktailId).toBe(cid)
  })

  it('splits the same cocktail across different weekly periods', () => {
    const out = bucketLines({ volume_cadence: 'weekly' }, [
      { cocktail_id: cid, quantity: 1, sold_at: '2026-06-16T10:00:00Z' }, // week of 15 Jun
      { cocktail_id: cid, quantity: 4, sold_at: '2026-06-25T10:00:00Z' }, // following week
    ])
    expect(out).toHaveLength(2)
    expect(out.reduce((s, e) => s + e.units, 0)).toBe(5)
  })

  it('sums quantities for lines in the same month under monthly cadence', () => {
    const out = bucketLines({ volume_cadence: 'monthly' }, [
      { cocktail_id: cid, quantity: 2, sold_at: '2026-06-02T10:00:00Z' },
      { cocktail_id: cid, quantity: 6, sold_at: '2026-06-28T10:00:00Z' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].units).toBe(8)
  })
})
