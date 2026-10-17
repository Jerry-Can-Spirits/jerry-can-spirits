/**
 * The orders export is the bottle-map back-fill's source when the Admin API
 * can see only 60 days. Every row here is invented: the names, addresses and
 * emails are fixtures, not customers, and the test also checks that none of
 * them survive into the order the map rules read.
 */
import { describe, expect, it } from 'vitest'
import { bottleMapRowFromOrder } from '@/lib/bottle-map'
import { countBottlesBySku } from '@/lib/product-formats'
import { TRADE_ACCOUNT_ATTRIBUTE } from '@/lib/trade-portal/orders'
import { isoDate, noteAttributes, ordersFromShopifyExport, parseCsv } from '../../../scripts/shopify-orders-csv'

// A subset of Shopify's export columns, in its order.
const HEADER = [
  'Name',
  'Email',
  'Financial Status',
  'Paid at',
  'Fulfillment Status',
  'Currency',
  'Subtotal',
  'Total',
  'Discount Code',
  'Created at',
  'Lineitem quantity',
  'Lineitem name',
  'Lineitem price',
  'Lineitem sku',
  'Shipping Name',
  'Shipping Address1',
  'Shipping City',
  'Shipping Zip',
  'Shipping Province',
  'Shipping Country',
  'Note Attributes',
  'Cancelled at',
  'Id',
  'Tags',
  'Source',
] as const
type Column = (typeof HEADER)[number]
type Cells = Partial<Record<Column, string>>

const quote = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const row = (cells: Cells) => HEADER.map((h) => quote(cells[h] ?? '')).join(',')
const csv = (rows: string[]) => [HEADER.join(','), ...rows].join('\n') + '\n'

const line = (sku: string, quantity: string, title: string): Cells => ({
  'Lineitem sku': sku,
  'Lineitem quantity': quantity,
  'Lineitem name': title,
  'Lineitem price': '40.00',
})
const BOTTLE = line('JCSES7040-DP', '1', 'Expedition Spiced Rum')
const TWO_BOTTLES = line('JCSES7040-DP', '2', 'Expedition Spiced Rum')
const SIX_PACK = line('JCSES7040-DP-X6', '1', 'Expedition Pack, 6 bottles')
const BOX = line('SKU-1109', '1', 'Presentation Box')
const GIFT_PACK = line('RUM-SPICED-002', '1', 'Premium Gift Pack')
const GIFT_SET = line('JCSES-GIFTSET', '1', 'Expedition Spiced Rum, Gift Boxed')
const BAR_BLADE = line('JCS-FIXTURE-BLADE', '2', 'Jerry Can Spirits Bar Blade')

/** Order-level cells for a paid UK order; Shopify fills these on the first row only. */
const uk = (name: string, id: string, created: string): Cells => ({
  Name: name,
  Id: id,
  Email: `${name.slice(1)}@example.com`,
  'Financial Status': 'paid',
  'Paid at': created,
  'Fulfillment Status': 'fulfilled',
  Currency: 'GBP',
  Subtotal: '40.00',
  Total: '40.00',
  'Created at': created,
  'Shipping Name': 'Fixture Customer',
  'Shipping Address1': '1 Example Street',
  'Shipping City': 'Blackpool',
  'Shipping Zip': 'FY1 1AA',
  'Shipping Province': 'ENG',
  'Shipping Country': 'GB',
  Source: 'web',
})

/** One order as Shopify writes it: order cells on the first line item, Name alone on the rest. */
const order = (fields: Cells, first: Cells, ...rest: Cells[]) => [
  row({ ...fields, ...first }),
  ...rest.map((l) => row({ Name: fields.Name, ...l })),
]

const FIXTURE = csv([
  // Two line items; the shipping name carries a comma, so it is quoted.
  ...order({ ...uk('#2001', '7000000002001', '2026-05-03 14:22:10 +0100'), 'Shipping Name': 'Customer, Fixture' }, BOTTLE, BOX),
  ...order({ ...uk('#2002', '7000000002002', '2026-05-04 09:00:00 +0100'), 'Cancelled at': '2026-05-05 10:00:00 +0100' }, BOTTLE),
  ...order(
    {
      ...uk('#2003', '7000000002003', '2026-05-06 11:30:00 +0100'),
      'Discount Code': 'TRADE-FIXTURE',
      'Note Attributes': '_trade_account_id: acct_fixture_1\nsource: trade-portal',
    },
    SIX_PACK,
  ),
  ...order(
    {
      ...uk('#2004', '7000000002004', '2026-05-07 16:45:00 +0100'),
      'Shipping City': 'Brussels',
      'Shipping Zip': '1000',
      'Shipping Province': '',
      'Shipping Country': 'BE',
    },
    BOTTLE,
  ),
  ...order(
    {
      ...uk('#2005', '7000000002005', '2026-05-08 12:00:00 +0100'),
      'Shipping City': 'Belfast',
      'Shipping Zip': 'BT1 5GS',
      'Shipping Province': 'NIR',
    },
    GIFT_PACK,
  ),
  // The gift-boxed bundle, once with its component lines and once alone.
  ...order(uk('#2006', '7000000002006', '2026-10-17 10:00:00 +0100'), GIFT_SET, BOTTLE, BOX),
  ...order(uk('#2007', '7000000002007', '2026-10-17 11:00:00 +0100'), GIFT_SET),
  // No Id anywhere, and a continuation row with no Name either.
  row({ ...uk('#2008', '', '2026-05-09 08:15:00 +0100'), ...TWO_BOTTLES }),
  row(BAR_BLADE),
  ...order({ ...uk('#2009', '7000000002009', '2026-05-10 08:15:00 +0100'), 'Financial Status': 'refunded' }, BOTTLE),
  ...order({ ...uk('#2010', '7000000002010', '2026-05-11 08:15:00 +0100'), Tags: 'Trade, wholesale' }, SIX_PACK),
  ...order(uk('#2011', '7000000002011', '2026-05-12 08:15:00 +0100'), BAR_BLADE),
])

const decide = (text: string) =>
  new Map(
    ordersFromShopifyExport(text).orders.map((o) => [
      o.name,
      { order: o, ...bottleMapRowFromOrder(o, false, countBottlesBySku(o.line_items)) },
    ]),
  )

describe('parseCsv', () => {
  it('reads quoted commas, quoted newlines and doubled quotes', () => {
    expect(parseCsv('a,"b, c","d ""e""\nf",\n1,2,3,4\n')).toEqual([
      ['a', 'b, c', 'd "e"\nf', ''],
      ['1', '2', '3', '4'],
    ])
  })

  it('accepts CRLF line ends and a byte order mark', () => {
    expect(parseCsv('﻿Name,Id\r\n#1,2\r\n')).toEqual([
      ['Name', 'Id'],
      ['#1', '2'],
    ])
  })

  it('keeps a last line without a newline', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('export cells', () => {
  it('turns the export timestamp into the ISO form the webhook sends', () => {
    expect(isoDate('2026-05-03 14:22:10 +0100')).toBe('2026-05-03T14:22:10+01:00')
    expect(isoDate('2026-01-15 09:00:00 +0000')).toBe('2026-01-15T09:00:00+00:00')
    expect(isoDate('2026-05-03T13:22:10Z')).toBe('2026-05-03T13:22:10Z')
  })

  it('reads one note attribute per line', () => {
    expect(noteAttributes('_trade_account_id: acct_fixture_1\nsource: trade-portal\n')).toEqual([
      { name: '_trade_account_id', value: 'acct_fixture_1' },
      { name: 'source', value: 'trade-portal' },
    ])
    expect(noteAttributes('')).toEqual([])
  })
})

describe('ordersFromShopifyExport', () => {
  it('groups line-item rows into orders and counts both', () => {
    const parsed = ordersFromShopifyExport(FIXTURE)
    expect(parsed.rows).toBe(15)
    expect(parsed.orders).toHaveLength(11)
    expect(parsed.orders.map((o) => o.name)).toEqual([
      '#2001', '#2002', '#2003', '#2004', '#2005', '#2006', '#2007', '#2008', '#2009', '#2010', '#2011',
    ])
  })

  it('carries order-level cells forward from the first row of the group', () => {
    const first = ordersFromShopifyExport(FIXTURE).orders[0]
    expect(first.id).toBe(7000000002001)
    expect(first.order_number).toBe(2001)
    expect(first.created_at).toBe('2026-05-03T14:22:10+01:00')
    expect(first.email).toBe('2001@example.com')
    expect(first.financial_status).toBe('paid')
    expect(first.cancelled_at).toBeNull()
    expect(first.shipping_address).toEqual({ country_code: 'GB', country: '', city: 'Blackpool', zip: 'FY1 1AA' })
    expect(first.line_items).toEqual([
      { title: 'Expedition Spiced Rum', quantity: 1, product_id: 0, sku: 'JCSES7040-DP' },
      { title: 'Presentation Box', quantity: 1, product_id: 0, sku: 'SKU-1109' },
    ])
  })

  it('falls back to the order name when Id is blank, and keeps a nameless row with its order', () => {
    const o = ordersFromShopifyExport(FIXTURE).orders.find((x) => x.name === '#2008')!
    expect(o.id).toBe(2008)
    expect(o.line_items.map((li) => li.sku)).toEqual(['JCSES7040-DP', 'JCS-FIXTURE-BLADE'])
  })

  it('keeps the trade markers the attribution rules read', () => {
    const o = ordersFromShopifyExport(FIXTURE).orders.find((x) => x.name === '#2003')!
    expect(o.note_attributes).toContainEqual({ name: TRADE_ACCOUNT_ATTRIBUTE, value: 'acct_fixture_1' })
    expect(o.discount_codes).toEqual([{ code: 'TRADE-FIXTURE', amount: '', type: '' }])
  })

  it('drops the name, street and province', () => {
    const text = JSON.stringify(ordersFromShopifyExport(FIXTURE).orders)
    for (const s of ['Fixture Customer', 'Customer, Fixture', 'Example Street', 'ENG', 'NIR']) {
      expect(text).not.toContain(s)
    }
  })

  it('reads the same orders through a byte order mark', () => {
    expect(ordersFromShopifyExport('﻿' + FIXTURE)).toEqual(ordersFromShopifyExport(FIXTURE))
  })

  it('refuses a file that is not an orders export', () => {
    expect(() => ordersFromShopifyExport('Handle,Title\nrum,Rum\n')).toThrow(/orders export/)
    expect(() => ordersFromShopifyExport('')).toThrow(/empty/)
  })
})

describe('export orders through the map rules', () => {
  const decisions = decide(FIXTURE)

  it('maps a UK order to its district, town and bottle count', () => {
    expect(decisions.get('#2001')!.row).toEqual({
      order_id: '7000000002001',
      created_at: '2026-05-03T14:22:10+01:00',
      country: 'GB',
      outward_code: 'FY1',
      town: 'Blackpool',
      bottles: 1,
    })
  })

  it('treats Northern Ireland as the UK and an order abroad by town and country', () => {
    expect(decisions.get('#2005')!.row).toMatchObject({ country: 'GB', outward_code: 'BT1', town: 'Belfast', bottles: 1 })
    expect(decisions.get('#2004')!.row).toMatchObject({ country: 'BE', outward_code: null, town: 'Brussels', bottles: 1 })
    expect(JSON.stringify(decisions.get('#2004')!.row)).not.toContain('1000')
  })

  it('counts the gift-boxed bundle once in either shape', () => {
    expect(decisions.get('#2006')!.row?.bottles).toBe(1)
    expect(decisions.get('#2007')!.row?.bottles).toBe(1)
  })

  it('counts by SKU and quantity', () => {
    expect(decisions.get('#2008')!.row?.bottles).toBe(2)
    expect(decisions.get('#2011')!.skip).toBe('no_bottles')
  })

  it('excludes cancelled, refunded and tagged trade orders', () => {
    expect(decisions.get('#2002')!.skip).toBe('cancelled')
    expect(decisions.get('#2009')!.skip).toBe('refunded')
    expect(decisions.get('#2010')!.skip).toBe('trade')
  })

  it('leaves the stamped trade order to the caller, as the API path does', () => {
    const o = decisions.get('#2003')!.order
    expect(bottleMapRowFromOrder(o, true, countBottlesBySku(o.line_items)).skip).toBe('trade')
    expect(decisions.get('#2003')!.row?.bottles).toBe(6)
  })
})
