'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { Stockist } from './StockistMap'

const StockistMap = dynamic(() => import('./StockistMap'), { ssr: false })

const ALL_STOCKISTS: Stockist[] = [
  {
    id: 'the-bank-blackpool',
    name: 'The Bank Bar & Grill',
    address: '28 Corporation St, Blackpool FY1 1EJ',
    lat: 53.8179,
    lng: -3.0537,
    type: 'bar',
  },
  {
    id: 'spin-the-black-circle-worcester',
    name: 'Spin the Black Circle',
    address: '19-21 Pump Street, Worcester WR1 2QX',
    lat: 52.1909,
    lng: -2.2194,
    type: 'independent',
  },
  {
    id: 'the-hog-horsley',
    name: 'The Hog',
    address: 'Horsley Hill, Stroud GL6 0PR',
    lat: 51.6809,
    lng: -2.2348,
    type: 'bar',
  },
]

const UK_CENTER: [number, number] = [54.5, -2.5]
const UK_ZOOM = 6

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function directionsUrl(origin: string, stockist: Stockist): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${stockist.lat},${stockist.lng}`
}

type SearchState = 'idle' | 'searching' | 'locating' | 'results' | 'error'

export default function StockistFinder() {
  const [postcode, setPostcode] = useState('')
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [nearbyStockists, setNearbyStockists] = useState<(Stockist & { distance: number })[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>(UK_CENTER)
  const [mapZoom, setMapZoom] = useState(UK_ZOOM)
  const [origin, setOrigin] = useState('')

  function runSearch(latitude: number, longitude: number, originLabel: string) {
    const nearby = ALL_STOCKISTS
      .map((s) => ({ ...s, distance: haversineDistance(latitude, longitude, s.lat, s.lng) }))
      .filter((s) => s.distance <= 25)
      .sort((a, b) => a.distance - b.distance)

    setNearbyStockists(nearby)
    setMapCenter([latitude, longitude])
    setMapZoom(11)
    setOrigin(originLabel)
    setSearchState('results')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = postcode.replace(/\s/g, '').toUpperCase()
    if (!clean) return

    setSearchState('searching')
    setErrorMessage('')

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(clean)}.json?country=gb&types=postcode&limit=1&access_token=${token}`
      )
      const data = await res.json() as {
        features?: Array<{ geometry: { coordinates: [number, number] } }>
      }

      if (!res.ok || !data.features?.length) {
        setErrorMessage('Postcode not recognised. Please check and try again.')
        setSearchState('error')
        return
      }

      // Mapbox returns [longitude, latitude] — GeoJSON convention
      const [lng, lat] = data.features[0].geometry.coordinates
      runSearch(lat, lng, postcode.trim())
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setSearchState('error')
    }
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Your browser does not support location access.')
      setSearchState('error')
      return
    }

    setSearchState('locating')
    setErrorMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        runSearch(position.coords.latitude, position.coords.longitude, `${position.coords.latitude},${position.coords.longitude}`)
      },
      () => {
        setErrorMessage('Location access was denied or unavailable. Try entering your postcode instead.')
        setSearchState('error')
      },
      { timeout: 10000 }
    )
  }

  const typeLabel: Record<Stockist['type'], string> = {
    independent: 'Independent',
    bar: 'Bar',
    restaurant: 'Restaurant',
    online: 'Online',
  }

  const isBusy = searchState === 'searching' || searchState === 'locating'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-xl overflow-hidden border border-gold-500/20 min-h-[500px]">

      {/* Sidebar */}
      <div className="lg:col-span-2 bg-jerry-green-800/40 p-8 flex flex-col gap-8">

        {/* Search */}
        <div>
          <h2 className="text-xl font-serif font-bold text-white mb-2">Find a Stockist</h2>
          <p className="text-parchment-400 text-sm mb-6">
            Enter your postcode or use your current location to find stockists within 25 miles.
          </p>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="e.g. SW1A 1AA"
              maxLength={8}
              className="flex-1 px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400 uppercase tracking-wider"
            />
            <button
              type="submit"
              disabled={isBusy || !postcode.trim()}
              className="w-full sm:w-auto px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {searchState === 'searching' ? '...' : 'Search'}
            </button>
          </form>
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isBusy}
            className="inline-flex items-center gap-2 text-parchment-400 hover:text-parchment-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {searchState === 'locating' ? 'Finding your location...' : 'Use my current location'}
          </button>
          {searchState === 'error' && (
            <p className="text-red-400 text-sm mt-3">{errorMessage}</p>
          )}
        </div>

        {/* Results */}
        {searchState === 'results' && (
          <div className="flex-1">
            {nearbyStockists.length === 0 ? (
              <div className="space-y-4">
                <p className="text-parchment-300 text-sm">
                  No stockists within 25 miles of your location.
                </p>
                <p className="text-parchment-500 text-sm">
                  We are expanding our retail presence ahead of launch. If you would like to stock Expedition Spiced, get in touch via our{' '}
                  <a href="/contact/enquiries/" className="text-gold-400 hover:text-gold-300 underline">
                    trade enquiries
                  </a>{' '}
                  page.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-parchment-400 text-xs uppercase tracking-widest mb-4">
                  {nearbyStockists.length} result{nearbyStockists.length !== 1 ? 's' : ''} nearby
                </p>
                {nearbyStockists.map((stockist) => (
                  <div
                    key={stockist.id}
                    className="p-4 bg-jerry-green-900/60 rounded-lg border border-gold-500/20"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{stockist.name}</p>
                        <p className="text-parchment-400 text-xs mt-1">{stockist.address}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gold-400 text-sm font-semibold">
                          {stockist.distance.toFixed(1)} mi
                        </p>
                        <p className="text-parchment-500 text-xs mt-1">
                          {typeLabel[stockist.type]}
                        </p>
                      </div>
                    </div>
                    <a
                      href={directionsUrl(origin, stockist)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 text-xs font-medium transition-colors"
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Get directions
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {searchState === 'idle' && (
          <div className="flex-1 flex items-end">
            <p className="text-parchment-600 text-xs">
              More stockists being added regularly.
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="lg:col-span-3 min-h-[400px] lg:min-h-0 relative bg-jerry-green-900/20">
        <StockistMap
          stockists={nearbyStockists.length > 0 ? nearbyStockists : ALL_STOCKISTS}
          center={mapCenter}
          zoom={mapZoom}
        />
      </div>

    </div>
  )
}
