/**
 * Backfill and reconcile the bottle_map table from Shopify.
 *
 * Pages through every order created since --since (default 2026-01-01; the
 * first orders are from January 2026) with the Admin GraphQL API, applies the same rules as the
 * orders/create webhook (src/lib/bottle-map.ts) and reports what the table
 * should hold. Writes nothing unless told to.
 *
 *   # dry run: counts by skip reason and by outward code, nothing written
 *   SHOPIFY_ADMIN_API_TOKEN=... npx tsx scripts/backfill-bottle-map.ts
 *
 *   # write: upsert every row through wrangler against the remote D1
 *   SHOPIFY_ADMIN_API_TOKEN=... npx tsx scripts/backfill-bottle-map.ts --write
 *
 *   # write and prune: also delete rows for orders now cancelled, refunded or
 *   # otherwise excluded (the weekly reconcile)
 *   SHOPIFY_ADMIN_API_TOKEN=... npx tsx scripts/backfill-bottle-map.ts --write --prune
 *
 *   # write the SQL to a file instead of executing it
 *   SHOPIFY_ADMIN_API_TOKEN=... npx tsx scripts/backfill-bottle-map.ts --sql-out=bottle-map.sql
 *
 *   # from a Shopify admin orders export instead of the API: no token needed.
 *   # Shopify admin → Orders → Export → Export: All orders → Export as: Plain
 *   # CSV file; the file arrives by download or email. Dry run, then --write.
 *   npx tsx scripts/backfill-bottle-map.ts --csv="C:\Users\dan\Downloads\orders_export_1.csv"
 *   npx tsx scripts/backfill-bottle-map.ts --csv="C:\Users\dan\Downloads\orders_export_1.csv" --write
 *
 * The token comes from the environment only (the Worker secret of the same
 * name; `node --env-file=.dev.vars --import tsx scripts/backfill-bottle-map.ts`
 * also works). Orders older than 60 days need the read_all_orders scope, which
 * the store's custom app cannot be granted, so the first back-fill and any
 * full reconcile run from the export. --csv replaces the fetch only: --since,
 * --write, --prune, --sql-out and the report are the same in both modes.
 * Bottles are counted by SKU in CSV mode (BOTTLES_PER_SKU), by product id from
 * the API. Delete the export after the run: it holds customer data.
 *
 * Trade exclusion mirrors attributeTradeOrder: order ids already recorded in
 * trade_orders, the _trade_account_id cart attribute, a discount code unique
 * to one active trade account, and an order email unique to one active
 * account's application contact email. The account list is read from D1 with
 * wrangler and kept in memory; nothing from it, and no customer address, is
 * ever printed or written.
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bottleMapRowFromOrder, type BottleMapRow, type BottleMapSkip } from '../src/lib/bottle-map'
import { countBottlesBySku } from '../src/lib/product-formats'
import type { ShopifyOrder } from '../src/lib/shopify-webhooks'
import { TRADE_ACCOUNT_ATTRIBUTE } from '../src/lib/trade-portal/orders'
import { ordersFromShopifyExport } from './shopify-orders-csv'

const SHOP_DOMAIN = 'zaeiaw-5z.myshopify.com'
const API_VERSION = '2025-10'
const D1_NAME = 'jerry-can-spirits-db'
const PAGE_SIZE = 100

// ── Arguments ───────────────────────────────────────────────────────

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const option = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)

const WRITE = flag('write')
const PRUNE = flag('prune')
const SQL_OUT = option('sql-out')
const CSV = option('csv')
const SINCE = option('since') ?? '2026-01-01'

if (!/^\d{4}-\d{2}-\d{2}$/.test(SINCE)) {
  console.error('--since must be YYYY-MM-DD')
  process.exit(1)
}
if (PRUNE && !WRITE && !SQL_OUT) {
  console.error('--prune needs --write or --sql-out')
  process.exit(1)
}

const token = process.env.SHOPIFY_ADMIN_API_TOKEN
if (!token && !CSV) {
  console.error('SHOPIFY_ADMIN_API_TOKEN is not set (or pass --csv=<orders export>)')
  process.exit(1)
}

// ── Shopify ─────────────────────────────────────────────────────────

interface GqlOrder {
  legacyResourceId: string
  name: string
  createdAt: string
  test: boolean
  cancelledAt: string | null
  displayFinancialStatus: string | null
  tags: string[]
  email: string | null
  customer: { tags: string[] } | null
  customAttributes: { key: string; value: string | null }[]
  discountCodes: string[]
  shippingAddress: { city: string | null; zip: string | null; countryCodeV2: string | null } | null
  lineItems: { nodes: { quantity: number; product: { legacyResourceId: string } | null }[] }
}

const ORDERS_QUERY = `
  query BottleMapOrders($first: Int!, $after: String, $query: String!) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes {
        legacyResourceId
        name
        createdAt
        test
        cancelledAt
        displayFinancialStatus
        tags
        email
        customer { tags }
        customAttributes { key value }
        discountCodes
        shippingAddress { city zip countryCodeV2 }
        lineItems(first: 50) { nodes { quantity product { legacyResourceId } } }
      }
    }
  }`

async function fetchOrders(adminToken: string): Promise<GqlOrder[]> {
  const orders: GqlOrder[] = []
  let after: string | null = null
  for (;;) {
    const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ORDERS_QUERY,
        variables: { first: PAGE_SIZE, after, query: `created_at:>=${SINCE}` },
      }),
    })
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const json = (await res.json()) as {
      data?: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: GqlOrder[] } }
      errors?: { message: string }[]
    }
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
    if (!json.data) throw new Error('no data')
    orders.push(...json.data.orders.nodes)
    if (!json.data.orders.pageInfo.hasNextPage) break
    after = json.data.orders.pageInfo.endCursor
  }
  return orders
}

/** The webhook's shape, so the same rules apply to both paths. */
function toWebhookOrder(o: GqlOrder): ShopifyOrder {
  return {
    id: Number(o.legacyResourceId),
    order_number: Number(o.name.replace(/\D/g, '')),
    created_at: o.createdAt,
    email: o.email ?? undefined,
    test: o.test,
    cancelled_at: o.cancelledAt,
    financial_status: o.displayFinancialStatus?.toLowerCase() ?? null,
    tags: o.tags,
    customer: o.customer ? { tags: o.customer.tags } : undefined,
    fulfillment_status: null,
    note_attributes: o.customAttributes.map((a) => ({ name: a.key, value: a.value ?? '' })),
    discount_codes: o.discountCodes.map((code) => ({ code, amount: '', type: '' })),
    shipping_address: o.shippingAddress
      ? {
          country_code: o.shippingAddress.countryCodeV2 ?? '',
          country: '',
          city: o.shippingAddress.city,
          zip: o.shippingAddress.zip,
        }
      : null,
    line_items: o.lineItems.nodes
      .filter((li) => li.product)
      .map((li) => ({ title: '', quantity: li.quantity, product_id: Number(li.product!.legacyResourceId) })),
  }
}

// ── D1 via wrangler ─────────────────────────────────────────────────

function wrangler(argv: string[]): string {
  const r = spawnSync('npx', ['wrangler', ...argv], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`wrangler failed: ${r.stderr || r.stdout}`)
  return r.stdout
}

function d1Query<T>(sql: string): T[] {
  // One line: a newline inside a shell argument crashes wrangler on Windows
  // (libuv assertion in src\win\async.c) before the query is sent.
  const out = wrangler(['d1', 'execute', D1_NAME, '--remote', '--json', '--command', JSON.stringify(sql.replace(/\s+/g, ' '))])
  const start = out.indexOf('[')
  const parsed = JSON.parse(out.slice(start)) as { results: T[] }[]
  return parsed[0]?.results ?? []
}

interface TradeAccountRow {
  id: string
  discount_code: string | null
  active: number
  email: string | null
}

interface TradeLookup {
  orderIds: Set<string>
  accountIds: Set<string>
  byCode: Map<string, string[]>
  byEmail: Map<string, string[]>
}

function loadTradeLookup(): TradeLookup {
  const orderIds = new Set(d1Query<{ order_id: string }>('SELECT order_id FROM trade_orders').map((r) => r.order_id))
  const accounts = d1Query<TradeAccountRow>(
    `SELECT a.id, a.discount_code, a.active, lower(p.contact_email) AS email
     FROM trade_accounts a LEFT JOIN trade_applications p ON p.id = a.application_id`,
  )
  const byCode = new Map<string, string[]>()
  const byEmail = new Map<string, string[]>()
  for (const a of accounts) {
    if (a.active !== 1) continue
    if (a.discount_code) byCode.set(a.discount_code, [...(byCode.get(a.discount_code) ?? []), a.id])
    if (a.email) byEmail.set(a.email, [...(byEmail.get(a.email) ?? []), a.id])
  }
  return { orderIds, accountIds: new Set(accounts.map((a) => a.id)), byCode, byEmail }
}

/** attributeTradeOrder, against the lists above instead of D1. */
function isTradeOrder(order: ShopifyOrder, lookup: TradeLookup): boolean {
  if (lookup.orderIds.has(String(order.id))) return true
  const stamped = order.note_attributes?.find((a) => a.name === TRADE_ACCOUNT_ATTRIBUTE)?.value?.trim()
  if (stamped && lookup.accountIds.has(stamped)) return true
  for (const d of order.discount_codes ?? []) {
    if (lookup.byCode.get(d.code.trim())?.length === 1) return true
  }
  const email = order.email?.trim().toLowerCase()
  if (email && lookup.byEmail.get(email)?.length === 1) return true
  return false
}

// ── SQL ─────────────────────────────────────────────────────────────

const sqlString = (s: string | null) => (s === null ? 'NULL' : `'${s.replace(/'/g, "''")}'`)

function upsertSql(row: BottleMapRow): string {
  return (
    `INSERT INTO bottle_map (order_id, created_at, country, outward_code, town, bottles) VALUES (` +
    `${sqlString(row.order_id)}, ${sqlString(row.created_at)}, ${sqlString(row.country)}, ${sqlString(row.outward_code)}, ${sqlString(row.town)}, ${row.bottles}) ` +
    `ON CONFLICT(order_id) DO UPDATE SET created_at = excluded.created_at, country = excluded.country, outward_code = excluded.outward_code, town = excluded.town, bottles = excluded.bottles;`
  )
}

function pruneSql(keep: BottleMapRow[]): string {
  if (keep.length === 0) return 'DELETE FROM bottle_map;'
  return `DELETE FROM bottle_map WHERE order_id NOT IN (${keep.map((r) => sqlString(r.order_id)).join(', ')});`
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  let orders: ShopifyOrder[]
  let csvRows = 0
  if (CSV) {
    const parsed = ordersFromShopifyExport(readFileSync(CSV, 'utf8'))
    csvRows = parsed.rows
    orders = parsed.orders
    console.log(`${CSV}: ${csvRows} rows, ${orders.length} orders`)
  } else {
    console.log(`fetching orders since ${SINCE}...`)
    orders = (await fetchOrders(token!)).map(toWebhookOrder)
    console.log(`${orders.length} orders fetched`)
  }

  console.log('loading trade accounts from D1...')
  const lookup = loadTradeLookup()

  const rows: BottleMapRow[] = []
  // The API query already applies --since; the export holds every order.
  const skipped: Record<BottleMapSkip | 'before_since', number> = {
    before_since: 0,
    test: 0,
    cancelled: 0,
    refunded: 0,
    trade: 0,
    no_country: 0,
    no_outward_code: 0,
    no_bottles: 0,
  }
  for (const order of orders) {
    if (order.created_at.slice(0, 10) < SINCE) {
      skipped.before_since++
      continue
    }
    const bottles = CSV ? countBottlesBySku(order.line_items) : undefined
    const decision = bottleMapRowFromOrder(order, isTradeOrder(order, lookup), bottles)
    if (decision.skip) skipped[decision.skip]++
    else rows.push(decision.row)
  }

  console.log('\nskipped:')
  for (const [reason, n] of Object.entries(skipped)) console.log(`  ${reason.padEnd(16)} ${n}`)
  if (CSV) {
    const excluded = Object.values(skipped).reduce((a, b) => a + b, 0)
    const reasons = Object.entries(skipped)
      .filter(([, n]) => n > 0)
      .map(([reason, n]) => `${reason} ${n}`)
      .join(', ')
    console.log(`\nSource: CSV ${CSV}, ${csvRows} rows, ${orders.length} orders, ${excluded} excluded${reasons ? ` (${reasons})` : ''}`)
  }

  // UK rows by district; rows abroad by country, the map's own fallback.
  const byPlace = new Map<string, { bottles: number; orders: number; towns: Map<string, number> }>()
  for (const r of rows) {
    const place = r.outward_code ?? r.country
    const cur = byPlace.get(place) ?? { bottles: 0, orders: 0, towns: new Map<string, number>() }
    cur.bottles += r.bottles
    cur.orders++
    if (r.town) cur.towns.set(r.town, (cur.towns.get(r.town) ?? 0) + r.bottles)
    byPlace.set(place, cur)
  }
  console.log('\nplace         bottles  orders  town')
  for (const place of [...byPlace.keys()].sort()) {
    const c = byPlace.get(place)!
    const town = [...c.towns.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
    console.log(`${place.padEnd(13)} ${String(c.bottles).padStart(7)}  ${String(c.orders).padStart(6)}  ${town}`)
  }
  const totalBottles = rows.reduce((s, r) => s + r.bottles, 0)
  const districts = new Set(rows.map((r) => r.outward_code).filter(Boolean)).size
  const countries = new Set(rows.map((r) => r.country)).size
  console.log(`\n${totalBottles} bottles across ${districts} postcode districts and ${countries} countries from ${rows.length} orders`)

  if (!WRITE && !SQL_OUT) {
    console.log('\ndry run: nothing written. Add --write to upsert, --prune to also remove rows no longer in this set.')
    return
  }

  const sql = [...rows.map(upsertSql), ...(PRUNE ? [pruneSql(rows)] : [])].join('\n') + '\n'
  if (SQL_OUT) {
    writeFileSync(SQL_OUT, sql)
    console.log(`wrote ${rows.length} upserts${PRUNE ? ' and a prune' : ''} to ${SQL_OUT}`)
    return
  }
  const file = join(mkdtempSync(join(tmpdir(), 'bottle-map-')), 'bottle-map.sql')
  writeFileSync(file, sql)
  console.log(`executing ${rows.length} upserts${PRUNE ? ' and a prune' : ''} against ${D1_NAME}...`)
  wrangler(['d1', 'execute', D1_NAME, '--remote', '--yes', `--file=${file}`])
  console.log('done')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
