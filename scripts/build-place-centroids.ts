/**
 * Build the town and country positions the bottle map uses outside the UK.
 *
 * Abroad there is no postcode district (a foreign postcode is not a district
 * and is never stored), so an order is plotted on its town, or on its country
 * when the town is unknown to the table. Source: GeoNames (CC BY 4.0).
 *   https://download.geonames.org/export/dump/cities15000.zip
 *   https://download.geonames.org/export/dump/countryInfo.txt
 * Run, from the repo root:
 *   npx tsx scripts/build-place-centroids.ts <cities15000.txt> <countryInfo.txt> src/data/place-centroids.json
 *
 * Towns kept: every place in the file (15,000 or more) in Belgium, where the
 * first order abroad went; every place of 50,000 or more in the other European
 * countries listed below; every place of 500,000 or more elsewhere; and every
 * capital. Small on purpose: the table grows as orders arrive, by adding a
 * country to ALL_TOWNS and rebuilding. Keys are the lower-cased ASCII
 * name and, where it differs, the lower-cased native name (liege and liège), so
 * what a customer types in the city field matches without accents. Two towns
 * with one name in one country: the larger wins.
 *
 * A country's position is the population-weighted mean of its towns in the
 * file, which sits in the populated part of the country rather than its
 * geometric middle. The country name is GeoNames' English name.
 *
 * Attribution shown under the map: town and country positions from GeoNames,
 * CC BY 4.0.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { townKey, type PlaceCentroids } from '../src/lib/bottle-map'

const EUROPE = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'NO', 'IS', 'LI', 'CH', 'IM', 'JE', 'GG', 'GI',
])
/** Countries whose every town in the file is kept, because an order has gone there. */
const ALL_TOWNS = new Set(['BE'])
const EUROPE_MIN_POPULATION = 50000
const WORLD_MIN_POPULATION = 500000

interface City {
  name: string
  ascii: string
  /** Other spellings (Bruxelles, Brussel), kept only for ALL_TOWNS countries. */
  aliases: string[]
  lat: number
  lng: number
  country: string
  population: number
}

// A Latin-script alias a customer might type in a city field; GeoNames also
// lists every other script and transliteration, which no UK checkout sees.
const LATIN_ALIAS = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ' .-]{1,30}$/

function readCities(path: string): City[] {
  const cities: City[] = []
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const f = line.split('\t')
    if (f.length < 15) continue
    const aliases = ALL_TOWNS.has(f[8]) ? f[3].split(',').filter((a) => LATIN_ALIAS.test(a)) : []
    cities.push({ name: f[1], ascii: f[2], aliases, lat: Number(f[4]), lng: Number(f[5]), country: f[8], population: Number(f[14]) })
  }
  return cities
}

function readCountries(path: string): Map<string, { name: string; capital: string }> {
  const out = new Map<string, { name: string; capital: string }>()
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue
    const f = line.split('\t')
    out.set(f[0], { name: f[4], capital: f[5] })
  }
  return out
}

function build(citiesPath: string, countryInfoPath: string): PlaceCentroids {
  const cities = readCities(citiesPath).sort((a, b) => b.population - a.population)
  const countries = readCountries(countryInfoPath)
  const out: PlaceCentroids = { countries: {}, towns: {} }

  const weighted = new Map<string, { lat: number; lng: number; pop: number }>()
  for (const c of cities) {
    if (c.country === 'GB') continue
    const w = weighted.get(c.country) ?? { lat: 0, lng: 0, pop: 0 }
    w.lat += c.lat * c.population
    w.lng += c.lng * c.population
    w.pop += c.population
    weighted.set(c.country, w)

    const info = countries.get(c.country)
    const isCapital = info ? townKey(info.capital) === townKey(c.ascii) || townKey(info.capital) === townKey(c.name) : false
    const keep =
      ALL_TOWNS.has(c.country) ||
      (EUROPE.has(c.country) && c.population >= EUROPE_MIN_POPULATION) ||
      c.population >= WORLD_MIN_POPULATION ||
      isCapital
    if (!keep) continue
    const towns = (out.towns[c.country] ??= {})
    for (const key of new Set([townKey(c.ascii), townKey(c.name), ...c.aliases.map(townKey)])) {
      if (key && !towns[key]) towns[key] = [Number(c.lat.toFixed(3)), Number(c.lng.toFixed(3))]
    }
  }
  for (const [code, w] of weighted) {
    const info = countries.get(code)
    if (!info || w.pop === 0) continue
    out.countries[code] = { name: info.name, lat: Number((w.lat / w.pop).toFixed(3)), lng: Number((w.lng / w.pop).toFixed(3)) }
  }
  const sortKeys = <T>(o: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]))
  out.countries = sortKeys(out.countries)
  out.towns = sortKeys(Object.fromEntries(Object.entries(out.towns).map(([k, v]) => [k, sortKeys(v)])))
  return out
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/build-place-centroids.ts')
if (isMain) {
  const [citiesPath, countryInfoPath, outPath] = process.argv.slice(2)
  if (!citiesPath || !countryInfoPath || !outPath) {
    console.error('usage: npx tsx scripts/build-place-centroids.ts <cities15000.txt> <countryInfo.txt> <out.json>')
    process.exit(1)
  }
  const table = build(citiesPath, countryInfoPath)
  writeFileSync(outPath, JSON.stringify(table) + '\n')
  const towns = Object.values(table.towns).reduce((n, t) => n + Object.keys(t).length, 0)
  console.log(`wrote ${outPath}: ${Object.keys(table.countries).length} countries, ${towns} town keys`)
}
