# Expedition Log Design

## Goal

Build "The Expedition Log" — an opt-in public listing of people who bought a bottle, showing name, location, date, and an optional message. Signals early community and belonging. Also serves as a heat map of where bottles have gone. Auto-approved on submission; soft delete for admin removal.

## URL and Navigation

- Public page: `https://jerrycanspirits.co.uk/expedition-log/`
- Linked from: batch detail page (below the form), footer (`The Brand` link group)
- Form also embedded in the QR-Squared bottle neck HTML widget

---

## Architecture

Server-rendered public page. Client components only where required (map, form). API route receives submissions, validates a Cloudflare Turnstile token, optionally geocodes location via Mapbox, then inserts into D1. Auto-approved — no moderation queue. Admin removes entries by setting `removed_at` via a migration file.

No email collection. No login required.

**Bot protection: Cloudflare Turnstile.** A free Cloudflare challenge widget that generates a cryptographic one-time token. The API route validates the token server-side before inserting. Works across all Workers instances — not in-memory, not best-effort.

**Geocoding: Mapbox Geocoding API.** Replaces both Nominatim and postcodes.io across the project. UK-constrained (`country=gb`). Returns precise lat/lng. Same vendor as the map tile layer, so one API key covers both.

---

## Environment Variables

Two new variables needed:

| Variable | Where used | Notes |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | API route (server) | From Cloudflare Turnstile dashboard. Never exposed to client. |
| `TURNSTILE_SITE_KEY` | Form components (client) | From Cloudflare Turnstile dashboard. Safe to expose — scoped to domain. Add as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env.local` and as a Cloudflare Pages environment variable. |
| `MAPBOX_SECRET_TOKEN` | API route (server) | For geocoding. Restricted token — never exposed to client. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Map component (client) | For tile loading. Restricted to `jerrycanspirits.co.uk` in Mapbox dashboard. |

---

## Database

### Migration: `0010_expedition_log.sql`

```sql
-- Expedition Log: opt-in public listing of bottle buyers
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0010_expedition_log.sql

CREATE TABLE IF NOT EXISTS expedition_log (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  location_lat REAL,
  location_lng REAL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  removed_at TEXT -- NULL = visible; set via migration to soft-delete
);

CREATE INDEX IF NOT EXISTS idx_expedition_log_created_at
  ON expedition_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expedition_log_batch_id
  ON expedition_log(batch_id);
```

### Columns

| Column | Notes |
|---|---|
| `id` | Generated server-side via `crypto.randomUUID()` |
| `batch_id` | e.g. `batch-001`, supplied by the form |
| `name` | Required, max 100 chars |
| `location` | Free-text, optional, max 100 chars — e.g. "Newport, Wales" |
| `location_lat` / `location_lng` | Resolved via Mapbox at submission; null if location blank or unresolvable |
| `message` | Optional, max 500 chars |
| `removed_at` | Null = visible. Set via migration to soft-delete without an admin UI |

### Admin removal

```sql
-- Example: 0011_remove_expedition_log_entry.sql
UPDATE expedition_log SET removed_at = datetime('now') WHERE id = '<entry-id>';
```

---

## D1 Query Layer (`src/lib/d1.ts`)

```typescript
export interface ExpeditionLogEntry {
  id: string;
  batch_id: string;
  name: string;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  message: string | null;
  created_at: string;
}

export async function getExpeditionLogEntries(db: D1Database): Promise<ExpeditionLogEntry[]> {
  const result = await db
    .prepare(
      `SELECT id, batch_id, name, location, location_lat, location_lng, message, created_at
       FROM expedition_log
       WHERE removed_at IS NULL
       ORDER BY created_at DESC`,
    )
    .all<ExpeditionLogEntry>();
  return result.results;
}
```

`removed_at` excluded from the interface — never rendered.

---

## API Route: `src/app/api/expedition-log/route.ts`

`POST /api/expedition-log`

### Request body (JSON)

```typescript
{
  name: string;              // required
  batch_id: string;          // required, e.g. "batch-001"
  location?: string;         // optional
  message?: string;          // optional
  turnstileToken: string;    // required — cf-turnstile-response value from the form
  website?: string;          // honeypot — must be empty
}
```

### Behaviour

1. **Honeypot**: if `website` is non-empty, return `200` silently (do not insert).
2. **Validate inputs**: `name` required and non-empty; `batch_id` required and non-empty; `name` max 100 chars; `location` max 100 chars if provided; `message` max 500 chars if provided; `turnstileToken` required and non-empty. Return `400` with `{ error }` on failure.
3. **Access secrets**: `const { env } = await getCloudflareContext()` — use `env.TURNSTILE_SECRET_KEY` and `env.MAPBOX_SECRET_TOKEN`. Do not use `process.env` — secret keys are Workers bindings, not Node env vars, and `process.env` returns `undefined` at runtime on Cloudflare Workers.
4. **Verify Turnstile token**: POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with body `{ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken }`. If `success` is false, return `400 { error: 'Bot check failed.' }`. Tokens are single-use — do not cache.
5. **Geocode** (if `location` non-empty): call Mapbox Geocoding API:
   ```
   https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=gb&limit=1&access_token=${env.MAPBOX_SECRET_TOKEN}
   ```
   Extract `features[0].geometry.coordinates` as `[lng, lat]` (Mapbox returns longitude first). If the response returns no features, or the fetch fails, `location_lat` and `location_lng` stay null (non-blocking — do not fail the submission).
6. **Insert**: generate `id` via `crypto.randomUUID()`, insert row.
7. **Return**: `201` with `{ success: true }`.

### Rate limiting

In-memory fallback (max 3 requests per IP per minute, same pattern as the contact route). Secondary deterrent only — Turnstile is the primary protection.

---

## Components

### `src/components/ExpeditionLogForm.tsx`

Client component (`'use client'`). Props: `{ batchId: string }`.

**Turnstile setup:** Load the Turnstile script once via a `<Script>` tag with `strategy="lazyOnload"`:
```tsx
<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
```

Form fields:
- `name` — text input, required, placeholder `"Your name"`
- `location` — text input, optional, placeholder `"City, country (optional)"`
- `message` — textarea, optional, placeholder `"Notes from the field (optional)"`, rows 3
- `batch_id` — `type="hidden"`, value = `batchId` prop
- Turnstile widget — `<div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />`
  The widget renders invisibly by default and automatically populates a hidden `cf-turnstile-response` input.
- `website` — honeypot: `type="text"` with `className="sr-only"`, `tabIndex={-1}`, `autoComplete="off"`. Must be `type="text"` (not `type="hidden"`) so bots fill it.

On submit: read `cf-turnstile-response` from the form data via `new FormData(formElement).get('cf-turnstile-response')`, then:
```ts
fetch('/api/expedition-log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name,
    batch_id: batchId,
    location: location || undefined,
    message: message || undefined,
    turnstileToken,
    website,
  }),
})
```

State:
- `status: 'idle' | 'submitting' | 'success' | 'error'`
- `errorMessage: string`

On `201`: show success message. On error: show `errorMessage`.

Success copy: `"You're on the log. Welcome to the expedition."`

Styling: matches existing form patterns — gold border inputs on dark green background. Submit button: `bg-gold-500 text-jerry-green-900 font-bold`.

### `src/components/ExpeditionLogMap.tsx`

Client component (`'use client'`). Props: `{ entries: ExpeditionLogEntry[] }`.

Renders only if at least one entry has non-null coordinates.

Uses Leaflet.js + `leaflet.heat` plugin. Load via `useEffect` by dynamically appending `<link>` and `<script>` tags — avoids SSR issues without a CDN `<Script>` component.

**Load order (exact URLs):**
1. CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
2. JS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
3. Heat plugin: `https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js`

Wait for all three to load (via `onload` callbacks) before initialising the map.

**Map tile layer (Mapbox dark):**
```
https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token={NEXT_PUBLIC_MAPBOX_TOKEN}
```
Leaflet options: `tileSize: 512, zoomOffset: -1`.

Heat map options: `radius: 30, blur: 20, maxZoom: 10`.

Map container: `h-64 rounded-xl`. `useEffect` initialises after mount. Cleanup on unmount calls `map.remove()`.

**CSP update required in `next.config.ts`:**
- `script-src` and `script-src-elem`: add `https://unpkg.com` `https://challenges.cloudflare.com` — both directives must be updated; the codebase has a standalone `script-src-elem` that independently controls `<script>` tags and is not inherited from `script-src`
- `style-src`: add `https://unpkg.com`
- `frame-src`: add `https://challenges.cloudflare.com` (Turnstile renders an iframe)
- `img-src`: add `https://api.mapbox.com` (map tiles)
- `connect-src`: add `https://api.mapbox.com` (tile and geocoding requests)

---

## Page: `src/app/expedition-log/page.tsx`

Server component. `dynamic = 'force-dynamic'`.

### Metadata

```typescript
export const metadata: Metadata = {
  title: 'The Expedition Log | Jerry Can Spirits®',
  description: 'A public record of the people who bought the first bottles. Names, places, and notes from the field.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
}
```

### Data fetching

```typescript
const db = await getD1()
const entries = await getExpeditionLogEntries(db)
```

### Page sections (in order)

**1. Header**
- Small gold badge: `"The Expedition Log"`
- H1: `"The Expedition Log"`
- One short paragraph: `"A record of the people who carried the first bottles. Opt-in — each entry is a choice."`

**2. Map** (conditional)
- If any entries have non-null coordinates: `<ExpeditionLogMap entries={entries} />`
- If none: nothing rendered

**3. Entry list** (conditional)
- If `entries.length > 0`: reverse-chronological list. Each entry card:
  - Name: `text-white font-semibold`
  - Location (if non-null): `text-parchment-400 text-sm`
  - Date: `text-parchment-500 text-xs` — formatted `dd Month yyyy` via `toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })`
  - Message (if non-null): `text-parchment-300 text-sm leading-relaxed italic`
- If empty: single muted line — `"No entries yet. Be the first."`

**4. Form section**
- Heading: `"Join the Log"`
- One line: `"If you bought a bottle and want to be on the record, add your name."`
- `<ExpeditionLogForm batchId="batch-001" />` — hardcoded for launch; update when a second batch exists.

---

## Batch Detail Page Integration

Add a new section below the existing cards in `src/components/BatchDetails.tsx`:

```tsx
{/* Expedition Log */}
<div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
  <h2 className="text-2xl font-serif font-bold text-white mb-2">The Expedition Log</h2>
  <p className="text-parchment-300 text-sm mb-6">
    If this is your bottle, add your name to the log.
    A public record of the people who were here first.
  </p>
  <ExpeditionLogForm batchId={batch.id} />
</div>
```

`ExpeditionLogForm` is a client component — it can be imported and used directly inside the server component `BatchDetails.tsx`.

---

## Footer Integration

Add `{ name: 'The Expedition Log', href: '/expedition-log/' }` to the **`The Brand`** link group in `quickLinkGroups` in `src/components/Footer.tsx`. This is the same group that contains `Where the 5% Goes`.

---

## QR-Squared HTML Widget

Add a new `<details>` section to the existing accordion. Turnstile is loaded inline. The form POSTs to the live API endpoint. No framework — plain HTML with inline JS.

### Styles to append inside the `<style>` block

```css
.d-log-form{display:flex;flex-direction:column;gap:10px;margin-top:4px}
.d-log-input{background:#243324;border:1px solid #b8960c40;border-radius:6px;padding:9px 12px;font-size:11px;color:#f5e6c8;outline:none;width:100%;font-family:sans-serif}
.d-log-input::placeholder{color:#8a9a8a}
.d-log-textarea{background:#243324;border:1px solid #b8960c40;border-radius:6px;padding:9px 12px;font-size:11px;color:#f5e6c8;outline:none;width:100%;font-family:sans-serif;resize:vertical;min-height:72px}
.d-log-textarea::placeholder{color:#8a9a8a}
.d-log-btn{background:#b8960c;color:#0f1f0f;font-size:12px;font-weight:700;padding:11px 16px;border-radius:6px;border:none;width:100%;cursor:pointer;letter-spacing:0.3px}
.d-log-msg{font-size:10px;text-align:center;padding:6px 0}
.d-log-ok{color:#4caf50}
.d-log-err{color:#e57373}
```

### New accordion section HTML

Add after the "Order Another Bottle" section. Replace `YOUR_TURNSTILE_SITE_KEY` with the actual site key value.

```html
<!-- THE EXPEDITION LOG -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<details>
  <summary><span class="s-title">The Expedition Log</span></summary>
  <div class="d-body" style="padding-top:12px">
    <p style="font-size:11px;color:#c8b898;line-height:1.6;margin-bottom:14px">
      Add your name to the record. A public log of the people who were here first.
      Entirely optional.
    </p>
    <form class="d-log-form" id="jcs-log-form" onsubmit="jcsLogSubmit(event)">
      <input type="text" class="d-log-input" name="name" placeholder="Your name" required maxlength="100" autocomplete="name">
      <input type="text" class="d-log-input" name="location" placeholder="City, country (optional)" maxlength="100" autocomplete="off">
      <textarea class="d-log-textarea" name="message" placeholder="Notes from the field (optional)" maxlength="500"></textarea>
      <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY" data-size="compact"></div>
      <input type="text" name="website" style="position:absolute;left:-9999px;opacity:0" tabindex="-1" autocomplete="off">
      <button type="submit" class="d-log-btn">Join the Expedition Log</button>
    </form>
    <div id="jcs-log-msg" class="d-log-msg" style="display:none"></div>
    <p style="font-size:9px;color:#8a9a8a;text-align:center;margin-top:10px;line-height:1.5">
      Your name and location (if provided) will appear publicly at
      <a href="https://jerrycanspirits.co.uk/expedition-log/" style="color:#b8960c" target="_blank">jerrycanspirits.co.uk/expedition-log</a>
    </p>
  </div>
</details>
```

### Inline script to append before the closing `</div>` of `#jcs-acc`

```html
<script>
function jcsLogSubmit(e){
  e.preventDefault();
  var f=e.target,msg=document.getElementById('jcs-log-msg');
  var btn=f.querySelector('button[type=submit]');
  var fd=new FormData(f);
  var token=fd.get('cf-turnstile-response')||'';
  if(!token){
    msg.className='d-log-msg d-log-err';
    msg.textContent='Please complete the security check.';
    msg.style.display='block';
    return;
  }
  btn.disabled=true;btn.textContent='Sending...';
  fetch('https://jerrycanspirits.co.uk/api/expedition-log',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name:fd.get('name').trim(),
      batch_id:'batch-001', // update when a second batch exists
      location:fd.get('location').trim()||undefined,
      message:fd.get('message').trim()||undefined,
      turnstileToken:token,
      website:fd.get('website')
    })
  }).then(function(r){
    if(r.status===201){
      f.style.display='none';
      msg.className='d-log-msg d-log-ok';
      msg.textContent="You're on the log. Welcome to the expedition.";
      msg.style.display='block';
    } else {
      return r.json().then(function(d){
        msg.className='d-log-msg d-log-err';
        msg.textContent=d.error||'Something went wrong. Please try again.';
        msg.style.display='block';
        btn.disabled=false;btn.textContent='Join the Expedition Log';
      });
    }
  }).catch(function(){
    msg.className='d-log-msg d-log-err';
    msg.textContent='Something went wrong. Please try again.';
    msg.style.display='block';
    btn.disabled=false;btn.textContent='Join the Expedition Log';
  });
}
</script>
```

---

## QR-Squared HTML: Other Pending Edits

Two additional changes to apply in the same pass as the Expedition Log section:

1. **Bottle image**: Replace `<span class="acc-bottle-ph">Bottle<br>image<br>here</span>` with:
   ```html
   <img src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/c8ba631a-3382-4bb5-d935-57ac653ca500/public" alt="Expedition Spiced Rum" style="width:100%;height:100%;object-fit:cover;border-radius:6px">
   ```

2. **Batch page link**: Add directly below the `acc-prod-batch` badge:
   ```html
   <a href="https://jerrycanspirits.co.uk/batch/001/" style="display:inline-block;font-size:9px;color:#b8960c;text-decoration:underline;margin-top:6px" target="_blank">View batch details →</a>
   ```

---

## What Is Not In Scope

- Login or identity verification
- Email collection
- Moderation queue or admin UI
- Pagination (list grows slowly; a full-page load is fine at launch scale)
- Per-batch filtering on the public page
- Editing or deleting own entries (no user accounts)
- Replacing postcodes.io in the suppliers section (separate task — not part of this feature)
