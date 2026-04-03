'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import type { ExpeditionLogEntry } from '@/lib/d1'

interface Props {
  entries: ExpeditionLogEntry[]
}

const UK_CENTER: [number, number] = [-2.5, 54.5] // Mapbox uses [lng, lat]
const UK_ZOOM = 4.5

export default function ExpeditionLogMap({ entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (mapRef.current) {
        ;(mapRef.current as mapboxgl.Map).remove()
        mapRef.current = null
      }

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

      const map = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: UK_CENTER,
        zoom: UK_ZOOM,
        scrollZoom: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      mapRef.current = map

      map.on('load', () => {
        const geocoded = entries.filter(
          (e): e is ExpeditionLogEntry & { location_lat: number; location_lng: number } =>
            e.location_lat !== null && e.location_lng !== null
        )

        const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: geocoded.map((e) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [e.location_lng, e.location_lat] },
            properties: {},
          })),
        }

        map.addSource('supporters', { type: 'geojson', data: geojson })

        map.addLayer({
          id: 'supporters-heat',
          type: 'heatmap',
          source: 'supporters',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 10, 9, 20],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, '#b8860b',
              0.5, '#d4a017',
              0.8, '#f5c842',
              1, '#ffe680',
            ],
            'heatmap-opacity': 0.85,
          },
        })
      })
    })

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [entries])

  return <div ref={containerRef} className="w-full h-64 rounded-xl" />
}
