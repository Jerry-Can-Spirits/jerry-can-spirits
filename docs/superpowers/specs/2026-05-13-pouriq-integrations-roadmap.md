# Pour IQ Integrations Roadmap — Square / ePOSnow / Lightspeed POS + Xero

**Status:** Design spec. Three phases (POS → Invoice OCR/Xero → Multi-venue) each with their own follow-up plan.

**Why this exists:** Dan asked me to research Jelly (the leading UK food-costing tool for hospitality) and propose how Pour IQ matches or beats it. This document maps Jelly's offering against Pour IQ's current state, identifies the differentiation lanes, and proposes a sequenced integration roadmap.

---

## Competitive baseline — what Jelly does

**Source:** `getjelly.co.uk` plus public blog content (May 2026).

**Product features**
1. Invoice automation — AI-powered OCR of supplier invoices, line-item digitisation, account coding
2. Recipe costing — yield/unit/wastage-aware cost calculation
3. Margin tracking — daily Flash Reports combining POS sales with invoice costs
4. Supplier price alerts — daily notifications when supplier prices move
5. Digital cookbook — mobile-accessible recipes with allergens
6. Stock counting — inventory valuation
7. Centralised supplier ordering

**Integrations**
- POS: **Square, Lightspeed, ePOSnow, Toast**
- Accounting: **Xero only** (invoices → Xero as bills with line items, OAuth)

**Pricing:** £129/location/month flat. Multi-site bar managers love this — it scales linearly with venues, no per-seat or per-feature tiering.

**Positioning:** "Reclaim 10-20 hours of weekly admin time and lift GP 2-3pp."

---

## Where Pour IQ already beats Jelly

These are differentiation lanes we shouldn't lose by chasing parity:

- **AI recommendations** — Jelly shows numbers; Pour IQ tells the bar manager *what to change* in plain English with Field Manual cross-references. No Jelly equivalent.
- **Cost-change ripple / what-if simulation** — Jelly tracks the change after it happens. Pour IQ lets you simulate it before, including across multiple menus. Native to the way bar managers actually negotiate with suppliers.
- **Promo pricing (day-aware)** — Pour IQ models 2-4-1 Wednesdays separately from regular GP. Jelly has no concept of intentional GP trade-offs.
- **VAT-aware GP** — explicit inc/net toggle per menu so the GP that Pour IQ shows matches what an accountant would compute.
- **Cross-tenant barcode catalogue** — collective intelligence. Pour IQ customers seed each other's libraries every time someone scans a bottle. Jelly has no equivalent — every venue starts from zero.
- **Field Manual integration** — bartender education tied to live menu. No Jelly equivalent.
- **Menu cloning + version comparison** — seasonal menu workflow with diff. No Jelly equivalent.

---

## Where Jelly currently beats Pour IQ

The gaps. Sequenced by ROI for the bar manager:

1. **Sales velocity per drink** — Jelly auto-fetches from POS; Pour IQ requires manual volume entry (paste-from-POS is a friction-killer but still manual). **Phase 3.1 fixes this.**
2. **Invoice OCR for supplier costs** — Jelly's headline feature. Bar manager photographs the invoice; line items flow to recipe costing automatically. Pour IQ requires manual library cost updates. **Phase 3.2 fixes this.**
3. **Xero handoff** — Jelly digitises invoices into Xero bills with full line-item detail. Pour IQ does nothing with Xero. **Phase 3.2 fixes this.**
4. **Supplier price alerts** — Jelly notifies when costs move. Pour IQ has the calculation surface (cost-change what-if) but no alerting. **Phase 3.2 includes this.**
5. **Multi-site roll-up** — Jelly's £129/location model assumes a group operator. Pour IQ's one-trade-account-per-venue assumes a single site. **Phase 3.3 fixes this.**
6. **Inventory valuation / stock counting** — Jelly does it; Pour IQ doesn't. **Out of scope for this roadmap** — different problem domain (closer to inventory management than menu intelligence).

---

## Phase 3.1 — POS integration (Square first)

**Goal:** Sales volumes flow from POS to Pour IQ automatically. Bar manager stops manually entering numbers; contribution / what-if / AI recommendations get fresh data daily.

### Why Square first
- Largest UK on-trade POS install base among Pour IQ's likely pilot venues (independents, small chains)
- API: documented, OAuth 2.0, REST, free developer tier
- We already have AI menu import — Square's "items" catalog gives us name-based matching for free
- Webhook support (real-time order events) avoids polling

### Data we need from Square
- **Orders API**: completed orders, each with `line_items[]`
- **Each line item**: `name`, `quantity`, `gross_sales_money`, `created_at`, optional `item_variation_id`
- **Webhooks**: `order.created` and `order.updated` (state=COMPLETED) for near-real-time push

### Architecture

```
Square → OAuth → Pour IQ stores access_token+refresh_token per tenant
                 in pouriq_pos_connections (new table)
Square → webhook → /api/pouriq/integrations/square/webhook
        → match line_item.name to cocktail.name (normalised)
        → upsert pouriq_drink_volumes for that day's period
        → fall back to scheduled sync every 6 hours for missed events
```

### Schema (`migrations/00XX_pos_connections.sql`)

```sql
CREATE TABLE pouriq_pos_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('square', 'eposnow', 'lightspeed', 'toast')),
  external_account_id TEXT NOT NULL,        -- Square merchant_id, etc.
  access_token TEXT NOT NULL,                -- encrypted at rest
  refresh_token TEXT,
  token_expires_at TEXT,
  scopes TEXT,                               -- comma-separated
  last_synced_at TEXT,
  webhook_secret TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX uniq_pos_connection_per_provider
  ON pouriq_pos_connections(trade_account_id, provider);
```

Tokens stored encrypted using the same KV-based key derivation we use elsewhere. One connection per provider per tenant.

### UI

- New `/trade/pouriq/settings/integrations` page
- Card per provider with **Connect** button → OAuth flow → callback writes connection row
- Per-connection: status, last-sync timestamp, **Disconnect** button
- On the menu detail page, drinks table picks up volumes automatically — the existing VolumeEditor still works for manual override

### Matching strategy
- Primary: normalised name match (lowercase, whitespace collapsed)
- Drinks with no match: surface in a "couldn't match these POS items" section so the bar manager can either rename their Pour IQ drink or alias the POS SKU to a Pour IQ drink
- Optional Phase 3.1.1: explicit `pos_item_id` field on `pouriq_cocktails` for ambiguous cases

### Out of scope for v1
- Refunds / voids (skipped — net effect over a period is what matters)
- Tip handling (irrelevant to drink margin)
- Per-shift breakdowns (just day/week/month totals to start)
- Modifiers (single Mojito with extra mint = single Mojito for now)

### ePOSnow, Lightspeed, Toast
Same pattern, separate OAuth flows. Sequenced after Square. Lightspeed's API is well-documented; ePOSnow's is less so but they have a REST API; Toast is US-first but expanding UK.

---

## Phase 3.2 — Invoice ingestion + Xero handoff

**Goal:** Supplier costs update automatically. Pour IQ catches price changes the moment they hit a supplier invoice, ripples the GP impact across affected drinks, and (optionally) hands the digitised invoice to Xero as a bill.

### Two input paths

**A. Photo / PDF upload** — bar manager photographs an invoice or uploads the PDF. We already have the Anthropic-PDF pipeline from menu import; same pattern:
- POST invoice to R2 with `pouriq-invoices/` prefix
- Anthropic extracts line items: `supplier`, `invoice_date`, `lines[{name, quantity, unit_cost_p, total_p, gtin?}]`
- Match each line to a library entry by GTIN (if present and we have the barcode) or fuzzy name match
- Bar manager reviews/corrects in a preview UI (same pattern as menu import preview)
- Commit → library entries get new costs

**B. Xero bills sync** — for venues already pushing supplier invoices into Xero:
- OAuth into Xero
- Periodically fetch `GET /api.xro/2.0/Invoices?Type=ACCPAY&Statuses=AUTHORISED`
- Treat each bill the same as the photo path from "Line items extracted" onward

Either way the downstream flow is identical: matched library entry gets a cost update, cost-change ripple runs, affected drinks get re-priced, AI recommendations re-run.

### Supplier price alerts (composes with this)

When a library entry's cost increases by ≥ X% (configurable per tenant, default 5%) compared to its last value, fire an alert:
- In-app banner on `/trade/pouriq` dashboard
- Email via Resend (we already have Resend wired for trade application emails)
- Each alert links to the cost-change what-if pre-populated with the new cost so the bar manager can see GP impact in one click

### Schema

```sql
CREATE TABLE pouriq_supplier_invoices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  supplier_name TEXT,
  invoice_date TEXT,
  invoice_reference TEXT,
  source TEXT NOT NULL CHECK (source IN ('photo', 'pdf', 'xero')),
  source_ref TEXT,                  -- Xero invoice ID, or R2 key for upload
  total_p INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'committed', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  committed_at TEXT
);

CREATE TABLE pouriq_supplier_invoice_lines (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL REFERENCES pouriq_supplier_invoices(id) ON DELETE CASCADE,
  extracted_name TEXT NOT NULL,
  extracted_gtin TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit_cost_p INTEGER NOT NULL,
  total_p INTEGER NOT NULL,
  matched_library_id TEXT,          -- nullable; resolved by user at commit
  previous_cost_p INTEGER,          -- snapshot for price-alert comparison
  pos_in_invoice INTEGER NOT NULL
);

CREATE TABLE pouriq_cost_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  library_ingredient_id TEXT NOT NULL,
  old_cost_p INTEGER NOT NULL,
  new_cost_p INTEGER NOT NULL,
  pct_change REAL NOT NULL,
  source_invoice_id TEXT REFERENCES pouriq_supplier_invoices(id) ON DELETE SET NULL,
  acknowledged_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Reverse path (optional power-user)
Once we trust the bar manager's cost data, push aggregate COGS journals back to Xero monthly. Defer this until a pilot venue explicitly asks for it.

---

## Phase 3.3 — Multi-venue group

**Goal:** A pub group with 4 sites should see Pour IQ as one product, not four. One login → switch between venues → group roll-up view.

### Schema (light touch)
```sql
CREATE TABLE pouriq_groups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  owner_trade_account_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pouriq_group_members (
  group_id TEXT NOT NULL REFERENCES pouriq_groups(id) ON DELETE CASCADE,
  trade_account_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, trade_account_id)
);
```

### Behaviour
- Trade account in a group sees a venue switcher in the top-right
- Group admin sees a **Group dashboard** with rolled-up KPIs across venues (avg GP per venue, top contributing drinks, total period margin)
- Ingredient library stays per-tenant by default (different suppliers, different costs)
- Optional shared library at group level for chains where central purchasing is real

### Out of scope
- Full RBAC (defer — see Phase 3.4 if it comes up)
- Per-user permissions inside a tenant (current PIN model is one PIN per tenant)

---

## Phase 3.4 — Multi-user accounts (deferred, not in this spec)

A different sprint. Listed only for context: once a group operator runs Pour IQ across 4 sites, individual bartenders / managers want their own login. That's a full auth refactor — separate spec when prioritised.

---

## Risks and dependencies

- **Cloudflare Workers OAuth complexity** — token storage with secure encryption at rest. Workers KV is fine; secrets handling needs care.
- **POS-to-Pour-IQ name matching** — same risk as menu import. Mitigated by user review surface for unmatched items.
- **Square's UK API parity** — Square UK and US have minor differences in available endpoints. Need to confirm during build (most relevant docs are US-focused).
- **Webhook reliability** — Square webhooks can be delayed or miss events; combine push with hourly backfill polling.
- **Xero rate limits** — 60 calls/min, 5,000/day per tenant. Plenty for daily syncs, may bite if we ever do real-time bill polling. Use webhooks where available.
- **Customer concentration** — building integration X before any pilot uses X is wasteful. **Don't build ePOSnow or Lightspeed until a pilot asks.** Square is the safest starting bet because of install-base breadth.

---

## Sequencing recommendation

```
Phase 3.1  Square POS integration                  ~1 week
Phase 3.2  Invoice OCR (photo path first)          ~1 week
           Xero bill ingestion (second)            ~3 days
           Cost-change alerts (composes)           ~2 days
Phase 3.3  Multi-venue group + switcher            ~1 week
```

That's ~3 weeks of build for a "Jelly with AI on top" product. Each phase is independently shippable and immediately useful — Phase 3.1 alone (POS sync) eliminates the most painful manual workflow we currently ask of bar managers.

---

## Pricing implication

Jelly is £129/location/month flat. Pour IQ's pricing is "TBD pending pilots". Three credible price points:

- **£99/location/month** — undercut Jelly, position as the AI-led alternative with the integrations they expect
- **£129/location/month** — match Jelly, win on differentiation (AI recs, what-if, day-aware promos)
- **£149/location/month** — premium positioning; only viable once we have 3+ paying pilots and case studies

Recommendation: launch at **£129** matching Jelly. Don't undercut — the AI features and Field Manual integration are real differentiators, not commodity. Multi-site discount (5 sites for £499/month) as the upsell once Phase 3.3 ships.

---

## What to ship first (if Dan approves)

1. Spec: this document — review, refine, agree scope
2. Plan: write `docs/superpowers/plans/2026-05-13-pouriq-square-pos.md` for Phase 3.1 alone
3. Build: Square OAuth + webhook + volume sync
4. Test against Dan's own Square account (if he has one) or a sandbox
5. Pilot venue feedback before Phase 3.2

The trademark filing and AI search audit (lower on the user's stated priority list) should slot in alongside Phase 3.1 or after — they're independent of integration work.
