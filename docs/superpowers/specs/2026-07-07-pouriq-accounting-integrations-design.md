# Pour IQ Accounting Integrations (Xero + QuickBooks) — Design

Date: 2026-07-07
Status: approved by Dan (brainstorming session 2026-07-07)

## Purpose

When a venue commits a scanned supplier invoice in Pour IQ, the same invoice should appear in their accounting software as a draft purchase bill, with no re-keying. Two providers: Xero and QuickBooks Online (QBO). This removes the last manual step between "invoice photographed" and "books up to date", and reinforces the positioning wedge: costed and booked before competitors have finished uploading.

## Scope decisions (agreed)

- **Purchase bills only.** No sales journals (venues already have POS-to-accounting flows; pushing sales risks double-counting). No PDF attachment in v1.
- **Auto-push on invoice commit.** No manual send button, no per-venue toggle.
- **One default expense account per connection**, chosen at connect time from a live-fetched chart of accounts, plus a default VAT treatment. Schema shaped so per-category account mapping can bolt on later without rework.
- **Bills land as drafts** (Xero `DRAFT`, QBO unapproved bill), so nothing hits the ledger without the bookkeeper's say-so.
- **Xero ships first** (credentials exist today); the QuickBooks adapter follows behind the same interface, likely as a second smaller PR. QBO production go-live waits on Intuit's app review; development runs against their sandbox company.

## Architecture

A parallel accounting adapter layer mirroring the existing POS pattern (`src/lib/pouriq/pos/`). The live POS code is not touched. Push-to-accounting and pull-from-POS differ genuinely (no webhooks, no sync loop, different failure semantics), so a separate family with ~100 lines of duplicated route boilerplate is the deliberate trade against generalising working OAuth routes right before E2E run 2.

New module `src/lib/pouriq/accounting/`:

- `types.ts` — the adapter interface:
  - `provider: 'xero' | 'quickbooks'`
  - `exchangeCodeForToken(code, redirectUri)` → tokens, expiry, external account id (Xero tenant id / QBO realm id), org name
  - `refreshAccessToken(refreshToken)` → new tokens
  - `listExpenseAccounts(connection)` → `{ code, name }[]` for the connect-time picker
  - `pushBill(connection, bill)` → `{ externalBillId }`
  - `revokeToken(connection)` — best-effort on disconnect
  - No webhook methods. This interface is push-only.
- `providers/xero.ts`, `providers/quickbooks.ts`, `providers/index.ts` — registry keyed by env-var presence, exactly like POS: missing `QUICKBOOKS_CLIENT_ID` means `getAccountingAdapter('quickbooks')` returns null and the UI card renders disabled. QBO can ship dark.
- `bill-builder.ts` — pure: committed invoice + applied lines → provider-neutral bill (supplier name, reference, date, net line amounts, account code, tax code).
- `connections.ts`, `pushes.ts` — data layer.

### API routes

Under `/api/pouriq/integrations/accounting/[provider]/`:

- `oauth/start` — tenant check via `checkPourIqAccess()`, state nonce (reuses the existing `pouriq_pos_oauth_states` table — it is provider-agnostic CSRF plumbing), redirect to the provider authorize URL.
- `oauth/callback` — validate state, exchange code, upsert connection, redirect to the integrations page with `?connected={provider}` (errors via `?error={code}`).
- `setup` (POST) — save `default_account_code` + `default_tax_code` (and, for Xero, the chosen org when the login holds several).
- `accounts` (GET) — proxy `listExpenseAccounts` for the finish-setup dropdown.
- `retry` (POST) — re-attempt a failed push for one invoice.
- `disconnect` (POST) — best-effort revoke, delete the connection row; push history stays.

## Data model (one D1 migration)

**`pouriq_accounting_connections`** — same shape as `pouriq_pos_connections`:
`id`, `trade_account_id` FK, `provider` CHECK (`'xero'`,`'quickbooks'`), `external_account_id` (Xero tenant id / QBO realm id), `external_account_name`, `access_token`, `refresh_token`, `token_expires_at`, `default_account_code`, `default_tax_code`, `last_push_at`, `last_push_error`, `enabled`, `created_at`, `updated_at`, UNIQUE(`trade_account_id`, `provider`).

Per-category mapping later = a separate small table keyed on connection id; nothing here reshapes.

**`pouriq_accounting_pushes`** — one row per invoice-per-connection push attempt:
`id`, `invoice_id` FK, `connection_id` FK, `provider`, `status` CHECK (`'pushed'`,`'failed'`), `external_bill_id`, `error`, `pushed_at`, UNIQUE(`invoice_id`, `connection_id`) — the idempotency guard (an invoice can never go across twice) and the retry queue (failed rows are re-attemptable in place).

## Push flow

**Happy path.** At the end of the invoice commit route, after totals are finalised, a best-effort step (same pattern as the stock-receipts and recipe-recompute steps already there): look up the venue's enabled, fully-set-up accounting connection; if none, do nothing. Otherwise build the bill and `pushBill()`, record the result in `pouriq_accounting_pushes`.

**Bill payload.** Supplier name (both providers auto-create/match the vendor by name), invoice number as reference, invoice date, one line per applied invoice line: description = extracted name, quantity, net unit price, coded to `default_account_code` with `default_tax_code`. Amounts are tax-exclusive — stored figures are already net (migration 0054 VAT basis); the platform adds VAT from the tax code.

**Failure behaviour.** A failed push never fails the commit. The failure is recorded with its error, surfaced on the invoice and the integration card, and retried two ways: the per-invoice Retry action, and a sweep in the existing hourly cron that re-attempts failed pushes and back-fills invoices committed while disconnected or half-set-up. The pushes table is checked before every attempt.

**Token refresh.** Inside the adapter call: expired access token (Xero ~30 min, QBO ~60 min lifetimes) → refresh, persist new tokens, then push. Refresh failure (venue revoked access provider-side) → flag the connection with the error; the push lands in the retry queue.

## Connect experience and UI

- The integrations settings page (`src/app/trade/pouriq/settings/integrations/page.tsx`) gets an "Accounting" group below the POS providers: Xero and QuickBooks cards reusing the `IntegrationCard` look. Cards without configured secrets render disabled.
- **Finish-setup state**: when a connection exists but `default_account_code` is null, the card shows a dropdown of the org's expense accounts (live-fetched) plus a VAT-treatment choice (20% standard pre-selected). Pushing is held until saved — a half-configured connection queues invoices rather than mis-coding them; the hourly sweep pushes the backlog once setup completes. If a Xero login holds several organisations, the same panel asks which org first. QBO sends its realm id in the callback, so no picker.
- **Connected state**: org/company name, chosen account, last push time, most recent error. Disconnect revokes best-effort and deletes the connection; push history stays.
- **Invoice surfaces**: committed-invoice detail gets a status line ("Pushed to Xero" + time / "Push failed" + error + Retry / nothing when no connection). The invoice inbox rows get a small equivalent badge.
- No new pages.

## Environment and secrets

Wrangler secrets, following the POS `ProvidersEnv` registry pattern:
`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_ENV` (`sandbox` | `production`, same idea as `SQUARE_ENV`). Local dev uses `.dev.vars`.

Registered redirect URIs (production + `http://localhost:3000` equivalents in both portals):
- Xero: `https://jerrycanspirits.co.uk/api/pouriq/integrations/accounting/xero/oauth/callback`
- QBO: `https://jerrycanspirits.co.uk/api/pouriq/integrations/accounting/quickbooks/oauth/callback`

Note: the Xero app was registered 2026-07-07 with the callback path `/api/pouriq/integrations/xero/oauth/callback` (no `/accounting/`). Add the `/accounting/` variant in the Xero portal (it allows multiple redirects) so the registered URI matches the route namespace above.

Xero scopes: `openid profile email accounting.transactions accounting.settings.read offline_access`. QBO scope: `com.intuit.quickbooks.accounting`. Intuit App ID: befbd9c5-bf4e-45b4-8fc7-cfc262d82e74.

## Testing

- **Unit (vitest)**: bill-builder (applied lines only, net amounts, null quantities), both provider mappers (date/reference field quirks), token-expiry check.
- **Mocked-fetch adapter tests** covering: expired token → refresh then retry; revoked refresh token → connection flagged; provider 4xx → failed push recorded without throwing into commit.
- No live API calls in CI. Run `tsc --noEmit` + `eslint src tests` before pushing (test files added; CI-gates lesson).
- **Manual E2E per provider**: connect (Xero Demo Company / Intuit sandbox company), finish setup, commit a scanned invoice, verify the draft bill (supplier, reference, date, net amounts, VAT treatment). Failure drill: revoke app access provider-side, commit an invoice, confirm it records as failed and the retry sweep recovers it after reconnecting.

## Go-live sequence

1. PR merges → apply the D1 migration to prod (`wrangler d1 migrations apply --remote` — Dan runs it; remind on merge).
2. Set the four secrets + `QUICKBOOKS_ENV`. Xero lights up immediately (uncertified Xero apps connect real orgs; free tier covers 5 connections — see the Xero API pricing captured 2026-07-07 in project memory, a COGS input at 6+ venues).
3. QBO stays sandbox/dark until Intuit production review passes, then it is a secret swap — no deploy.
4. Help-guide section "Connect your accounting software" drafted in the same session as the build.

## Out of scope (v1)

- Sales/revenue journals.
- PDF attachment to the bill (candidate v1.1 — the PDF already sits in R2).
- Per-category account mapping (schema-ready, separate table later).
- Push-status webhooks/polling from the providers.
- Price-changes email digest (separate backlog item, unrelated to this build).
