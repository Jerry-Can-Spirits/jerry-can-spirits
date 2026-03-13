'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { Stockist } from './StockistMap'

const StockistMap = dynamic(() => import('./StockistMap'), { ssr: false })

// Add stockists here when retail is live
const ALL_STOCKISTS: Stockist[] = []

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

type SearchState = 'idle' | 'searching' | 'results' | 'error'

export default function StockistFinder() {
  const [postcode, setPostcode] = useState('')
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [nearbyStockists, setNearbyStockists] = useState<(Stockist & { distance: number })[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>(UK_CENTER)
  const [mapZoom, setMapZoom] = useState(UK_ZOOM)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = postcode.replace(/\s/g, '').toUpperCase()
    if (!clean) return

    setSearchState('searching')
    setErrorMessage('')

    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`)
      const data = await res.json() as { status: number; result: { latitude: number; longitude: number } }

      if (!res.ok || data.status !== 200) {
        setErrorMessage('Postcode not recognised. Please check and try again.')
        setSearchState('error')
        return
      }

      const { latitude, longitude } = data.result
      const nearby = ALL_STOCKISTS
        .map((s) => ({ ...s, distance: haversineDistance(latitude, longitude, s.lat, s.lng) }))
        .filter((s) => s.distance <= 25)
        .sort((a, b) => a.distance - b.distance)

      setNearbyStockists(nearby)
      setMapCenter([latitude, longitude])
      setMapZoom(11)
      setSearchState('results')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setSearchState('error')
    }
  }

  const typeLabel: Record<Stockist['type'], string> = {
    independent: 'Independent',
    bar: 'Bar',
    restaurant: 'Restaurant',
    online: 'Online',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-xl overflow-hidden border border-gold-500/20 min-h-[500px]">

      {/* Sidebar */}
      <div className="lg:col-span-2 bg-jerry-green-800/40 p-8 flex flex-col gap-8">

        {/* Search */}
        <div>
          <h2 className="text-xl font-serif font-bold text-white mb-2">Find a Stockist</h2>
          <p className="text-parchment-400 text-sm mb-6">
            Enter your postcode to find the nearest stockist within 25 miles.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
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
              disabled={searchState === 'searching' || !postcode.trim()}
              className="px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {searchState === 'searching' ? '...' : 'Search'}
            </button>
          </form>
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
                  No stockists within 25 miles of that postcode.
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
                    <div className="flex items-start justify-between gap-2">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {searchState === 'idle' && (
          <div className="flex-1 flex items-end">
            <p className="text-parchment-600 text-xs">
              Retail availability expanding from April 2026.
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
