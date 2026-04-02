# Stockists Mapbox Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CartoDB map tiles in `StockistMap.tsx` with Mapbox dark tiles, and replace the `postcodes.io` geocoding call in `StockistFinder.tsx` with the Mapbox Geocoding API — giving the stockists page the same mapping vendor as the expedition log.

**Architecture:** Both changes are in client components. `StockistMap.tsx` swaps the Leaflet tile layer URL (one line). `StockistFinder.tsx` replaces the `fetch` call to `postcodes.io` with a `fetch` to the Mapbox Geocoding API. Both use `NEXT_PUBLIC_MAPBOX_TOKEN`. CSP additions needed only if the Expedition Log plan has not been applied first — see Task 3.

**Tech Stack:** Leaflet.js (npm, already installed), Mapbox Tiles + Geocoding API, TypeScript, Tailwind CSS, Playwright (tests)

**Dependency note:** If the Expedition Log plan (`docs/superpowers/plans/2026-04-01-expedition-log.md`) has already been applied, the `NEXT_PUBLIC_MAPBOX_TOKEN` env var and the `https://api.mapbox.com` CSP origins are already in place. Task 3 of this plan handles it if not.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/StockistMap.tsx` | Modify | Swap CartoDB tile URL for Mapbox dark-v11 |
| `src/components/StockistFinder.tsx` | Modify | Swap `postcodes.io` fetch for Mapbox Geocoding API |
| `next.config.ts` | Modify (conditional) | Add `https://api.mapbox.com` to `connect-src` and `img-src` — only if Expedition Log plan not already applied |

---

## Chunk 1: Map tiles and geocoding

### Task 1: StockistMap — Mapbox tile layer

**Files:**
- Modify: `src/components/StockistMap.tsx`

Current tile layer (line 41):
```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
}).addTo(map)
```

- [ ] **Step 1: Write the failing e2e test**

Add to `tests/e2e/expedition-log.spec.ts` (or create `tests/e2e/stockists.spec.ts`):

```typescript
// tests/e2e/stockists.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Stockists page', () => {
  test('stockists page loads', async ({ page }) => {
    await page.goto('/stockists/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Find Expedition Spiced')
  })

  test('postcode search form is present', async ({ page }) => {
    await page.goto('/stockists/')
    await expect(page.locator('input[placeholder*="postcode" i], input[placeholder*="SW1A" i]')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test to confirm it passes against the live site (baseline)**

```bash
BASE_URL=https://jerrycanspirits.co.uk npx playwright test tests/e2e/stockists.spec.ts --reporter=line
```

Expected: Both tests PASS (existing page works). This confirms the baseline before making changes.

- [ ] **Step 3: Replace the CartoDB tile layer with Mapbox in `StockistMap.tsx`**

Replace the existing `L.tileLayer(...)` block with:

```typescript
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
L.tileLayer(
  `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
  {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
).addTo(map)
```

The full updated `useEffect` in `StockistMap.tsx` after the change:

```typescript
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

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(map)

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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/StockistMap.tsx
git commit -m "feat: switch StockistMap tile layer from CartoDB to Mapbox dark-v11"
```

---

### Task 2: StockistFinder — Mapbox geocoding

**Files:**
- Modify: `src/components/StockistFinder.tsx`

Current geocoding (lines 72-87):
```typescript
const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`)
const data = await res.json() as { status: number; result: { latitude: number; longitude: number } }

if (!res.ok || data.status !== 200) {
  setErrorMessage('Postcode not recognised. Please check and try again.')
  setSearchState('error')
  return
}

runSearch(data.result.latitude, data.result.longitude, postcode.trim())
```

Mapbox Geocoding API returns GeoJSON. Features are ordered by relevance. Coordinates are `[longitude, latitude]` (GeoJSON convention — longitude first).

- [ ] **Step 1: Replace the `postcodes.io` fetch with Mapbox Geocoding in `handleSearch`**

Replace the `try` block inside `handleSearch` (everything from `const res = await fetch(...)` to `runSearch(...)`) with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StockistFinder.tsx
git commit -m "feat: switch StockistFinder geocoding from postcodes.io to Mapbox"
```

---

### Task 3: CSP and environment variable

**Files:**
- Modify: `next.config.ts` (conditional — skip if Expedition Log plan already applied)

**Check first:** If the Expedition Log plan has already been deployed, `https://api.mapbox.com` is already in `connect-src`. Run:

```bash
grep "api.mapbox.com" next.config.ts
```

If it prints a result, skip to Step 3 (env var only).

- [ ] **Step 1: Add `https://api.mapbox.com` to `connect-src` in `next.config.ts`**

In the `connect-src` line (~line 78), add `https://api.mapbox.com` before `wss: ws:`:

```
... https://tracker.metricool.com https://api.mapbox.com wss: ws:"
```

Also remove `https://api.postcodes.io` from `connect-src` — it is no longer called from the client. (Verify no other component calls postcodes.io before removing.)

```bash
grep -r "postcodes.io" src/
```

If the grep returns nothing, it is safe to remove `https://api.postcodes.io` from `connect-src`.

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Add `NEXT_PUBLIC_MAPBOX_TOKEN` to local dev environment**

Add to `.env.local` (this file is gitignored — never commit it):

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

Add the same variable to Cloudflare Pages environment variables (Settings → Environment variables → Production + Preview).

The token should be a **public token** restricted to `jerrycanspirits.co.uk` in the Mapbox dashboard (Account → Access tokens → Create a token → URL restrictions).

- [ ] **Step 4: Commit CSP changes**

```bash
git add next.config.ts
git commit -m "feat: add Mapbox to CSP connect-src, remove postcodes.io"
```

---

### Task 4: Post-deploy verification

- [ ] **Step 1: Run stockists e2e tests against production**

After deploying:

```bash
BASE_URL=https://jerrycanspirits.co.uk npx playwright test tests/e2e/stockists.spec.ts --reporter=line
```

Expected: Both tests PASS.

- [ ] **Step 2: Manual smoke test**

1. Navigate to `https://jerrycanspirits.co.uk/stockists/`
2. Confirm the map loads with dark Mapbox tiles (not the CARTO watermark)
3. Enter postcode `FY1 1EJ` → confirm "The Bank Bar & Grill" appears in results with correct distance
4. Click "Use my current location" → confirm map centres on your location
5. Confirm the Mapbox attribution (`© Mapbox © OpenStreetMap`) appears in the map corner
