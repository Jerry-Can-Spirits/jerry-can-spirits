import { describe, it, expect } from 'vitest'
import { buildMoversReport } from '@/lib/pouriq/movers'

const NOW = new Date('2026-06-26T00:00:00Z') // cutoff = 2026-05-27

describe('buildMoversReport', () => {
  it('reports no sales when nothing was ever sold', () => {
    const r = buildMoversReport(
      [{ id: 'a', name: 'Daiquiri' }],
      [{ cocktail_id: 'a', period_end: '2026-06-25', units_sold: 0 }],
      NOW,
    )
    expect(r.has_sales).toBe(false)
    expect(r.top_sellers).toEqual([])
    expect(r.not_selling).toEqual([])
  })

  it('includes a period ending inside the window and excludes one just before the cutoff', () => {
    const r = buildMoversReport(
      [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      [
        { cocktail_id: 'a', period_end: '2026-05-27', units_sold: 40 }, // == cutoff, in window
        { cocktail_id: 'b', period_end: '2026-05-26', units_sold: 40 }, // before cutoff, out of window
      ],
      NOW,
    )
    expect(r.top_sellers.find((e) => e.cocktail_id === 'a')?.units).toBe(40)
    // b sold, but not in window -> not_selling, with a last_sold date
    const b = r.not_selling.find((e) => e.cocktail_id === 'b')
    expect(b?.units).toBe(0)
    expect(b?.last_sold).toBe('2026-05-26')
  })

  it('splits top and slow sellers at the 70%-of-average threshold', () => {
    // total = 100 over 4 drinks -> avg 25 -> threshold 17.5
    const r = buildMoversReport(
      [
        { id: 'a', name: 'A' }, { id: 'b', name: 'B' },
        { id: 'c', name: 'C' }, { id: 'd', name: 'D' },
      ],
      [
        { cocktail_id: 'a', period_end: '2026-06-20', units_sold: 60 },
        { cocktail_id: 'b', period_end: '2026-06-20', units_sold: 30 },
        { cocktail_id: 'c', period_end: '2026-06-20', units_sold: 10 }, // below 17.5 -> slow
        { cocktail_id: 'd', period_end: '2026-06-20', units_sold: 0 },  // dead
      ],
      NOW,
    )
    expect(r.top_sellers.map((e) => e.cocktail_id)).toEqual(['a', 'b'])
    expect(r.slow_sellers.map((e) => e.cocktail_id)).toEqual(['c'])
    expect(r.not_selling.map((e) => e.cocktail_id)).toEqual(['d'])
  })

  it('orders not_selling oldest-sale first, never-sold last', () => {
    const r = buildMoversReport(
      [
        { id: 'new', name: 'NeverSold' },
        { id: 'old', name: 'LongDead' },
        { id: 'mid', name: 'RecentlyDead' },
        { id: 'live', name: 'Seller' },
      ],
      [
        { cocktail_id: 'live', period_end: '2026-06-20', units_sold: 50 },
        { cocktail_id: 'old', period_end: '2026-01-10', units_sold: 20 },
        { cocktail_id: 'mid', period_end: '2026-04-10', units_sold: 20 },
      ],
      NOW,
    )
    expect(r.not_selling.map((e) => e.cocktail_id)).toEqual(['old', 'mid', 'new'])
    expect(r.not_selling.find((e) => e.cocktail_id === 'new')?.last_sold).toBeNull()
  })
})
