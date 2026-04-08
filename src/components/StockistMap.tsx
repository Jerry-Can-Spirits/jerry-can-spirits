'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'

export interface Stockist {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: 'independent' | 'bar' | 'restaurant' | 'online'
}

interface StockistMapProps {
  stockists: Stockist[]
  center: [number, number]
  zoom: number
}

type MapStyle = 'dark' | 'satellite'

const STYLE_URLS: Record<MapStyle, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

export default function StockistMap({ stockists, center, zoom }: StockistMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])
  const [activeStyle, setActiveStyle] = useState<MapStyle>('dark')

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
        style: STYLE_URLS[activeStyle],
        center: [center[1], center[0]], // Mapbox uses [lng, lat]
        zoom,
        scrollZoom: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('load', () => {
        markersRef.current = stockists.map((stockist) => {
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

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 12,
            className: 'stockist-popup',
          }).setHTML(`
            <div style="font-family: sans-serif; padding: 2px 0;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #fff; font-size: 13px;">${stockist.name}</p>
              <p style="margin: 0; color: #c8bfa8; font-size: 12px;">${stockist.address}</p>
            </div>
          `)

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([stockist.lng, stockist.lat])
            .addTo(map)

          // Desktop: hover
          el.addEventListener('mouseenter', () => {
            popup.setLngLat([stockist.lng, stockist.lat]).addTo(map)
          })
          el.addEventListener('mouseleave', () => popup.remove())

          // Mobile: tap toggles popup
          el.addEventListener('click', () => {
            if (popup.isOpen()) {
              popup.remove()
            } else {
              popup.setLngLat([stockist.lng, stockist.lat]).addTo(map)
            }
          })

          return marker
        })
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as import('mapbox-gl').Map).remove()
        mapRef.current = null
      }
      markersRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockists, center, zoom])

  // Style toggle — update map style without remounting
  useEffect(() => {
    if (!mapRef.current) return
    ;(mapRef.current as import('mapbox-gl').Map).setStyle(STYLE_URLS[activeStyle])
  }, [activeStyle])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Satellite toggle */}
      <button
        onClick={() => setActiveStyle((s) => s === 'dark' ? 'satellite' : 'dark')}
        className="absolute bottom-3 left-3 z-10 px-3 py-1.5 bg-jerry-green-900/90 border border-gold-500/30 text-parchment-300 text-xs font-medium rounded-md hover:bg-jerry-green-800 hover:text-white transition-colors backdrop-blur-sm"
        type="button"
      >
        {activeStyle === 'dark' ? 'Satellite' : 'Map'}
      </button>
    </div>
  )
}
