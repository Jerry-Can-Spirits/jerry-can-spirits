# Pour IQ Pre-Test Sweep — 2026-07-07

Four parallel audits (security, data integrity, resilience, code quality) across
`src/lib/pouriq`, `src/app/api/pouriq`, `src/app/trade/pouriq`, `src/components/pouriq`.
Findings deduplicated and re-prioritised below. Several were flagged by more than
one sweep (noted) — higher confidence.

## Fix before E2E testing (correctness / data loss)

### C1 — Deleting the last real menu corrupts venue data *(flagged by code-quality P1 + data-integrity F1)*
Two coupled bugs on the same path:
- **Atomicity:** `deleteMenu` (`menus.ts:134-151`) runs SELECT/DELETE/UPDATE as separate awaits. If the promotion UPDATE fails after the DELETE, the venue is left with NO active menu — POS ingest then permanently returns `paused:true` and marks orders seen without counting them (unrecoverable volume loss). Fix: wrap DELETE + promotion in one `db.batch()` (mirror `setActiveMenu:48`).
- **Serves-menu leak:** neither `getActiveMenu` (`menus.ts:35`) nor `deleteMenu`'s fallback subquery (`:146`) filters `is_serves_menu = 0`. Deleting the last real menu can promote the hidden serves menu to active; dashboard/POS/attention then compute against a menu with no real drinks. Fix: add `AND is_serves_menu = 0` to both (also `insertMenu` count `:69` — P5). `listMenusForTradeAccount` already has the guard.

### C2 — Inc-VAT invoices pushed to accounting as ex-VAT *(flagged by data-integrity F2 + code-quality P8)*
`prices_include_vat` is written by a separate, error-swallowing UPDATE after `insertInvoiceHeader` (`invoices/commit/route.ts:154-162`); column has no DEFAULT (migration 0065), so a silent failure leaves NULL, which the bill-builder reads as ex-VAT (`bill-builder.ts:29`). Wrong VAT basis filed at the supplier. Fix: add `prices_include_vat` to `insertInvoiceHeader`'s INSERT so it's set atomically; add it to the `InvoiceRow` type while there.

### C3 — Same-day deliveries excluded from stock/variance *(data-integrity F3)*
Invoice commit stores a date-only `received_at` (`commit/route.ts:332`); `canonTs` leaves it 10 chars, so `"2024-01-15" < "2024-01-15 08:00:00"` string-compares false and the delivery drops out of same-day variance/stock windows (`stock-loader.ts:203`, `variance-rolling-loader.ts:251`). Understates on-hand, inflates variance. Fix: store `invoice_date + ' 00:00:00'` when only a date is available.

### H1 — POS volume upsert not atomic *(data-integrity F4)*
`upsertAdditiveVolumes` (`pos/volume-buckets.ts:42-56`) does sequential upserts after `pouriq_pos_seen_orders` is already committed. Worker timeout mid-loop = orders marked seen, volumes lost, no reingest. Fix: one `db.batch()`.

### H2 — Orphaned library rows permanently block import/invoice retries *(data-integrity F5+F6, resilience F5)*
Both `import/commit` (`:142-185`) and `invoices/commit` (`:215-226`) insert library entries before their main batch; on failure the rows survive, and retry collides with `idx_pouriq_lib_uniqueness` and throws forever. Fix: clean up created library ids in the rollback path, or make the insert tolerant of the unique constraint on retry (INSERT ... ON CONFLICT resolving to the existing id).

### M1 — Cross-tenant ingredient linking (IDOR) *(security M1)*
`import/commit:198-205` and `menus.ts replaceIngredients:479-506` accept inbound `library_ingredient_id`/`existing_library_id` with no `trade_account_id` check; `listCocktailsForMenu` then JOINs library with no tenant filter, leaking another venue's ingredient name + cost into the attacker's menu. UUIDs blunt it (no enumeration) but it's a real missing bind and diverges from the repo's own standard (`invoices/commit:231` does it right). Fix: validate every inbound library id against the tenant, reject unknowns.

### M2 — Per-PIN login lockout never wired in *(security M2)*
`incrementTradeFailedAttemptsForPin` / `TRADE_PIN_MAX_ATTEMPTS` exist in `kv.ts:146-174` but are dead code; login (`trade/login/route.ts:33-52`) has per-IP throttling only, so a distributed attacker faces no global cap on a 4-digit PIN. Fix: wire the existing per-PIN helpers into the login route.

## Fix before testing (cheap + touches the recommend route, which is the weakest spot)

### R1 — `recommend` route: no Sentry, no API-key guard, no rate limit *(resilience F1+F2, security L3)*
The only Anthropic route missing all three protections every sibling route has (`recommend/route.ts:19-86`). Add: `ANTHROPIC_API_KEY` guard → 503, `Sentry.captureException` in the stream catch, per-tenant `isRateLimited`.

## Defer (record, revisit post-launch — none block testing)

- **M3 accounting push TOCTOU** (data-integrity F7): commit-hook push + hourly sweep could double-push a bill before either records it. UNIQUE constraint stops the second DB row, not the second provider call. Real but low-probability (needs a commit within the same hour the sweep runs it, both racing). Revisit with a pre-push claim/lock. QBO is sandbox-only until Intuit review, so no live exposure yet.
- **L: pending-PDF tenant check** (security L5): `invoices/pending/[ticket]/route.ts` doesn't compare `customMetadata.tradeAccountId`; sibling extract route does. UUIDv4 + short window mitigate. One-line add.
- **L: `isAllowedOrigin` on 6 mutation routes** (security L4): defence-in-depth only; `sameSite:lax` already blocks cross-site cookie POST.
- **cost-impact loaders ignore `yield_pct`** (code-quality P2): ripple/impact page pour cost disagrees with menu page for draught/produce (yield_pct != 100); needs query + calc change. Invisible for spirit-only menus.
- **AI truncation invisible to user** (resilience F4): max_tokens mid-extraction → Sentry warned, but user sees a silently short preview. Add a truncation flag to the response + banner.
- **F8 missing invoices tenant index**: migration 0033 dropped `idx_pouriq_invoices_tenant` and didn't recreate it; full scan on the invoices list. Perf only. Recreate in a migration.
- **Code polish** (P3/P4/P6/P7): duplicated `netSalePrice`+`VAT_DIVISOR` (cost-impact.ts, multi-cost-impact.ts — import from calculations.ts); pointless identical-interface spread copies in the two variance loaders; dead `fmtQty` branch (`measures.ts:102`); two `!` assertions in invoice commit that a weakened validateBody would defeat.
- **AccountingPushStatus retry** (resilience F3): network-error path on the retry button is silent; add a catch + error state.

## Clean (on record — pre-test confidence)

- Auth: all 40 API routes gate on `checkPourIqAccess` (webhook substitutes HMAC); all trade pages gate + LicenceGate.
- Tenant isolation on every read/serve/mutation path except the M1 linking gap; R2 keys tenant-prefixed and resolved tenant-scoped.
- SQL all `.bind` (only IN-list placeholders + whitelisted column names interpolated); no `dangerouslySetInnerHTML`/eval; portable-text link hrefs scheme-allow-listed.
- OAuth state single-use + expiry + provider/tenant recheck; session httpOnly+secure+lax, fresh sid on login, revoked on logout.
- Money rounding single `Math.round` after accumulation, no drift; VAT basis threaded consistently through GP maths.
- POS dedup (`seen_orders` + INSERT OR IGNORE) correct; cascade deletes match code expectations; `setActiveMenu` atomic.
- Cron handlers all `waitUntil`-wrapped with top-level try/catch + Sentry; accounting sweep triple-guarded.
- No `any` types anywhere in scope; no live TODO/FIXME; API→component contracts consistent; no oversized/tangled files.
