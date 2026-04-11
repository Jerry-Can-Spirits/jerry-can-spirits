# Stockist Map — Mapbox GL JS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Leaflet in `StockistMap.tsx` with Mapbox GL JS, adding hover/tap popups and a satellite style toggle, then uninstall Leaflet entirely.

**Architecture:** `StockistMap.tsx` is rewritten in-place using the same Mapbox GL JS pattern as `ExpeditionLogMap.tsx`. Props interface is unchanged so `StockistFinder.tsx` requires no edits. Leaflet and `@types/leaflet` are uninstalled. The satellite toggle is an overlaid button that calls `map.setStyle()` to switch between `dark-v11` and `satellite-streets-v12`.

**Tech Stack:** Mapbox GL JS (already installed for expedition log), TypeScript, Tailwind CSS, Next.js 15 App Router, Cloudflare Pages / Edge runtime

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/StockistMap.tsx` | Rewrite | Replace Leaflet with Mapbox GL JS, add popup + satellite toggle |
| `package.json` + `package-lock.json` | Modify | Uninstall `leaflet` and `@types/leaflet` |

`StockistFinder.tsx` — no changes needed.

---

## Task 1: Rewrite StockistMap.tsx with Mapbox GL JS

**Files:**
- Modify: `src/components/StockistMap.tsx`

Current file uses Leaflet. Replace entirely with Mapbox GL JS following the `ExpeditionLogMap.tsx` pattern.

- [ ] **Step 1: Replace the file contents**

```tsx
'use client'

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
```

- [ ] **Step 2: Add popup styles to global CSS**

The Mapbox popup needs dark styling. Find the global stylesheet (check `src/app/globals.css`). Add at the end:

```css
/* Stockist map popup */
.stockist-popup .mapboxgl-popup-content {
  background: #1a2e1a;
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.stockist-popup .mapboxgl-popup-tip {
  border-top-color: #1a2e1a;
}
```

- [ ] **Step 3: Verify the file has no Leaflet imports**

```bash
grep -n "leaflet" src/components/StockistMap.tsx
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/StockistMap.tsx src/app/globals.css
git commit -m "feat: replace Leaflet with Mapbox GL JS in StockistMap, add satellite toggle and hover popups"
```

---

## Task 2: Uninstall Leaflet

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Uninstall Leaflet and its types**

```bash
npm uninstall leaflet @types/leaflet
```

Expected output includes: `removed N packages`.

- [ ] **Step 2: Verify no remaining Leaflet imports in src**

```bash
grep -rn "leaflet" src/
```

Expected: no output.

- [ ] **Step 3: Run build to confirm no breakage**

```bash
npm run build 2>&1 | tail -15
```

Expected: build completes with no errors. If TypeScript errors appear, they will reference Leaflet types — fix by removing any remaining type annotations like `import('leaflet').Map`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: uninstall leaflet — replaced by mapbox-gl in StockistMap"
```

---

## Task 3: Open PR

- [ ] **Step 1: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "feat: replace Leaflet with Mapbox GL JS on stockists map" --body "$(cat <<'EOF'
## Summary

- Rewrites \`StockistMap.tsx\` to use Mapbox GL JS directly (same library as expedition log map)
- Gold dot markers preserved, same style as before
- Hover popup on desktop, tap popup on mobile — shows venue name and address
- Satellite toggle button overlaid bottom-left — switches between \`dark-v11\` and \`satellite-streets-v12\`
- Leaflet and \`@types/leaflet\` uninstalled — one fewer map library in the bundle

## Test plan

- [ ] Stockists page loads and map renders in dark style
- [ ] Gold dot markers appear for all stockists
- [ ] Hovering a marker on desktop shows popup with name and address
- [ ] Tapping a marker on mobile shows popup; second tap closes it
- [ ] Satellite toggle switches to satellite-streets view and back
- [ ] Postcode search still works and map recentres correctly
- [ ] No Leaflet CSS in network tab
- [ ] \`npm run build\` passes with no type errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
