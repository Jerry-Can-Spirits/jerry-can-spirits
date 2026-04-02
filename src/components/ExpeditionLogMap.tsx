'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { ExpeditionLogEntry } from '@/lib/d1'

interface Props {
  entries: ExpeditionLogEntry[]
}

const UK_CENTER: [number, number] = [54.5, -2.5]
const UK_ZOOM = 5

export default function ExpeditionLogMap({ entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    import('leaflet').then(async (L) => {
      await import('leaflet.heat')

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(container, {
        center: UK_CENTER,
        zoom: UK_ZOOM,
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

      const heatData: [number, number, number][] = entries
        .filter((e): e is ExpeditionLogEntry & { location_lat: number; location_lng: number } =>
          e.location_lat !== null && e.location_lng !== null
        )
        .map((e) => [e.location_lat, e.location_lng, 1])

      if (heatData.length > 0) {
        L.heatLayer(heatData, { radius: 30, blur: 20, maxZoom: 10 }).addTo(map)
      }

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [entries])

  return <div ref={containerRef} className="w-full h-64 rounded-xl" />
}
