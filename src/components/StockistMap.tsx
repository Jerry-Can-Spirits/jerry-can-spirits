'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

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

export default function StockistMap({ stockists, center, zoom }: StockistMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    import('leaflet').then((L) => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(containerRef.current!, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      stockists.forEach((stockist) => {
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(245,158,11,0.6);"></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        L.marker([stockist.lat, stockist.lng], { icon })
          .bindPopup(`<strong>${stockist.name}</strong><br/>${stockist.address}`)
          .addTo(map)
      })

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [stockists, center, zoom])

  return <div ref={containerRef} className="w-full h-full" />
}
