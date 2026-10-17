// Where every bottle went: the rules behind the Batch 001 map on the
// Expedition Log page.
//
// Dan's decision (17 Oct 2026): show where every bottle has gone, by town and
// postcode district in the UK and by town and country elsewhere. Towns named,
// but not people; at most the first three or four characters of a UK postcode,
// so Blackpool shows dots for FY1 and FY4 and nothing shows at street level. A
// foreign postcode is not a district and is never stored. One row per Shopify
// order is kept in bottle_map (migration 0080); the page and /api/bottle-map
// only ever see the aggregate per district or town.
//
// This module is pure so the webhook, the backfill script, the data build
// scripts and the tests share one set of rules; the D1 calls are in
// bottle-map-d1.ts.

import { countBottles } from '@/lib/product-formats'
import type { ShopifyOrder } from '@/lib/shopify-webhooks'
import outcodeTable from '@/data/outcode-centroids.json'
import placeTable from '@/data/place-centroids.json'

/**
 * Fewest bottles a place needs before it gets a dot. A district or town with
 * one bottle is a coarse location, not a person (an outward code covers
 * thousands of addresses), so the default is one; Dan may raise it. The
 * headline totals ignore this: they count every row.
 */
export const MIN_BOTTLES_PER_DOT = 1

/** Shopify's country code for the whole UK, Northern Ireland included. */
export const UK = 'GB'

export interface PlaceCentroids {
  countries: Record<string, { name: string; lat: number; lng: number }>
  towns: Record<string, Record<string, [number, number]>>
}

// JSON imports type each pair as number[]; the build scripts write exactly two.
const OUTCODE_CENTROIDS = outcodeTable as unknown as Record<string, [number, number]>
const PLACES = placeTable as unknown as PlaceCentroids

// ── Outward code and town ───────────────────────────────────────────

// Outward code then inward code (digit, two letters), after spaces are gone.
// "SW1A1AA" splits as SW1A + 1AA; "FY41AA" backtracks to FY4 + 1AA.
const FULL_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/
const OUTWARD_ONLY = /^[A-Z]{1,2}\d[A-Z\d]?$/

/** The postcode district of a UK shipping zip, or null when it is not a UK postcode. */
export function outwardCode(zip: string | null | undefined): string | null {
  if (!zip) return null
  const compact = zip.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const full = FULL_POSTCODE.exec(compact)
  if (full) return full[1]
  return OUTWARD_ONLY.test(compact) ? compact : null
}

// Words that stay lower case inside a place name: Newcastle upon Tyne,
// Stoke-on-Trent, Barrow-in-Furness, Ashby-de-la-Zouch.
const SMALL_WORDS = new Set(['upon', 'on', 'under', 'in', 'by', 'the', 'le', 'de', 'la', 'cum', 'and', 'of'])
const TOWN_MAX = 60

/** The shipping city as a label: trimmed, title-cased, or null when empty. */
export function titleCaseTown(city: string | null | undefined): string | null {
  const trimmed = city?.trim().replace(/\s+/g, ' ') ?? ''
  if (!trimmed) return null
  const cased = trimmed
    .toLowerCase()
    .replace(/\p{L}[\p{L}']*/gu, (word, offset: number) =>
      offset > 0 && SMALL_WORDS.has(word) ? word : word[0].toUpperCase() + word.slice(1),
    )
  return cased.length > TOWN_MAX ? cased.slice(0, TOWN_MAX).trimEnd() : cased
}

/** The key a town is looked up by in the place table: lower case, no accents, single spaces. */
export function townKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// ── One order to one row ────────────────────────────────────────────

export interface BottleMapRow {
  order_id: string
  created_at: string
  /** ISO 3166-1 alpha-2 shipping country. */
  country: string
  /** The postcode district for UK orders; null abroad. */
  outward_code: string | null
  town: string | null
  bottles: number
}

export type BottleMapSkip =
  | 'test'
  | 'cancelled'
  | 'refunded'
  | 'trade'
  | 'no_country'
  | 'no_outward_code'
  | 'no_bottles'

export type BottleMapDecision = { row: BottleMapRow; skip?: undefined } | { row?: undefined; skip: BottleMapSkip }

/** Shopify sends tags as "a, b" on the REST payload and as a list on GraphQL. */
export function splitTags(tags: string | string[] | null | undefined): string[] {
  const list = Array.isArray(tags) ? tags : (tags ?? '').split(',')
  return list.map((t) => t.trim().toLowerCase()).filter(Boolean)
}

/** A tag that names the trade, on the order or its customer. A safeguard beside attributeTradeOrder. */
export function hasTradeTag(order: Pick<ShopifyOrder, 'tags' | 'customer'>): boolean {
  return [...splitTags(order.tags), ...splitTags(order.customer?.tags)].some((t) => /\btrade\b/.test(t))
}

const EXCLUDED_FINANCIAL_STATUS = new Set(['refunded', 'voided'])

/**
 * The row an order contributes, or why it contributes nothing. Pure: the
 * caller decides whether the order is a trade order (that needs D1).
 */
export function bottleMapRowFromOrder(order: ShopifyOrder, isTrade: boolean): BottleMapDecision {
  if (order.test) return { skip: 'test' }
  if (order.cancelled_at) return { skip: 'cancelled' }
  if (order.financial_status && EXCLUDED_FINANCIAL_STATUS.has(order.financial_status.toLowerCase())) {
    return { skip: 'refunded' }
  }
  if (isTrade || hasTradeTag(order)) return { skip: 'trade' }
  const country = order.shipping_address?.country_code?.trim().toUpperCase() ?? ''
  if (!/^[A-Z]{2}$/.test(country)) return { skip: 'no_country' }
  let outward_code: string | null = null
  if (country === UK) {
    outward_code = outwardCode(order.shipping_address?.zip)
    if (!outward_code) return { skip: 'no_outward_code' }
  }
  const bottles = countBottles(order.line_items)
  if (bottles === 0) return { skip: 'no_bottles' }
  return {
    row: {
      order_id: String(order.id),
      created_at: order.created_at,
      country,
      outward_code,
      town: titleCaseTown(order.shipping_address?.city),
      bottles,
    },
  }
}

// ── Aggregate ───────────────────────────────────────────────────────

export interface BottleMapPoint {
  /** The UK district, or null for a town or country abroad. */
  outward_code: string | null
  town: string | null
  country: string
  lat: number
  lng: number
  bottles: number
  /** "FY1, Blackpool: 3 bottles" or "Brussels, Belgium: 1 bottle". */
  label: string
}

export interface BottleMapSummary {
  /** Every bottle in every row, plotted or not. */
  bottles: number
  /** Distinct UK outward codes across every row, plotted or not. */
  districts: number
  /** Distinct shipping countries across every row, the UK counted once. */
  countries: number
  points: BottleMapPoint[]
}

/** A (country, district, town) group as the aggregate query returns it. */
export interface BottleMapGroup {
  country: string
  outward_code: string | null
  town: string | null
  bottles: number
}

interface Bucket {
  outward_code: string | null
  town: string | null
  townBottles: number
  country: string
  lat: number
  lng: number
  bottles: number
}

/** "FY1, Blackpool: 3 bottles", "Brussels, Belgium: 1 bottle", "Belgium: 2 bottles". Dan's format, 17 Oct 2026. */
export function bottleDotLabel(point: Pick<BottleMapPoint, 'outward_code' | 'town' | 'country' | 'bottles'>): string {
  const place = point.outward_code
    ? [point.outward_code, point.town].filter(Boolean).join(', ')
    : [point.town, countryName(point.country)].filter(Boolean).join(', ')
  return `${place}: ${point.bottles} ${point.bottles === 1 ? 'bottle' : 'bottles'}`
}

/** The English country name from the place table, or the code when it has none. */
export function countryName(code: string): string {
  return PLACES.countries[code]?.name ?? code
}

/**
 * Fold the grouped rows into the summary the page and the API serve. UK rows
 * bucket by district; rows abroad bucket by town when the place table knows
 * it, else by country. A bucket's town is the one most of its bottles went
 * to, so one customer's spelling cannot rename a district. Points need a
 * position and the floor; the totals do not.
 */
export function summariseBottleMap(groups: BottleMapGroup[]): BottleMapSummary {
  const buckets = new Map<string, Bucket>()
  const districts = new Set<string>()
  const countries = new Set<string>()
  let total = 0

  for (const g of groups) {
    total += g.bottles
    countries.add(g.country)
    let key: string
    let position: [number, number] | undefined
    let outward_code: string | null = null
    let town = g.town
    if (g.country === UK && g.outward_code) {
      districts.add(g.outward_code)
      key = `${UK}/${g.outward_code}`
      position = OUTCODE_CENTROIDS[g.outward_code]
      outward_code = g.outward_code
    } else {
      const byTown = g.town ? PLACES.towns[g.country]?.[townKey(g.town)] : undefined
      if (byTown) {
        key = `${g.country}/${townKey(g.town!)}`
        position = byTown
      } else {
        key = g.country
        const c = PLACES.countries[g.country]
        position = c ? [c.lat, c.lng] : undefined
        town = null
      }
    }
    if (!position) continue
    const cur = buckets.get(key) ?? {
      outward_code,
      town: null,
      townBottles: 0,
      country: g.country,
      lat: position[0],
      lng: position[1],
      bottles: 0,
    }
    cur.bottles += g.bottles
    if (town && g.bottles > cur.townBottles) {
      cur.town = town
      cur.townBottles = g.bottles
    }
    buckets.set(key, cur)
  }

  const points: BottleMapPoint[] = []
  for (const b of buckets.values()) {
    if (b.bottles < MIN_BOTTLES_PER_DOT) continue
    const point = { outward_code: b.outward_code, town: b.town, country: b.country, lat: b.lat, lng: b.lng, bottles: b.bottles }
    points.push({ ...point, label: bottleDotLabel(point) })
  }
  points.sort((a, b) => a.label.localeCompare(b.label))
  return { bottles: total, districts: districts.size, countries: countries.size, points }
}

// ── Copy ────────────────────────────────────────────────────────────
// Dan's copy, 17 Oct 2026. The only variation is the plural, and the
// countries clause appears only once bottles have gone to more than one.

/**
 * "Batch 001: 123 bottles so far, across 45 postcode districts." or, abroad
 * too, "... across 45 postcode districts and 2 countries." Null before the
 * first row, so the page never says "0 bottles".
 */
export function bottleMapHeadline(
  batchLabel: string,
  summary: Pick<BottleMapSummary, 'bottles' | 'districts' | 'countries'>,
): string | null {
  if (summary.bottles === 0) return null
  const bottles = `${summary.bottles} ${summary.bottles === 1 ? 'bottle' : 'bottles'}`
  const across: string[] = []
  if (summary.districts > 0) {
    across.push(`${summary.districts} postcode ${summary.districts === 1 ? 'district' : 'districts'}`)
  }
  if (summary.countries > 1) across.push(`${summary.countries} countries`)
  const tail = across.length ? `, across ${across.join(' and ')}.` : '.'
  return `${batchLabel}: ${bottles} so far${tail}`
}

// ── SQL ─────────────────────────────────────────────────────────────

export const UPSERT_BOTTLE_MAP_SQL = `INSERT INTO bottle_map (order_id, created_at, country, outward_code, town, bottles)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(order_id) DO UPDATE SET
         created_at = excluded.created_at,
         country = excluded.country,
         outward_code = excluded.outward_code,
         town = excluded.town,
         bottles = excluded.bottles`

export const AGGREGATE_BOTTLE_MAP_SQL =
  'SELECT country, outward_code, town, SUM(bottles) AS bottles FROM bottle_map GROUP BY country, outward_code, town'
