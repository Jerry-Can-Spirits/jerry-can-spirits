'use client'

import { useEffect, useRef } from 'react'
import type { ExpeditionLogEntry } from '@/lib/d1'

interface Props {
  entries: ExpeditionLogEntry[]
}

export default function ExpeditionLogMap({ entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  // Filter inside the effect (stable dependency on `entries` reference)
  const hasCoords = entries.some((e) => e.location_lat !== null)

  useEffect(() => {
    if (!containerRef.current) return

    // Re-filter inside the effect to avoid unstable array reference in deps
    const entriesWithCoords = entries.filter(
      (e): e is ExpeditionLogEntry & { location_lat: number; location_lng: number } =>
        e.location_lat !== null && e.location_lng !== null
    )
    if (entriesWithCoords.length === 0) return

    const container = containerRef.current

    import('leaflet').then(async (L) => {
      // leaflet.heat extends L in-place, no export needed
      await import('leaflet.heat')

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(container, {
        scrollWheelZoom: false,
        zoomControl: true,
      })

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
        {
          tileSize: 512,
          zoomOffset: -1,
          attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      ).addTo(map)

      const heatData: [number, number, number][] = entriesWithCoords.map((e) => [
        e.location_lat,
        e.location_lng,
        1,
      ])

      L.heatLayer(heatData, { radius: 30, blur: 20, maxZoom: 10 }).addTo(map)

      const bounds = L.latLngBounds(entriesWithCoords.map((e) => [e.location_lat, e.location_lng]))
      map.fitBounds(bounds, { padding: [40, 40] })

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [entries])

  if (!hasCoords) return null

  return <div ref={containerRef} className="w-full h-64 rounded-xl" />
}
