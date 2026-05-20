'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import type { ExpeditionLogEntry } from '@/lib/d1'

interface Props {
  entries: ExpeditionLogEntry[]
  className?: string
}

const UK_CENTER: [number, number] = [-2.5, 54.5] // Mapbox uses [lng, lat]
const UK_ZOOM = 4.5

export default function ExpeditionLogMap({ entries, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])

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

        markersRef.current = geocoded.map((entry) => {
          const el = document.createElement('div')
          el.style.cssText = `
            width: 14px;
            height: 14px;
            background: #f59e0b;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 0 8px rgba(245,158,11,0.6);
            cursor: pointer;
          `

          // Build popup body with textContent to defuse any XSS from
          // user-supplied name / location strings.
          const popupContent = document.createElement('div')
          popupContent.style.cssText = 'font-family: sans-serif; padding: 2px 0;'

          const nameEl = document.createElement('p')
          nameEl.style.cssText = 'margin: 0 0 4px; font-weight: 600; color: #fff; font-size: 13px;'
          nameEl.textContent = entry.name
          popupContent.appendChild(nameEl)

          if (entry.location) {
            const locEl = document.createElement('p')
            locEl.style.cssText = 'margin: 0; color: #c8bfa8; font-size: 12px;'
            locEl.textContent = entry.location
            popupContent.appendChild(locEl)
          }

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 12,
            className: 'expedition-popup',
          }).setDOMContent(popupContent)

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([entry.location_lng, entry.location_lat])
            .addTo(map)

          // Desktop: hover
          el.addEventListener('mouseenter', () => {
            popup.setLngLat([entry.location_lng, entry.location_lat]).addTo(map)
          })
          el.addEventListener('mouseleave', () => popup.remove())

          // Mobile: tap toggles popup
          el.addEventListener('click', () => {
            if (popup.isOpen()) {
              popup.remove()
            } else {
              popup.setLngLat([entry.location_lng, entry.location_lat]).addTo(map)
            }
          })

          return marker
        })
      })
    })

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
      markersRef.current = []
    }
  }, [entries])

  return <div ref={containerRef} className={className ?? 'w-full h-64 rounded-xl'} />
}
