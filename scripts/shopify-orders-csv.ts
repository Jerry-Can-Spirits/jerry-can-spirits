/**
 * Shopify's Orders → Export CSV as webhook-shaped orders, so the bottle-map
 * back-fill can read every order when the Admin API can see only the last 60
 * days (the store's custom app cannot be granted read_all_orders).
 *
 * The export writes one row per line item. Order-level columns are filled on
 * an order's first row and usually blank on the rest, so rows are grouped by
 * Id (the numeric order id), by Name (#1001) when Id is blank, and the first
 * non-blank value in the group stands for each order-level column. Line items
 * carry a SKU and no product id; the caller counts bottles by SKU
 * (countBottlesBySku in src/lib/product-formats.ts). Only the columns the map
 * rules read are kept.
 */

import type { ShopifyOrder } from '../src/lib/shopify-webhooks'

/** RFC 4180: quoted fields may hold commas, newlines and doubled quotes. A leading BOM is dropped. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c !== '"') field += c
      else if (src[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = false
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** "2026-04-06 10:00:00 +0100", the export's form, as the ISO string the webhook sends. */
export function isoDate(exported: string): string {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/.exec(exported.trim())
  return m ? `${m[1]}T${m[2]}${m[3]}:${m[4]}` : exported.trim()
}

/** The export's Note Attributes cell: one "key: value" per line. */
export function noteAttributes(cell: string): { name: string; value: string }[] {
  return cell
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(':')
      return colon < 0
        ? { name: line, value: '' }
        : { name: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim() }
    })
}

export interface ShopifyExport {
  /** Data rows in the file, the header aside. */
  rows: number
  orders: ShopifyOrder[]
}

const REQUIRED_COLUMNS = ['Name', 'Created at', 'Lineitem sku', 'Lineitem quantity', 'Shipping Country']

export function ordersFromShopifyExport(text: string): ShopifyExport {
  const [header, ...data] = parseCsv(text)
  if (!header) throw new Error('empty CSV')
  const col = new Map(header.map((h, i) => [h.trim(), i]))
  for (const name of REQUIRED_COLUMNS) {
    if (!col.has(name)) throw new Error(`not a Shopify orders export: no "${name}" column`)
  }
  const cell = (row: string[], name: string) => row[col.get(name) ?? -1]?.trim() ?? ''

  // Group by order. A continuation row may carry Name without Id, or neither.
  const groups = new Map<string, string[][]>()
  const idByName = new Map<string, string>()
  let rows = 0
  let lastKey = ''
  for (const row of data) {
    if (row.every((c) => c.trim() === '')) continue
    rows++
    const id = cell(row, 'Id')
    const name = cell(row, 'Name')
    if (id && name) idByName.set(name, id)
    const key = id || (name && idByName.get(name)) || name || lastKey
    if (!key) throw new Error(`row ${rows} has no Id or Name and follows no order`)
    lastKey = key
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  const first = (group: string[][], name: string) => group.map((r) => cell(r, name)).find(Boolean) ?? ''
  const orders: ShopifyOrder[] = []
  for (const group of groups.values()) {
    const name = first(group, 'Name')
    const country = first(group, 'Shipping Country')
    const code = first(group, 'Discount Code')
    orders.push({
      id: Number(first(group, 'Id') || name.replace(/\D/g, '')),
      order_number: Number(name.replace(/\D/g, '')),
      name,
      created_at: isoDate(first(group, 'Created at')),
      email: first(group, 'Email') || undefined,
      // The standard export has no test column; honoured when one is present.
      test: first(group, 'Test').toLowerCase() === 'true',
      cancelled_at: first(group, 'Cancelled at') || null,
      financial_status: first(group, 'Financial Status') || null,
      tags: first(group, 'Tags'),
      fulfillment_status: null,
      note_attributes: noteAttributes(first(group, 'Note Attributes')),
      discount_codes: code
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => ({ code: c, amount: '', type: '' })),
      shipping_address: country
        ? {
            country_code: country,
            country: '',
            city: first(group, 'Shipping City') || null,
            zip: first(group, 'Shipping Zip') || null,
          }
        : null,
      line_items: group.map((r) => ({
        title: cell(r, 'Lineitem name'),
        quantity: Number(cell(r, 'Lineitem quantity')) || 0,
        product_id: 0,
        sku: cell(r, 'Lineitem sku') || null,
      })),
    })
  }
  return { rows, orders }
}
