import { describe, expect, it, vi } from 'vitest'
import {
  MIN_BOTTLES_PER_DOT,
  UPSERT_BOTTLE_MAP_SQL,
  bottleDotLabel,
  bottleMapHeadline,
  bottleMapRowFromOrder,
  countryName,
  hasTradeTag,
  outwardCode,
  summariseBottleMap,
  titleCaseTown,
  townKey,
} from '@/lib/bottle-map'
import { upsertBottleMapRow } from '@/lib/bottle-map-d1'
import type { ShopifyOrder } from '@/lib/shopify-webhooks'

// Product ids from BOTTLES_PER_UNIT: the bottle, the six-pack, the presentation
// box (zero) and the Bar Blade (zero). The gift-boxed bundle arrives as its
// component lines, bottle plus box, never as a line of its own.
const BOTTLE = 15224526569849
const SIX_PACK = 15320931172729
const BOX = 15489763017081
const BAR_BLADE = 15245613269369

const li = (product_id: number, quantity = 1) => ({ title: '', product_id, quantity })

function order(overrides: Partial<ShopifyOrder> = {}): ShopifyOrder {
  return {
    id: 6001,
    order_number: 1001,
    created_at: '2026-06-01T10:00:00Z',
    fulfillment_status: null,
    line_items: [li(BOTTLE)],
    shipping_address: { country_code: 'GB', country: 'United Kingdom', city: 'Blackpool', zip: 'FY1 1AA' },
    ...overrides,
  }
}

const abroad = (city: string | null, country_code = 'BE', zip: string | null = '1000') =>
  order({ shipping_address: { country_code, country: '', city, zip } })

describe('outwardCode', () => {
  it('keeps the part before the space, upper-cased', () => {
    expect(outwardCode('FY1 1AA')).toBe('FY1')
    expect(outwardCode('fy4 1aa')).toBe('FY4')
    expect(outwardCode('SW1A 1AA')).toBe('SW1A')
    expect(outwardCode(' ec1a 1bb ')).toBe('EC1A')
    expect(outwardCode('BT1 5GS')).toBe('BT1')
  })

  it('splits a postcode typed without a space at the inward code', () => {
    expect(outwardCode('FY41AA')).toBe('FY4')
    expect(outwardCode('SW1A1AA')).toBe('SW1A')
    expect(outwardCode('B11AA')).toBe('B1')
    expect(outwardCode('B111AA')).toBe('B11')
  })

  it('accepts a bare outward code', () => {
    expect(outwardCode('FY1')).toBe('FY1')
    expect(outwardCode('sw1a')).toBe('SW1A')
  })

  it('rejects anything that is not a UK postcode', () => {
    expect(outwardCode('GIR 0AA')).toBeNull()
    expect(outwardCode('12345')).toBeNull()
    expect(outwardCode('90210')).toBeNull()
    expect(outwardCode('FY1 1A')).toBeNull()
    expect(outwardCode('')).toBeNull()
    expect(outwardCode(null)).toBeNull()
    expect(outwardCode(undefined)).toBeNull()
  })

  it('never returns more than four characters', () => {
    for (const z of ['SW1A 1AA', 'EC1A1BB', 'W1A 0AX', 'M1 1AE', 'CR2 6XH', 'DN55 1PT']) {
      expect(outwardCode(z)!.length).toBeLessThanOrEqual(4)
    }
  })
})

describe('titleCaseTown and townKey', () => {
  it('title-cases what the customer typed and keeps joining words down', () => {
    expect(titleCaseTown('blackpool')).toBe('Blackpool')
    expect(titleCaseTown('  NEWCASTLE UPON TYNE ')).toBe('Newcastle upon Tyne')
    expect(titleCaseTown('stoke-on-trent')).toBe('Stoke-on-Trent')
    expect(titleCaseTown('Barrow-In-Furness')).toBe('Barrow-in-Furness')
    expect(titleCaseTown("bo'ness")).toBe("Bo'ness")
    expect(titleCaseTown('liège')).toBe('Liège')
  })

  it('is null for nothing', () => {
    expect(titleCaseTown('')).toBeNull()
    expect(titleCaseTown('   ')).toBeNull()
    expect(titleCaseTown(null)).toBeNull()
  })

  it('looks towns up without case or accents', () => {
    expect(townKey('Liège')).toBe('liege')
    expect(townKey('  BRUSSELS ')).toBe('brussels')
  })
})

describe('bottleMapRowFromOrder', () => {
  it('maps a paid retail UK order to country, district, town and bottles only', () => {
    const d = bottleMapRowFromOrder(order(), false)
    expect(d.row).toEqual({
      order_id: '6001',
      created_at: '2026-06-01T10:00:00Z',
      country: 'GB',
      outward_code: 'FY1',
      town: 'Blackpool',
      bottles: 1,
    })
    // Nothing else leaks into the row.
    expect(Object.keys(d.row!).sort()).toEqual(['bottles', 'country', 'created_at', 'order_id', 'outward_code', 'town'])
  })

  it('treats Northern Ireland as the UK, by district', () => {
    const d = bottleMapRowFromOrder(
      order({ shipping_address: { country_code: 'GB', country: 'United Kingdom', city: 'Belfast', zip: 'BT1 5GS' } }),
      false,
    )
    expect(d.row).toMatchObject({ country: 'GB', outward_code: 'BT1', town: 'Belfast' })
  })

  it('maps an order abroad to country and town, and never stores the postcode', () => {
    const d = bottleMapRowFromOrder(abroad('brussels', 'be', '1000'), false)
    expect(d.row).toMatchObject({ country: 'BE', outward_code: null, town: 'Brussels', bottles: 1 })
    expect(JSON.stringify(d.row)).not.toContain('1000')
  })

  it('counts bottles the way the rest of the site does', () => {
    expect(bottleMapRowFromOrder(order({ line_items: [li(SIX_PACK)] }), false).row?.bottles).toBe(6)
    expect(bottleMapRowFromOrder(order({ line_items: [li(BOTTLE, 2), li(BAR_BLADE)] }), false).row?.bottles).toBe(2)
    // The gift-boxed bundle: component lines, bottle counted once, box zero.
    expect(bottleMapRowFromOrder(order({ line_items: [li(BOTTLE), li(BOX)] }), false).row?.bottles).toBe(1)
  })

  it('excludes test orders', () => {
    expect(bottleMapRowFromOrder(order({ test: true }), false).skip).toBe('test')
  })

  it('excludes cancelled, refunded and voided orders', () => {
    expect(bottleMapRowFromOrder(order({ cancelled_at: '2026-06-02T10:00:00Z' }), false).skip).toBe('cancelled')
    expect(bottleMapRowFromOrder(order({ financial_status: 'refunded' }), false).skip).toBe('refunded')
    expect(bottleMapRowFromOrder(order({ financial_status: 'VOIDED' }), false).skip).toBe('refunded')
    expect(bottleMapRowFromOrder(order({ financial_status: 'paid' }), false).row).toBeDefined()
    expect(bottleMapRowFromOrder(order({ financial_status: 'partially_refunded' }), false).row).toBeDefined()
  })

  it('excludes trade orders, by attribution or by tag', () => {
    expect(bottleMapRowFromOrder(order(), true).skip).toBe('trade')
    expect(bottleMapRowFromOrder(order({ tags: 'wholesale, Trade' }), false).skip).toBe('trade')
    expect(bottleMapRowFromOrder(order({ customer: { tags: ['trade account'] } }), false).skip).toBe('trade')
    // "tradesman" is not the trade.
    expect(hasTradeTag({ tags: 'tradesman' })).toBe(false)
  })

  it('excludes orders with no shipping country', () => {
    expect(bottleMapRowFromOrder(order({ shipping_address: null }), false).skip).toBe('no_country')
    expect(bottleMapRowFromOrder(order({ shipping_address: { country_code: '', country: '' } }), false).skip).toBe('no_country')
  })

  it('excludes UK orders whose postcode gives no district, but not orders abroad', () => {
    expect(
      bottleMapRowFromOrder(order({ shipping_address: { country_code: 'GB', country: '', city: 'X', zip: '???' } }), false).skip,
    ).toBe('no_outward_code')
    expect(bottleMapRowFromOrder(abroad('Brussels', 'BE', null), false).row?.country).toBe('BE')
  })

  it('excludes orders with no bottles in them', () => {
    expect(bottleMapRowFromOrder(order({ line_items: [li(BAR_BLADE), li(BOX)] }), false).skip).toBe('no_bottles')
  })

  it('takes the bottle count from the caller when the lines carry no product ids', () => {
    // The CSV back-fill counts by SKU; every other rule still applies.
    const noIds = order({ line_items: [{ title: '', product_id: 0, quantity: 1, sku: 'JCSES7040-DP-X6' }] })
    expect(bottleMapRowFromOrder(noIds, false, 6).row?.bottles).toBe(6)
    expect(bottleMapRowFromOrder(noIds, false, 0).skip).toBe('no_bottles')
    expect(bottleMapRowFromOrder(noIds, false).skip).toBe('no_bottles')
    expect(bottleMapRowFromOrder({ ...noIds, cancelled_at: '2026-06-02T10:00:00Z' }, false, 6).skip).toBe('cancelled')
  })

  it('keeps the town null when the city is blank', () => {
    const d = bottleMapRowFromOrder(order({ shipping_address: { country_code: 'GB', country: '', city: ' ', zip: 'FY1 1AA' } }), false)
    expect(d.row?.town).toBeNull()
  })
})

describe('summariseBottleMap', () => {
  it('totals every row and plots UK districts on their centroids', () => {
    const s = summariseBottleMap([
      { country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: 2 },
      { country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: 1 },
      { country: 'GB', outward_code: 'FY4', town: 'Blackpool', bottles: 1 },
      { country: 'GB', outward_code: 'BT1', town: 'Belfast', bottles: 6 },
    ])
    expect(s.bottles).toBe(10)
    expect(s.districts).toBe(3)
    expect(s.countries).toBe(1)
    expect(s.points.map((p) => p.outward_code)).toEqual(['BT1', 'FY1', 'FY4'])
    const fy1 = s.points.find((p) => p.outward_code === 'FY1')!
    expect(fy1.bottles).toBe(3)
    expect(fy1.lat).toBeCloseTo(53.8152, 3)
    expect(fy1.lng).toBeCloseTo(-3.0469, 3)
    expect(fy1.label).toBe('FY1, Blackpool: 3 bottles')
    expect(Object.keys(fy1).sort()).toEqual(['bottles', 'country', 'label', 'lat', 'lng', 'outward_code', 'town'])
    // Northern Ireland has a dot.
    const bt1 = s.points.find((p) => p.outward_code === 'BT1')!
    expect(bt1.lat).toBeGreaterThan(54)
    expect(bt1.lng).toBeLessThan(-5)
  })

  it('plots an order abroad on its town when the table knows it, else on its country', () => {
    const s = summariseBottleMap([
      { country: 'BE', outward_code: null, town: 'Brussels', bottles: 1 },
      { country: 'BE', outward_code: null, town: 'Nowhere In Particular', bottles: 2 },
      { country: 'BE', outward_code: null, town: null, bottles: 1 },
      { country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: 1 },
    ])
    expect(s.bottles).toBe(5)
    expect(s.districts).toBe(1)
    expect(s.countries).toBe(2)
    const brussels = s.points.find((p) => p.town === 'Brussels')!
    expect(brussels).toMatchObject({ outward_code: null, country: 'BE', bottles: 1, label: 'Brussels, Belgium: 1 bottle' })
    expect(brussels.lat).toBeCloseTo(50.85, 1)
    expect(brussels.lng).toBeCloseTo(4.35, 1)
    // The unknown town and the blank town share the country dot.
    const belgium = s.points.find((p) => p.country === 'BE' && p.town === null)!
    expect(belgium).toMatchObject({ bottles: 3, label: 'Belgium: 3 bottles' })
  })

  it('finds a town through its accents and alternative spellings', () => {
    // Rows are title-cased at write time; the lookup strips the accent.
    const liege = summariseBottleMap([{ country: 'BE', outward_code: null, town: 'Liège', bottles: 1 }])
    expect(liege.points[0].label).toBe('Liège, Belgium: 1 bottle')
    expect(liege.points[0].lat).toBeCloseTo(50.63, 1)
    // Bruxelles and Brussel are Brussels.
    const bxl = summariseBottleMap([{ country: 'BE', outward_code: null, town: 'Bruxelles', bottles: 1 }])
    expect(bxl.points[0].lat).toBeCloseTo(50.85, 1)
  })

  it('names a district after the town most of its bottles went to', () => {
    const s = summariseBottleMap([
      { country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: 5 },
      { country: 'GB', outward_code: 'FY1', town: 'Blackpool Town Centre', bottles: 1 },
      { country: 'GB', outward_code: 'FY1', town: null, bottles: 9 },
    ])
    expect(s.points[0].town).toBe('Blackpool')
  })

  it('is empty before the first order', () => {
    expect(summariseBottleMap([])).toEqual({ bottles: 0, districts: 0, countries: 0, points: [] })
  })

  it('applies the per-dot floor to points but not to the totals', () => {
    expect(MIN_BOTTLES_PER_DOT).toBe(1)
    const s = summariseBottleMap([{ country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: MIN_BOTTLES_PER_DOT }])
    expect(s.points).toHaveLength(1)
  })
})

describe('copy', () => {
  it('labels a dot as district, town, count in the UK and town, country, count abroad', () => {
    expect(bottleDotLabel({ outward_code: 'FY1', town: 'Blackpool', country: 'GB', bottles: 3 })).toBe('FY1, Blackpool: 3 bottles')
    expect(bottleDotLabel({ outward_code: 'FY4', town: 'Blackpool', country: 'GB', bottles: 1 })).toBe('FY4, Blackpool: 1 bottle')
    expect(bottleDotLabel({ outward_code: 'FY4', town: null, country: 'GB', bottles: 2 })).toBe('FY4: 2 bottles')
    expect(bottleDotLabel({ outward_code: null, town: 'Brussels', country: 'BE', bottles: 1 })).toBe('Brussels, Belgium: 1 bottle')
    expect(bottleDotLabel({ outward_code: null, town: null, country: 'BE', bottles: 2 })).toBe('Belgium: 2 bottles')
    expect(countryName('US')).toBe('United States')
    expect(countryName('ZZ')).toBe('ZZ')
  })

  it('writes the headline from the totals and hides it before the first row', () => {
    expect(bottleMapHeadline('Batch 001', { bottles: 123, districts: 45, countries: 1 })).toBe(
      'Batch 001: 123 bottles so far, across 45 postcode districts.',
    )
    expect(bottleMapHeadline('Batch 001', { bottles: 124, districts: 45, countries: 2 })).toBe(
      'Batch 001: 124 bottles so far, across 45 postcode districts and 2 countries.',
    )
    expect(bottleMapHeadline('Batch 001', { bottles: 1, districts: 1, countries: 1 })).toBe(
      'Batch 001: 1 bottle so far, across 1 postcode district.',
    )
    expect(bottleMapHeadline('Batch 001', { bottles: 2, districts: 0, countries: 1 })).toBe('Batch 001: 2 bottles so far.')
    expect(bottleMapHeadline('Batch 001', { bottles: 0, districts: 0, countries: 0 })).toBeNull()
  })

  it('carries no exclamation marks or em-dashes', () => {
    for (const s of [
      bottleDotLabel({ outward_code: 'FY1', town: 'Blackpool', country: 'GB', bottles: 3 }),
      bottleMapHeadline('Batch 001', { bottles: 2, districts: 2, countries: 2 })!,
    ]) {
      expect(s).not.toMatch(/[—!]/)
    }
  })
})

describe('upsertBottleMapRow', () => {
  it('writes the same row twice without a second insert', async () => {
    const run = vi.fn().mockResolvedValue({})
    const bind = vi.fn().mockReturnValue({ run })
    const prepare = vi.fn().mockReturnValue({ bind })
    const db = { prepare } as unknown as D1Database
    const row = { order_id: '6001', created_at: '2026-06-01T10:00:00Z', country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: 1 }
    await upsertBottleMapRow(db, row)
    await upsertBottleMapRow(db, row)
    expect(UPSERT_BOTTLE_MAP_SQL).toContain('ON CONFLICT(order_id) DO UPDATE')
    expect(prepare).toHaveBeenCalledTimes(2)
    expect(bind).toHaveBeenCalledWith('6001', '2026-06-01T10:00:00Z', 'GB', 'FY1', 'Blackpool', 1)
    expect(run).toHaveBeenCalledTimes(2)
  })
})
