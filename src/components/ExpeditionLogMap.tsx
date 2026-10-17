'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import type { BottleMapPoint } from '@/lib/bottle-map'

interface Props {
  /** Where every bottle went: one dot per district, town or country, labelled server-side. */
  points: BottleMapPoint[]
  className?: string
}

// gold-500 in globals.css. Mapbox paints on a canvas, so the token cannot
// reach it as a class.
const BRAND_GOLD = '#f59e0b'
const BOTTLE_LAYER = 'bottle-map-dots'

const UK_CENTER: [number, number] = [-2.5, 54.5] // Mapbox uses [lng, lat]
const UK_ZOOM = 4.5

export default function ExpeditionLogMap({ points, className }: Props) {
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
        // Where every bottle went, as a circle layer so the dots scale with the
        // count.
        if (points.length > 0) {
          map.addSource('bottle-map', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: points.map((p) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                properties: { bottles: p.bottles, label: p.label },
              })),
            },
          })
          map.addLayer({
            id: BOTTLE_LAYER,
            type: 'circle',
            source: 'bottle-map',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['get', 'bottles'], 1, 4, 6, 7, 24, 11, 100, 16],
              'circle-color': BRAND_GOLD,
              'circle-opacity': 0.7,
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 1,
            },
          })

          const dotPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
            className: 'expedition-popup',
          })
          // The layer's features carry the label we attached above; Mapbox types
          // the feature loosely, so read it structurally.
          const showDot = (e: mapboxgl.MapMouseEvent) => {
            const feature = e.features?.[0] as unknown as
              | { geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> | null }
              | undefined
            if (!feature || feature.geometry.type !== 'Point') return
            const label = feature.properties?.label
            if (typeof label !== 'string') return
            dotPopup.setLngLat(feature.geometry.coordinates as [number, number]).setText(label).addTo(map)
          }
          // Desktop: hover. Mobile: tap toggles.
          map.on('mouseenter', BOTTLE_LAYER, (e) => {
            map.getCanvas().style.cursor = 'pointer'
            showDot(e)
          })
          map.on('mouseleave', BOTTLE_LAYER, () => {
            map.getCanvas().style.cursor = ''
            dotPopup.remove()
          })
          map.on('click', BOTTLE_LAYER, (e) => {
            if (dotPopup.isOpen()) dotPopup.remove()
            else showDot(e)
          })
        }
      })
    })

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [points])

  return <div ref={containerRef} className={className ?? 'w-full h-64 rounded-xl'} />
}
