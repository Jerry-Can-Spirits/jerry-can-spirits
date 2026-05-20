# Operator Steps — Activating Live Ratings on /reviews/

Companion runbook for PR implementing `docs/superpowers/specs/2026-05-20-reviews-live-ratings-design.md`. The code ships dark — these are the steps to switch it on.

Total time: roughly 20-30 minutes. Each step is independent; you can interleave them.

---

## Step 1 — Google Maps API key

1. Go to https://console.cloud.google.com/
2. Pick an existing project or create a new one (e.g. "jerry-can-spirits-prod")
3. **Enable Places API:**
   - Navigation menu → APIs & Services → Library
   - Search "Places API" (the one labeled "Places API" — not "Places API (New)" unless you want the v2 surface)
   - Click "Enable"
4. **Create the API key:**
   - APIs & Services → Credentials → Create credentials → API key
   - Copy the key value (starts with `AIza...`)
5. **Restrict the key (recommended):**
   - On the key's edit page, set:
     - **Application restrictions:** HTTP referrers → add `https://jerrycanspirits.co.uk/*`
       - Note: this won't restrict the Cron Worker calls (which use the key server-side, not via browser). For Worker-side calls, the key can be unrestricted at this layer — IP restriction is harder because Cloudflare egress IPs are wide. Acceptable to leave application restriction off for this key if you'd rather; the cost ceiling is the real defence.
     - **API restrictions:** Restrict to Places API only
   - Save.
6. **Make sure billing is enabled** on the project (Places API requires billing turned on, even for free-tier-only usage). The free monthly credit ($200) covers far more than our 720 calls/month.

**To store the key in production:**

```bash
npx wrangler secret put GOOGLE_MAPS_API_KEY
# Paste the AIza... key when prompted
```

---

## Step 2 — Google Place ID

1. Open https://developers.google.com/maps/documentation/places/web-service/place-id
2. Scroll to the "Find the ID of a particular place" widget
3. Search "Jerry Can Spirits Ltd" or "jerrycanspirits.co.uk"
4. Click the result that's your actual Google Business Profile
5. Copy the Place ID (looks like `ChIJ...`)

Drop the ID into `src/lib/ratings-config.ts`:

```ts
export const GOOGLE_PLACE_ID = 'ChIJ...your-id-here'
```

Commit + push that change directly to `main` (or as a tiny follow-up PR — single-line, trivial).

---

## Step 3 — Trustpilot API key

1. Sign in to your Trustpilot business account at https://businessapp.b2b.trustpilot.com
2. Settings → Integrations → API Access (or similar; UI moves occasionally)
3. Request a public API key. The default "Read Public" scope is what we need.
4. Approval is typically immediate.
5. Copy the API key.

**To store the key in production:**

```bash
npx wrangler secret put TRUSTPILOT_API_KEY
# Paste the key when prompted
```

---

## Step 4 — Trustpilot Business Unit ID

This is a one-off curl after Step 3 completes:

```bash
curl "https://api.trustpilot.com/v1/business-units/find?name=jerrycanspirits.co.uk&apikey=YOUR_TRUSTPILOT_KEY"
```

Response will include an `id` field — that's the Business Unit ID.

Drop into `src/lib/ratings-config.ts`:

```ts
export const TRUSTPILOT_BUSINESS_UNIT_ID = 'your-id-here'
```

Commit + push (can be the same follow-up PR as Step 2).

---

## Step 5 — Verify

1. Wait for the next top-of-the-hour. The hourly cron runs at `0 * * * *`.
2. Check Cloudflare logs (Workers → jerry-can-spirits-prod → Logs → search "Google Places" or "Trustpilot"):
   - **No errors** = both fetches succeeded.
   - **"Google Places fetch failed [status]"** = API key issue. Check Step 1 (billing? Places API enabled? key copied correctly?).
   - **"Trustpilot fetch failed [status]"** = API key issue. Check Step 3 / 4.
3. Verify the KV entries exist:

```bash
npx wrangler kv key get --binding=SITE_OPS --remote "rating:google"
npx wrangler kv key get --binding=SITE_OPS --remote "rating:trustpilot"
```

Both should return JSON with `rating`, `count`, `fetchedAt`.

4. Visit https://jerrycanspirits.co.uk/reviews/ — the Google and Trustpilot sections should now show the live rating row. (May take up to 1 hour to appear due to the ISR cache; force a regeneration by hitting `https://jerrycanspirits.co.uk/reviews/?nocache=1`.)

5. View source on `/reviews/` and search for `aggregateRating` — confirm the JSON-LD block now contains the live rating.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| KV entries empty after first hour | Both fetchers short-circuited because secrets or constants missing | Verify Steps 1-4 all complete. Re-run `wrangler secret list` to confirm both secrets are set. |
| Google KV has data, Trustpilot KV empty | Trustpilot side failed (likely Step 3 or 4 issue) | Check Cloudflare logs for "Trustpilot fetch failed". Verify Business Unit ID is correct via curl from your laptop. |
| Trustpilot KV has data, Google KV empty | Google side failed (Step 1 or 2) | Check logs for "Google Places fetch failed". Verify billing is enabled on the Cloud project. |
| Both KV entries populate, page still doesn't show ratings | Page is cached with old (empty-state) HTML | Visit `/reviews/?nocache=1`, wait for next visitor request after, or wipe the page from the Cloudflare cache. |
| `aggregateRating` block missing from page source | Both KV entries empty, or page was rendered before they were populated | Same as previous — wait for ISR window or force regeneration. |
