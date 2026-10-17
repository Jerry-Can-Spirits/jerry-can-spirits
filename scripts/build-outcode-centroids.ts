/**
 * Build the outward-code centroid table the bottle map plots from.
 *
 * Source: OS Code-Point Open (Great Britain), Open Government Licence v3.
 * Download the CSV zip from the OS Data Hub (no key needed) and unzip it:
 *   https://api.os.uk/downloads/v1/products/CodePointOpen/downloads?area=GB&format=CSV&redirect
 * Code-Point Open does not cover Northern Ireland, so the BT districts come
 * from the GeoNames postal code file for GB (CC BY 4.0), which lists one or
 * more place-name rows per outward code with coordinates:
 *   https://download.geonames.org/export/zip/GB.zip
 * Only outward codes absent from Code-Point Open are taken from it. Then run,
 * from the repo root:
 *   npx tsx scripts/build-outcode-centroids.ts <unzipped Code-Point dir> <GeoNames GB.txt> src/data/outcode-centroids.json
 *
 * One entry per outward code (the part of a postcode before the space): the
 * mean of its unit postcodes' National Grid coordinates, converted to WGS84
 * and rounded to four decimal places (about 10m, far below what a district
 * dot can show). Rows with positional quality 90 carry no coordinates and are
 * skipped. The Isle of Man and the Channel Islands are in neither source and
 * are not GB in Shopify; they are handled as countries by the place table.
 *
 * Attribution the licences require wherever the data is shown (the Expedition
 * Log page carries it): Contains OS data (c) Crown copyright and database
 * right; Contains Royal Mail data (c) Royal Mail copyright and database right;
 * Contains National Statistics data (c) Crown copyright and database right.
 * Northern Ireland districts and town positions from GeoNames, CC BY 4.0.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// ── OSGB36 National Grid to WGS84 ───────────────────────────────────
// The transverse Mercator inverse and the Helmert shift from OS's "A guide to
// coordinate systems in Great Britain". Accurate to a few metres, which is
// three orders of magnitude finer than this dataset needs.

interface Ellipsoid {
  a: number
  b: number
}

const AIRY_1830: Ellipsoid = { a: 6377563.396, b: 6356256.909 }
const GRS80: Ellipsoid = { a: 6378137, b: 6356752.3141 }

const F0 = 0.9996012717
const LAT0 = (49 * Math.PI) / 180
const LON0 = (-2 * Math.PI) / 180
const N0 = -100000
const E0 = 400000

function gridToOsgb36(E: number, N: number): { lat: number; lon: number } {
  const { a, b } = AIRY_1830
  const e2 = 1 - (b * b) / (a * a)
  const n = (a - b) / (a + b)
  const n2 = n * n
  const n3 = n * n * n

  let lat = LAT0
  let M = 0
  do {
    lat = (N - N0 - M) / (a * F0) + lat
    const dLat = lat - LAT0
    const sLat = lat + LAT0
    M =
      b *
      F0 *
      ((1 + n + 1.25 * n2 + 1.25 * n3) * dLat -
        (3 * n + 3 * n2 + 2.625 * n3) * Math.sin(dLat) * Math.cos(sLat) +
        (1.875 * n2 + 1.875 * n3) * Math.sin(2 * dLat) * Math.cos(2 * sLat) -
        (35 / 24) * n3 * Math.sin(3 * dLat) * Math.cos(3 * sLat))
  } while (N - N0 - M >= 0.00001)

  const sinLat = Math.sin(lat)
  const cosLat = Math.cos(lat)
  const tanLat = Math.tan(lat)
  const tan2 = tanLat * tanLat
  const tan4 = tan2 * tan2
  const tan6 = tan4 * tan2
  const secLat = 1 / cosLat
  const nu = (a * F0) / Math.sqrt(1 - e2 * sinLat * sinLat)
  const rho = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5)
  const eta2 = nu / rho - 1
  const nu3 = nu * nu * nu
  const nu5 = nu3 * nu * nu
  const nu7 = nu5 * nu * nu

  const VII = tanLat / (2 * rho * nu)
  const VIII = (tanLat / (24 * rho * nu3)) * (5 + 3 * tan2 + eta2 - 9 * tan2 * eta2)
  const IX = (tanLat / (720 * rho * nu5)) * (61 + 90 * tan2 + 45 * tan4)
  const X = secLat / nu
  const XI = (secLat / (6 * nu3)) * (nu / rho + 2 * tan2)
  const XII = (secLat / (120 * nu5)) * (5 + 28 * tan2 + 24 * tan4)
  const XIIA = (secLat / (5040 * nu7)) * (61 + 662 * tan2 + 1320 * tan4 + 720 * tan6)

  const dE = E - E0
  const dE2 = dE * dE
  const dE3 = dE2 * dE
  const dE4 = dE2 * dE2
  const dE5 = dE4 * dE
  const dE6 = dE3 * dE3
  const dE7 = dE6 * dE

  return {
    lat: lat - VII * dE2 + VIII * dE4 - IX * dE6,
    lon: LON0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7,
  }
}

function toCartesian(lat: number, lon: number, el: Ellipsoid): [number, number, number] {
  const e2 = 1 - (el.b * el.b) / (el.a * el.a)
  const sinLat = Math.sin(lat)
  const nu = el.a / Math.sqrt(1 - e2 * sinLat * sinLat)
  return [
    nu * Math.cos(lat) * Math.cos(lon),
    nu * Math.cos(lat) * Math.sin(lon),
    (1 - e2) * nu * sinLat,
  ]
}

function toGeodetic([x, y, z]: [number, number, number], el: Ellipsoid): { lat: number; lon: number } {
  const e2 = 1 - (el.b * el.b) / (el.a * el.a)
  const p = Math.sqrt(x * x + y * y)
  let lat = Math.atan2(z, p * (1 - e2))
  for (let i = 0; i < 10; i++) {
    const sinLat = Math.sin(lat)
    const nu = el.a / Math.sqrt(1 - e2 * sinLat * sinLat)
    lat = Math.atan2(z + e2 * nu * sinLat, p)
  }
  return { lat, lon: Math.atan2(y, x) }
}

// OSGB36 to WGS84 Helmert parameters (OS guide, section 6.6).
const ARCSEC = Math.PI / (180 * 3600)
const HELMERT = {
  tx: 446.448,
  ty: -125.157,
  tz: 542.06,
  s: -20.4894e-6,
  rx: 0.1502 * ARCSEC,
  ry: 0.247 * ARCSEC,
  rz: 0.8421 * ARCSEC,
}

function osgb36ToWgs84(lat: number, lon: number): { lat: number; lng: number } {
  const [x, y, z] = toCartesian(lat, lon, AIRY_1830)
  const { tx, ty, tz, s, rx, ry, rz } = HELMERT
  const s1 = 1 + s
  const shifted: [number, number, number] = [
    tx + s1 * x - rz * y + ry * z,
    ty + rz * x + s1 * y - rx * z,
    tz - ry * x + rx * y + s1 * z,
  ]
  const g = toGeodetic(shifted, GRS80)
  return { lat: (g.lat * 180) / Math.PI, lng: (g.lon * 180) / Math.PI }
}

export function gridToWgs84(E: number, N: number): { lat: number; lng: number } {
  const o = gridToOsgb36(E, N)
  return osgb36ToWgs84(o.lat, o.lon)
}

// ── Code-Point Open rows ────────────────────────────────────────────

/** The outward code of a Code-Point Open postcode field ("FY1 1AN", "SW1A1AA", "B1  1AA"). */
export function outwardFromCodePoint(postcode: string): string {
  return postcode.slice(0, -3).trim()
}

function build(dir: string): Record<string, [number, number]> {
  const csvDir = join(dir, 'Data', 'CSV')
  const sums = new Map<string, { e: number; n: number; count: number }>()
  let skipped = 0
  for (const file of readdirSync(csvDir)) {
    if (!file.endsWith('.csv')) continue
    const text = readFileSync(join(csvDir, file), 'utf8')
    for (const line of text.split('\n')) {
      if (!line) continue
      // Columns: "Postcode",PQI,Eastings,Northings,... The first field is quoted.
      const m = /^"([^"]+)",(\d+),(\d+),(\d+),/.exec(line)
      if (!m) continue
      if (m[2] === '90') {
        skipped++
        continue
      }
      const code = outwardFromCodePoint(m[1])
      const cur = sums.get(code) ?? { e: 0, n: 0, count: 0 }
      cur.e += Number(m[3])
      cur.n += Number(m[4])
      cur.count++
      sums.set(code, cur)
    }
  }
  const out: Record<string, [number, number]> = {}
  for (const code of sums.keys()) {
    const s = sums.get(code)!
    const { lat, lng } = gridToWgs84(s.e / s.count, s.n / s.count)
    out[code] = [Number(lat.toFixed(4)), Number(lng.toFixed(4))]
  }
  console.log(`${Object.keys(out).length} outward codes from ${[...sums.values()].reduce((a, s) => a + s.count, 0)} postcodes; ${skipped} rows without coordinates skipped`)
  return out
}

/**
 * Outward codes GeoNames knows and Code-Point Open does not (Northern
 * Ireland). GeoNames gives several place rows per code, each geocoded to a
 * place name; their mean is a district position, coarse and good enough for a
 * town-level dot. Tab-separated: country, postal code, place, ..., lat (10),
 * lng (11), accuracy (12).
 */
function fillFromGeonames(table: Record<string, [number, number]>, geonamesPath: string): number {
  const sums = new Map<string, { lat: number; lng: number; count: number }>()
  for (const line of readFileSync(geonamesPath, 'utf8').split('\n')) {
    const f = line.split('\t')
    if (f[0] !== 'GB' || !f[1] || table[f[1]]) continue
    const lat = Number(f[9])
    const lng = Number(f[10])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const cur = sums.get(f[1]) ?? { lat: 0, lng: 0, count: 0 }
    cur.lat += lat
    cur.lng += lng
    cur.count++
    sums.set(f[1], cur)
  }
  for (const [code, s] of sums) {
    table[code] = [Number((s.lat / s.count).toFixed(4)), Number((s.lng / s.count).toFixed(4))]
  }
  return sums.size
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/build-outcode-centroids.ts')
if (isMain) {
  const [dir, geonamesPath, outPath] = process.argv.slice(2)
  if (!dir || !geonamesPath || !outPath) {
    console.error('usage: npx tsx scripts/build-outcode-centroids.ts <code-point-open dir> <geonames GB.txt> <out.json>')
    process.exit(1)
  }
  const table = build(dir)
  const added = fillFromGeonames(table, geonamesPath)
  console.log(`${added} outward codes added from GeoNames (Northern Ireland)`)
  const sorted = Object.fromEntries(Object.keys(table).sort().map((k) => [k, table[k]]))
  writeFileSync(outPath, JSON.stringify(sorted) + '\n')
  console.log(`wrote ${outPath}: ${Object.keys(sorted).length} outward codes`)
}
