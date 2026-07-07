# Pour IQ Accounting Integrations (Xero + QuickBooks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a venue commits a scanned supplier invoice, Pour IQ pushes it to their connected Xero or QuickBooks Online account as a draft purchase bill, automatically, with failed pushes queued and retryable.

**Architecture:** A new `src/lib/pouriq/accounting/` module mirrors the POS adapter pattern (`src/lib/pouriq/pos/`): a provider-neutral `AccountingAdapter` interface, per-provider implementations registered by env-var presence, D1-backed connections and push records, OAuth routes under `/api/pouriq/integrations/accounting/[provider]/`, and a best-effort push hook at the end of invoice commit plus an hourly retry sweep. POS code is not modified (except one shared-table reuse noted below).

**Tech Stack:** Next.js 15 App Router (nodejs runtime routes), Cloudflare D1, vitest, Xero Accounting API (ACCPAY invoices), QuickBooks Online v3 API (Bill entity).

**Spec:** `docs/superpowers/specs/2026-07-07-pouriq-accounting-integrations-design.md` — read it first, especially the "Commitments made in the Intuit production questionnaire" section, which is binding.

## Global Constraints

- Branch: `feat/pouriq-accounting-integrations` (already created; spec committed on it).
- TypeScript throughout; no `any` (use `unknown` with a cast when unavoidable).
- All API routes: `export const runtime = 'nodejs'`.
- Money is integer pence (`_p` suffix) internally; provider APIs take pounds with 2 dp via `poundsFromPence`.
- No em-dashes, no emojis, no exclamation marks in any UI copy.
- Xero scopes exactly: `openid profile email accounting.transactions accounting.settings.read offline_access`. QBO scope exactly: `com.intuit.quickbooks.accounting`.
- QBO OAuth endpoints MUST come from Intuit's discovery document, never hardcoded (questionnaire commitment).
- QBO error handling MUST capture the `intuit_tid` response header into the error message (questionnaire commitment).
- Auth failures are never auto-retried in a loop; token refresh happens only when the token is expired or near expiry, immediately before an API call (questionnaire commitment).
- Bills are created as drafts: Xero `Status: 'DRAFT'`, QBO bills are unapproved by nature.
- A failed push must NEVER fail or 500 the invoice commit.
- Before pushing the branch: `npx tsc --noEmit` and `npx eslint src tests` must pass (test files are added; `next build` alone misses them), then `npx vitest run`, then `npx opennextjs-cloudflare build` (the deploy gate).
- Commit after every task with the message given in the task.

---

### Task 1: Migration 0065 + env typing

**Files:**
- Create: `migrations/0065_accounting_connections.sql`
- Modify: `cloudflare-env.d.ts` (after the SumUp block, ~line 57)

**Interfaces:**
- Consumes: nothing.
- Produces: tables `pouriq_accounting_connections`, `pouriq_accounting_pushes`; column `pouriq_invoices.prices_include_vat`; env vars `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_ENV` typed on `CloudflareEnv`.

Design notes locked in here:
- Push idempotency is keyed `UNIQUE(invoice_id, provider)` NOT `(invoice_id, connection_id)`: an invoice pushed to Xero once must never push again even after a disconnect/reconnect cycle creates a new connection row.
- `connection_id` on pushes is nullable with `ON DELETE SET NULL` so push history survives disconnect (spec: "push history stays").
- `external_account_id` defaults to `''`: a Xero login with multiple organisations stores `''` until the venue picks one in the finish-setup panel.
- `prices_include_vat` on invoices records the commit-time VAT basis so the retry sweep (which runs later, from DB only) can set the provider's inclusive/exclusive flag correctly.

- [ ] **Step 1: Write the migration**

```sql
-- Accounting integrations (Xero + QuickBooks Online).
-- pouriq_accounting_connections mirrors pouriq_pos_connections (0023):
-- one row per venue+provider, tokens in D1 (encrypted at rest).
-- pouriq_accounting_pushes is both the idempotency guard (an invoice can
-- never reach the same provider twice, even across reconnects) and the
-- retry queue (failed rows are re-attempted by the hourly sweep).

CREATE TABLE pouriq_accounting_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL REFERENCES trade_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('xero', 'quickbooks')),
  external_account_id TEXT NOT NULL DEFAULT '',
  external_account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TEXT,
  default_account_code TEXT,
  default_tax_code TEXT,
  last_push_at TEXT,
  last_push_error TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(trade_account_id, provider)
);

CREATE TABLE pouriq_accounting_pushes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL REFERENCES pouriq_invoices(id) ON DELETE CASCADE,
  connection_id TEXT REFERENCES pouriq_accounting_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('xero', 'quickbooks')),
  status TEXT NOT NULL CHECK (status IN ('pushed', 'failed')),
  external_bill_id TEXT,
  error TEXT,
  pushed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(invoice_id, provider)
);

CREATE INDEX idx_pouriq_accounting_pushes_invoice ON pouriq_accounting_pushes(invoice_id);

-- Commit-time VAT basis, needed by the retry sweep to build the bill with
-- the right inclusive/exclusive tax flag. NULL for pre-existing invoices
-- (treated as exclusive, matching how their totals were summed).
ALTER TABLE pouriq_invoices ADD COLUMN prices_include_vat INTEGER;
```

- [ ] **Step 2: Apply locally and verify**

Run: `npx wrangler d1 migrations apply jerry-can-spirits-db --local`
Expected: `0065_accounting_connections.sql` applied without error.

- [ ] **Step 3: Add env typing**

In `cloudflare-env.d.ts`, insert after the SumUp secrets block (after line `SUMUP_CLIENT_SECRET: string;`):

```typescript
  // Secrets — Accounting integrations (Xero + QuickBooks Online)
  XERO_CLIENT_ID: string;
  XERO_CLIENT_SECRET: string;
  QUICKBOOKS_CLIENT_ID: string;
  QUICKBOOKS_CLIENT_SECRET: string;
  QUICKBOOKS_ENV?: string;  // 'production' to target live QBO; anything else = sandbox
```

- [ ] **Step 4: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add migrations/0065_accounting_connections.sql cloudflare-env.d.ts
git commit -m "feat(pouriq): accounting connections + pushes schema (migration 0065)"
```

---

### Task 2: Accounting types + bill builder (TDD)

**Files:**
- Create: `src/lib/pouriq/accounting/types.ts`
- Create: `src/lib/pouriq/accounting/bill-builder.ts`
- Test: `tests/unit/lib/pouriq-accounting-bill.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later task):
  - `AccountingProvider = 'xero' | 'quickbooks'`, `isKnownAccountingProvider(p: string): p is AccountingProvider`
  - `AccountingConnection` (row shape), `AccountingTokenSet`, `AccountingExchangeResult`, `AccountingAccountOption`, `AccountingTaxOption`, `NeutralBill`, `NeutralBillLine`, `AccountingAdapter`
  - `buildBill(invoice: BillInvoiceHeader, lines: BillInvoiceLine[]): NeutralBill | null`
  - `needsTokenRefresh(tokenExpiresAt: string | null, nowMs: number): boolean`
  - `poundsFromPence(p: number): number`

- [ ] **Step 1: Write `types.ts`** (types only, no logic beyond the guard)

```typescript
// Shared types for accounting integrations (Xero + QuickBooks Online).
// Mirrors the POS adapter pattern but push-only: no webhooks, no sync loop.

export type AccountingProvider = 'xero' | 'quickbooks'

const KNOWN_PROVIDERS: readonly AccountingProvider[] = ['xero', 'quickbooks']

export function isKnownAccountingProvider(p: string): p is AccountingProvider {
  return (KNOWN_PROVIDERS as readonly string[]).includes(p)
}

export interface AccountingConnection {
  id: string
  trade_account_id: string
  provider: AccountingProvider
  external_account_id: string
  external_account_name: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  default_account_code: string | null
  default_tax_code: string | null
  last_push_at: string | null
  last_push_error: string | null
  enabled: number
  created_at: string
  updated_at: string
}

export interface AccountingTokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: string | null
}

export interface AccountingExchangeResult extends AccountingTokenSet {
  /** Xero tenantId / QBO realmId. '' when a Xero login holds several orgs
   *  and the venue must pick one in the finish-setup panel. */
  externalAccountId: string
  externalAccountName: string | null
  /** Xero only: all orgs on the login when there is more than one. */
  tenantCandidates: Array<{ id: string; name: string }> | null
}

export interface AccountingAccountOption { code: string; name: string }
export interface AccountingTaxOption { code: string; name: string }

export interface NeutralBillLine {
  description: string
  quantity: number
  unitAmountP: number
  lineTotalP: number | null
}

export interface NeutralBill {
  supplierName: string
  reference: string | null
  dateISO: string // YYYY-MM-DD
  amountsIncludeTax: boolean
  lines: NeutralBillLine[]
}

// Push-only adapter. No webhook methods by design.
export interface AccountingAdapter {
  provider: AccountingProvider
  /** realmId is the QBO callback query param; Xero ignores it. */
  exchangeCodeForToken(code: string, redirectUri: string, realmId: string | null): Promise<AccountingExchangeResult>
  refreshAccessToken(refreshToken: string): Promise<AccountingTokenSet>
  /** Xero org list for the finish-setup picker; QBO returns []. */
  listTenants(accessToken: string): Promise<Array<{ id: string; name: string }>>
  listExpenseAccounts(connection: AccountingConnection): Promise<AccountingAccountOption[]>
  listTaxOptions(connection: AccountingConnection): Promise<AccountingTaxOption[]>
  pushBill(connection: AccountingConnection, bill: NeutralBill): Promise<{ externalBillId: string }>
  /** Best-effort on disconnect. */
  revokeToken(connection: AccountingConnection): Promise<void>
}
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/lib/pouriq-accounting-bill.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildBill, needsTokenRefresh, poundsFromPence } from '@/lib/pouriq/accounting/bill-builder'

const header = {
  supplier_name: 'Matthew Clark',
  invoice_number: 'INV-4471',
  invoice_date: '2026-07-01',
  created_at: '2026-07-02 09:15:00',
  prices_include_vat: 0,
}

const appliedLine = {
  extracted_name: 'Expedition Spiced Rum 70cl',
  extracted_quantity: 6,
  extracted_unit_price_p: 2250,
  extracted_line_total_p: 13500,
  applied: 1,
}

describe('buildBill', () => {
  it('builds a bill from applied lines only', () => {
    const bill = buildBill(header, [appliedLine, { ...appliedLine, extracted_name: 'Skipped', applied: 0 }])
    expect(bill).not.toBeNull()
    expect(bill!.supplierName).toBe('Matthew Clark')
    expect(bill!.reference).toBe('INV-4471')
    expect(bill!.dateISO).toBe('2026-07-01')
    expect(bill!.amountsIncludeTax).toBe(false)
    expect(bill!.lines).toHaveLength(1)
    expect(bill!.lines[0]).toEqual({
      description: 'Expedition Spiced Rum 70cl',
      quantity: 6,
      unitAmountP: 2250,
      lineTotalP: 13500,
    })
  })

  it('returns null when no lines were applied', () => {
    expect(buildBill(header, [{ ...appliedLine, applied: 0 }])).toBeNull()
  })

  it('defaults missing quantity to 1 and keeps null line totals', () => {
    const bill = buildBill(header, [{ ...appliedLine, extracted_quantity: null, extracted_line_total_p: null }])
    expect(bill!.lines[0].quantity).toBe(1)
    expect(bill!.lines[0].lineTotalP).toBeNull()
  })

  it('falls back to the commit date when the invoice date is missing', () => {
    const bill = buildBill({ ...header, invoice_date: null }, [appliedLine])
    expect(bill!.dateISO).toBe('2026-07-02')
  })

  it('substitutes a placeholder supplier when the name is missing', () => {
    const bill = buildBill({ ...header, supplier_name: null }, [appliedLine])
    expect(bill!.supplierName).toBe('Unknown supplier')
  })

  it('flags inclusive amounts when the invoice was committed inc VAT', () => {
    const bill = buildBill({ ...header, prices_include_vat: 1 }, [appliedLine])
    expect(bill!.amountsIncludeTax).toBe(true)
  })

  it('treats a NULL vat basis (pre-migration invoices) as exclusive', () => {
    const bill = buildBill({ ...header, prices_include_vat: null }, [appliedLine])
    expect(bill!.amountsIncludeTax).toBe(false)
  })
})

describe('needsTokenRefresh', () => {
  const now = Date.parse('2026-07-07T12:00:00Z')
  it('refreshes when expiry is null', () => {
    expect(needsTokenRefresh(null, now)).toBe(true)
  })
  it('refreshes when expiry is unparseable', () => {
    expect(needsTokenRefresh('not-a-date', now)).toBe(true)
  })
  it('refreshes when already expired', () => {
    expect(needsTokenRefresh('2026-07-07T11:00:00Z', now)).toBe(true)
  })
  it('refreshes inside the 2 minute skew window', () => {
    expect(needsTokenRefresh('2026-07-07T12:01:00Z', now)).toBe(true)
  })
  it('does not refresh a healthy token', () => {
    expect(needsTokenRefresh('2026-07-07T13:00:00Z', now)).toBe(false)
  })
})

describe('poundsFromPence', () => {
  it('converts pence to pounds', () => {
    expect(poundsFromPence(2250)).toBe(22.5)
    expect(poundsFromPence(1)).toBe(0.01)
    expect(poundsFromPence(0)).toBe(0)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/lib/pouriq-accounting-bill.test.ts`
Expected: FAIL (cannot resolve `@/lib/pouriq/accounting/bill-builder`).

- [ ] **Step 4: Write `bill-builder.ts`**

```typescript
// Pure helpers: committed invoice rows -> provider-neutral bill, plus the
// token-expiry decision. Kept free of D1/fetch so they unit-test directly.

import type { NeutralBill } from './types'

export interface BillInvoiceHeader {
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  created_at: string
  prices_include_vat: number | null
}

export interface BillInvoiceLine {
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  applied: number
}

export function buildBill(invoice: BillInvoiceHeader, lines: BillInvoiceLine[]): NeutralBill | null {
  const applied = lines.filter((l) => l.applied === 1)
  if (applied.length === 0) return null
  return {
    supplierName: invoice.supplier_name?.trim() || 'Unknown supplier',
    reference: invoice.invoice_number,
    dateISO: (invoice.invoice_date?.trim() || invoice.created_at).slice(0, 10),
    amountsIncludeTax: invoice.prices_include_vat === 1,
    lines: applied.map((l) => ({
      description: l.extracted_name,
      quantity: l.extracted_quantity ?? 1,
      unitAmountP: l.extracted_unit_price_p,
      lineTotalP: l.extracted_line_total_p,
    })),
  }
}

// Refresh this close to expiry. Xero access tokens live ~30 minutes and
// QBO ~60; a 2 minute skew absorbs clock drift without refresh churn.
const TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000

export function needsTokenRefresh(tokenExpiresAt: string | null, nowMs: number): boolean {
  if (!tokenExpiresAt) return true
  const expiresMs = new Date(tokenExpiresAt).getTime()
  if (!Number.isFinite(expiresMs)) return true
  return expiresMs - nowMs < TOKEN_REFRESH_SKEW_MS
}

export function poundsFromPence(p: number): number {
  return Math.round(p) / 100
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/lib/pouriq-accounting-bill.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/pouriq/accounting/types.ts src/lib/pouriq/accounting/bill-builder.ts tests/unit/lib/pouriq-accounting-bill.test.ts
git commit -m "feat(pouriq): accounting adapter types + neutral bill builder"
```

---

### Task 3: Connections + pushes data layer

**Files:**
- Create: `src/lib/pouriq/accounting/connections.ts`
- Create: `src/lib/pouriq/accounting/pushes.ts`

**Interfaces:**
- Consumes: `AccountingConnection`, `AccountingProvider`, `AccountingTokenSet` from Task 2.
- Produces:
  - `upsertAccountingConnection(db, data: NewAccountingConnection): Promise<string>`
  - `getAccountingConnection(db, tradeAccountId, provider): Promise<AccountingConnection | null>`
  - `listAccountingConnections(db, tradeAccountId): Promise<AccountingConnection[]>`
  - `deleteAccountingConnection(db, tradeAccountId, provider): Promise<void>`
  - `updateAccountingTokens(db, connectionId, tokens: AccountingTokenSet): Promise<void>`
  - `saveAccountingSetup(db, tradeAccountId, provider, setup): Promise<void>`
  - `markAccountingPushSuccess(db, connectionId)`, `markAccountingPushError(db, connectionId, error)`
  - `isConnectionReady(conn: AccountingConnection): boolean`
  - `createAccountingOAuthState(db, tradeAccountId, provider): Promise<string>`, `consumeAccountingOAuthState(db, state): Promise<{ trade_account_id, provider } | null>`
  - `recordPushResult(db, result: PushResult): Promise<void>` (upsert on `(invoice_id, provider)`)
  - `getPushForInvoiceProvider(db, invoiceId, provider): Promise<AccountingPushRow | null>`
  - `getPushMapForInvoices(db, invoiceIds: string[]): Promise<Map<string, AccountingPushRow>>`
  - `AccountingPushRow` type

Follows `src/lib/pouriq/pos/connections.ts` verbatim in style. The OAuth state helpers reuse the existing `pouriq_pos_oauth_states` table (provider column is plain TEXT, verified; no POS code is touched).

- [ ] **Step 1: Write `connections.ts`**

```typescript
import type { AccountingConnection, AccountingProvider, AccountingTokenSet } from './types'

export interface NewAccountingConnection {
  trade_account_id: string
  provider: AccountingProvider
  external_account_id: string
  external_account_name: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
}

export async function upsertAccountingConnection(
  db: D1Database,
  data: NewAccountingConnection,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_accounting_connections
        (trade_account_id, provider, external_account_id, external_account_name,
         access_token, refresh_token, token_expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      ON CONFLICT(trade_account_id, provider) DO UPDATE SET
        external_account_id = excluded.external_account_id,
        external_account_name = excluded.external_account_name,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        last_push_error = NULL,
        enabled = 1,
        updated_at = datetime('now')
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.provider, data.external_account_id, data.external_account_name,
      data.access_token, data.refresh_token, data.token_expires_at,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Accounting connection upsert returned no id')
  return result.id
}

export async function getAccountingConnection(
  db: D1Database,
  tradeAccountId: string,
  provider: AccountingProvider,
): Promise<AccountingConnection | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_accounting_connections WHERE trade_account_id = ?1 AND provider = ?2`)
    .bind(tradeAccountId, provider)
    .first<AccountingConnection>()
}

export async function listAccountingConnections(
  db: D1Database,
  tradeAccountId: string,
): Promise<AccountingConnection[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_accounting_connections WHERE trade_account_id = ?1`)
    .bind(tradeAccountId)
    .all<AccountingConnection>()
  return result.results ?? []
}

export async function deleteAccountingConnection(
  db: D1Database,
  tradeAccountId: string,
  provider: AccountingProvider,
): Promise<void> {
  await db
    .prepare(`DELETE FROM pouriq_accounting_connections WHERE trade_account_id = ?1 AND provider = ?2`)
    .bind(tradeAccountId, provider)
    .run()
}

export async function updateAccountingTokens(
  db: D1Database,
  connectionId: string,
  tokens: AccountingTokenSet,
): Promise<void> {
  await db
    .prepare(`
      UPDATE pouriq_accounting_connections
      SET access_token = ?1,
          refresh_token = COALESCE(?2, refresh_token),
          token_expires_at = ?3,
          updated_at = datetime('now')
      WHERE id = ?4
    `)
    .bind(tokens.accessToken, tokens.refreshToken, tokens.expiresAt, connectionId)
    .run()
}

export interface AccountingSetup {
  external_account_id?: string
  external_account_name?: string | null
  default_account_code: string
  default_tax_code: string
}

export async function saveAccountingSetup(
  db: D1Database,
  tradeAccountId: string,
  provider: AccountingProvider,
  setup: AccountingSetup,
): Promise<void> {
  await db
    .prepare(`
      UPDATE pouriq_accounting_connections
      SET external_account_id = COALESCE(?1, external_account_id),
          external_account_name = COALESCE(?2, external_account_name),
          default_account_code = ?3,
          default_tax_code = ?4,
          updated_at = datetime('now')
      WHERE trade_account_id = ?5 AND provider = ?6
    `)
    .bind(
      setup.external_account_id ?? null, setup.external_account_name ?? null,
      setup.default_account_code, setup.default_tax_code,
      tradeAccountId, provider,
    )
    .run()
}

export async function markAccountingPushSuccess(db: D1Database, connectionId: string): Promise<void> {
  await db
    .prepare(`UPDATE pouriq_accounting_connections SET last_push_at = datetime('now'), last_push_error = NULL WHERE id = ?1`)
    .bind(connectionId)
    .run()
}

export async function markAccountingPushError(db: D1Database, connectionId: string, error: string): Promise<void> {
  await db
    .prepare(`UPDATE pouriq_accounting_connections SET last_push_error = ?1 WHERE id = ?2`)
    .bind(error.slice(0, 500), connectionId)
    .run()
}

/** Fully set up and enabled: pushing is held until this is true, so a
 *  half-configured connection queues invoices rather than mis-coding them. */
export function isConnectionReady(conn: AccountingConnection): boolean {
  return conn.enabled === 1
    && conn.external_account_id !== ''
    && conn.default_account_code !== null
    && conn.default_tax_code !== null
}

// OAuth state nonces reuse pouriq_pos_oauth_states: it is provider-agnostic
// CSRF plumbing (state PK, plain-TEXT provider, 10 minute TTL).

export async function createAccountingOAuthState(
  db: D1Database,
  tradeAccountId: string,
  provider: AccountingProvider,
): Promise<string> {
  const state = crypto.randomUUID()
  await db
    .prepare(`INSERT INTO pouriq_pos_oauth_states (state, trade_account_id, provider) VALUES (?1, ?2, ?3)`)
    .bind(state, tradeAccountId, provider)
    .run()
  return state
}

export async function consumeAccountingOAuthState(
  db: D1Database,
  state: string,
): Promise<{ trade_account_id: string; provider: string } | null> {
  const row = await db
    .prepare(`SELECT trade_account_id, provider FROM pouriq_pos_oauth_states WHERE state = ?1 AND datetime(created_at) > datetime('now', '-10 minutes')`)
    .bind(state)
    .first<{ trade_account_id: string; provider: string }>()
  if (row) {
    await db.prepare(`DELETE FROM pouriq_pos_oauth_states WHERE state = ?1`).bind(state).run()
  }
  return row
}
```

- [ ] **Step 2: Write `pushes.ts`**

```typescript
import type { AccountingProvider } from './types'

export interface AccountingPushRow {
  id: string
  invoice_id: string
  connection_id: string | null
  provider: AccountingProvider
  status: 'pushed' | 'failed'
  external_bill_id: string | null
  error: string | null
  pushed_at: string
}

export interface PushResult {
  invoiceId: string
  connectionId: string
  provider: AccountingProvider
  status: 'pushed' | 'failed'
  externalBillId: string | null
  error: string | null
}

/** Upsert on (invoice_id, provider): a retry overwrites the failed row in
 *  place; a pushed row is never downgraded (callers check before pushing). */
export async function recordPushResult(db: D1Database, result: PushResult): Promise<void> {
  await db
    .prepare(`
      INSERT INTO pouriq_accounting_pushes
        (invoice_id, connection_id, provider, status, external_bill_id, error)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ON CONFLICT(invoice_id, provider) DO UPDATE SET
        connection_id = excluded.connection_id,
        status = excluded.status,
        external_bill_id = excluded.external_bill_id,
        error = excluded.error,
        pushed_at = datetime('now')
    `)
    .bind(
      result.invoiceId, result.connectionId, result.provider,
      result.status, result.externalBillId, result.error ? result.error.slice(0, 500) : null,
    )
    .run()
}

export async function getPushForInvoiceProvider(
  db: D1Database,
  invoiceId: string,
  provider: AccountingProvider,
): Promise<AccountingPushRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_accounting_pushes WHERE invoice_id = ?1 AND provider = ?2`)
    .bind(invoiceId, provider)
    .first<AccountingPushRow>()
}

/** Latest push per invoice for list badges. Keyed by invoice_id. */
export async function getPushMapForInvoices(
  db: D1Database,
  invoiceIds: string[],
): Promise<Map<string, AccountingPushRow>> {
  if (invoiceIds.length === 0) return new Map()
  const placeholders = invoiceIds.map((_, i) => `?${i + 1}`).join(', ')
  const result = await db
    .prepare(`SELECT * FROM pouriq_accounting_pushes WHERE invoice_id IN (${placeholders})`)
    .bind(...invoiceIds)
    .all<AccountingPushRow>()
  return new Map((result.results ?? []).map((r) => [r.invoice_id, r]))
}
```

- [ ] **Step 3: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/lib/pouriq/accounting/connections.ts src/lib/pouriq/accounting/pushes.ts
git commit -m "feat(pouriq): accounting connections + pushes data layer"
```

---

### Task 4: Xero adapter + provider registry (TDD)

**Files:**
- Create: `src/lib/pouriq/accounting/providers/xero.ts`
- Create: `src/lib/pouriq/accounting/providers/index.ts`
- Test: `tests/unit/lib/pouriq-accounting-xero.test.ts`

**Interfaces:**
- Consumes: types from Task 2.
- Produces:
  - `createXeroAdapter(env: XeroEnv): AccountingAdapter` where `XeroEnv = { XERO_CLIENT_ID: string; XERO_CLIENT_SECRET: string }`
  - `XERO_SCOPES` constant
  - `AccountingProvidersEnv` (all-optional: `XERO_CLIENT_ID?`, `XERO_CLIENT_SECRET?`, `QUICKBOOKS_CLIENT_ID?`, `QUICKBOOKS_CLIENT_SECRET?`, `QUICKBOOKS_ENV?`)
  - `getAccountingAdapter(provider: AccountingProvider, env: AccountingProvidersEnv): AccountingAdapter | null`
  - `getAccountingAuthorizeUrl(provider, env, state, redirectUri): Promise<string | null>` (async because QBO uses discovery; Task 5 fills the QBO branch, this task returns null for it)

Xero API facts used below:
- Authorize: `https://login.xero.com/identity/connect/authorize` (`response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`).
- Token: POST `https://identity.xero.com/connect/token`, `Authorization: Basic base64(clientId:clientSecret)`, form body.
- Org list: GET `https://api.xero.com/connections` with Bearer token → `[{ tenantId, tenantName }]`.
- All accounting calls need header `Xero-Tenant-Id: <tenantId>` plus `Accept: application/json`.
- Accounts: GET `https://api.xero.com/api.xro/2.0/Accounts` → filter client-side to `Status === 'ACTIVE'` and `Type` in `EXPENSE | DIRECTCOSTS | OVERHEADS` (DIRECTCOSTS is the likely venue pick, e.g. Cost of Sales).
- Tax rates: GET `https://api.xero.com/api.xro/2.0/TaxRates` → filter to `Status === 'ACTIVE'` and `CanApplyToExpenses === true`; option code is `TaxType` (e.g. `INPUT2` = UK 20% on expenses).
- Draft bill: POST `https://api.xero.com/api.xro/2.0/Invoices` with `Type: 'ACCPAY'`, `Status: 'DRAFT'`, `Contact: { Name }` (auto-creates the contact), `LineAmountTypes: 'Exclusive' | 'Inclusive'`.
- Revoke: POST `https://identity.xero.com/connect/revocation`, Basic auth, form `token=<refresh_token>`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/lib/pouriq-accounting-xero.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createXeroAdapter } from '@/lib/pouriq/accounting/providers/xero'
import type { AccountingConnection, NeutralBill } from '@/lib/pouriq/accounting/types'

const env = { XERO_CLIENT_ID: 'id', XERO_CLIENT_SECRET: 'secret' }

const connection: AccountingConnection = {
  id: 'c1', trade_account_id: 't1', provider: 'xero',
  external_account_id: 'tenant-1', external_account_name: 'Demo Company (UK)',
  access_token: 'at', refresh_token: 'rt', token_expires_at: '2026-07-07T13:00:00Z',
  default_account_code: '310', default_tax_code: 'INPUT2',
  last_push_at: null, last_push_error: null, enabled: 1,
  created_at: '2026-07-07 10:00:00', updated_at: '2026-07-07 10:00:00',
}

const bill: NeutralBill = {
  supplierName: 'Matthew Clark', reference: 'INV-4471', dateISO: '2026-07-01',
  amountsIncludeTax: false,
  lines: [{ description: 'Rum 70cl', quantity: 6, unitAmountP: 2250, lineTotalP: 13500 }],
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

const fetchMock = vi.fn()

beforeEach(() => { vi.stubGlobal('fetch', fetchMock) })
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset() })

describe('createXeroAdapter', () => {
  it('exchanges a code and resolves a single org directly', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 1800 }))
      .mockResolvedValueOnce(jsonResponse([{ tenantId: 'tenant-1', tenantName: 'Demo Company (UK)' }]))
    const adapter = createXeroAdapter(env)
    const result = await adapter.exchangeCodeForToken('code123', 'https://x/callback', null)
    expect(result.externalAccountId).toBe('tenant-1')
    expect(result.externalAccountName).toBe('Demo Company (UK)')
    expect(result.tenantCandidates).toBeNull()
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]
    expect(tokenUrl).toBe('https://identity.xero.com/connect/token')
    expect((tokenInit.headers as Record<string, string>).Authorization).toMatch(/^Basic /)
  })

  it('returns empty externalAccountId plus candidates when the login holds several orgs', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'at', refresh_token: 'rt', expires_in: 1800 }))
      .mockResolvedValueOnce(jsonResponse([
        { tenantId: 'tenant-1', tenantName: 'Bar One' },
        { tenantId: 'tenant-2', tenantName: 'Bar Two' },
      ]))
    const adapter = createXeroAdapter(env)
    const result = await adapter.exchangeCodeForToken('code123', 'https://x/callback', null)
    expect(result.externalAccountId).toBe('')
    expect(result.tenantCandidates).toEqual([
      { id: 'tenant-1', name: 'Bar One' },
      { id: 'tenant-2', name: 'Bar Two' },
    ])
  })

  it('pushes a draft ACCPAY invoice with tenant header and exclusive amounts', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Invoices: [{ InvoiceID: 'xero-bill-1' }] }))
    const adapter = createXeroAdapter(env)
    const result = await adapter.pushBill(connection, bill)
    expect(result.externalBillId).toBe('xero-bill-1')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.xero.com/api.xro/2.0/Invoices')
    expect((init.headers as Record<string, string>)['Xero-Tenant-Id']).toBe('tenant-1')
    const payload = JSON.parse(init.body as string)
    const inv = payload.Invoices[0]
    expect(inv.Type).toBe('ACCPAY')
    expect(inv.Status).toBe('DRAFT')
    expect(inv.LineAmountTypes).toBe('Exclusive')
    expect(inv.Contact).toEqual({ Name: 'Matthew Clark' })
    expect(inv.InvoiceNumber).toBe('INV-4471')
    expect(inv.Date).toBe('2026-07-01')
    expect(inv.LineItems[0]).toEqual({
      Description: 'Rum 70cl', Quantity: 6, UnitAmount: 22.5, LineAmount: 135,
      AccountCode: '310', TaxType: 'INPUT2',
    })
  })

  it('marks inclusive bills as Inclusive', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Invoices: [{ InvoiceID: 'x' }] }))
    const adapter = createXeroAdapter(env)
    await adapter.pushBill(connection, { ...bill, amountsIncludeTax: true })
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(payload.Invoices[0].LineAmountTypes).toBe('Inclusive')
  })

  it('throws with status and body detail on a provider error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"Message":"Validation"}', { status: 400 }))
    const adapter = createXeroAdapter(env)
    await expect(adapter.pushBill(connection, bill)).rejects.toThrow(/Xero 400/)
  })

  it('filters expense accounts to active expense-class types', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ Accounts: [
      { Code: '310', Name: 'Cost of Sales', Type: 'DIRECTCOSTS', Status: 'ACTIVE' },
      { Code: '200', Name: 'Sales', Type: 'REVENUE', Status: 'ACTIVE' },
      { Code: '404', Name: 'Old expenses', Type: 'EXPENSE', Status: 'ARCHIVED' },
    ] }))
    const adapter = createXeroAdapter(env)
    const accounts = await adapter.listExpenseAccounts(connection)
    expect(accounts).toEqual([{ code: '310', name: 'Cost of Sales' }])
  })

  it('filters tax options to active expense-applicable rates', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ TaxRates: [
      { TaxType: 'INPUT2', Name: '20% (VAT on Expenses)', Status: 'ACTIVE', CanApplyToExpenses: true, DisplayTaxRate: 20 },
      { TaxType: 'OUTPUT2', Name: '20% (VAT on Income)', Status: 'ACTIVE', CanApplyToExpenses: false, DisplayTaxRate: 20 },
    ] }))
    const adapter = createXeroAdapter(env)
    const options = await adapter.listTaxOptions(connection)
    expect(options).toEqual([{ code: 'INPUT2', name: '20% (VAT on Expenses)' }])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/lib/pouriq-accounting-xero.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `providers/xero.ts`**

```typescript
import type {
  AccountingAdapter, AccountingConnection, AccountingExchangeResult,
  AccountingTokenSet, NeutralBill,
} from '../types'
import { poundsFromPence } from '../bill-builder'

const TOKEN_URL = 'https://identity.xero.com/connect/token'
const REVOKE_URL = 'https://identity.xero.com/connect/revocation'
const CONNECTIONS_URL = 'https://api.xero.com/connections'
const API_BASE = 'https://api.xero.com/api.xro/2.0'

export const XERO_AUTHORIZE_URL = 'https://login.xero.com/identity/connect/authorize'
export const XERO_SCOPES = 'openid profile email accounting.transactions accounting.settings.read offline_access'

export interface XeroEnv {
  XERO_CLIENT_ID: string
  XERO_CLIENT_SECRET: string
}

const EXPENSE_ACCOUNT_TYPES = ['EXPENSE', 'DIRECTCOSTS', 'OVERHEADS']

function toExpiryIso(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

export function createXeroAdapter(env: XeroEnv): AccountingAdapter {
  const basicAuth = `Basic ${btoa(`${env.XERO_CLIENT_ID}:${env.XERO_CLIENT_SECRET}`)}`

  async function tokenRequest(body: URLSearchParams): Promise<AccountingTokenSet> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: basicAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) throw new Error(`Xero ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: toExpiryIso(data.expires_in),
    }
  }

  async function apiRequest<T>(connection: AccountingConnection, path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Xero-Tenant-Id': connection.external_account_id,
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
    if (!res.ok) throw new Error(`Xero ${res.status}: ${(await res.text()).slice(0, 300)}`)
    return await res.json() as T
  }

  async function listTenants(accessToken: string): Promise<Array<{ id: string; name: string }>> {
    const res = await fetch(CONNECTIONS_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Xero ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const tenants = await res.json() as Array<{ tenantId: string; tenantName?: string }>
    return tenants.map((t) => ({ id: t.tenantId, name: t.tenantName ?? 'Unnamed organisation' }))
  }

  return {
    provider: 'xero',

    async exchangeCodeForToken(code, redirectUri): Promise<AccountingExchangeResult> {
      const tokens = await tokenRequest(new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }))
      const tenants = await listTenants(tokens.accessToken)
      if (tenants.length === 0) throw new Error('Xero returned no connected organisations')
      if (tenants.length === 1) {
        return {
          ...tokens,
          externalAccountId: tenants[0].id,
          externalAccountName: tenants[0].name,
          tenantCandidates: null,
        }
      }
      // Several orgs on this login: the finish-setup panel asks which.
      return { ...tokens, externalAccountId: '', externalAccountName: null, tenantCandidates: tenants }
    },

    async refreshAccessToken(refreshToken) {
      return await tokenRequest(new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }))
    },

    listTenants,

    async listExpenseAccounts(connection) {
      const data = await apiRequest<{ Accounts?: Array<{ Code?: string; Name?: string; Type?: string; Status?: string }> }>(
        connection, '/Accounts',
      )
      return (data.Accounts ?? [])
        .filter((a) => a.Status === 'ACTIVE' && a.Code && a.Name && EXPENSE_ACCOUNT_TYPES.includes(a.Type ?? ''))
        .map((a) => ({ code: a.Code as string, name: a.Name as string }))
    },

    async listTaxOptions(connection) {
      const data = await apiRequest<{ TaxRates?: Array<{ TaxType?: string; Name?: string; Status?: string; CanApplyToExpenses?: boolean }> }>(
        connection, '/TaxRates',
      )
      return (data.TaxRates ?? [])
        .filter((r) => r.Status === 'ACTIVE' && r.CanApplyToExpenses === true && r.TaxType && r.Name)
        .map((r) => ({ code: r.TaxType as string, name: r.Name as string }))
    },

    async pushBill(connection, bill: NeutralBill) {
      const payload = {
        Invoices: [{
          Type: 'ACCPAY',
          Status: 'DRAFT',
          Contact: { Name: bill.supplierName },
          Date: bill.dateISO,
          ...(bill.reference ? { InvoiceNumber: bill.reference } : {}),
          LineAmountTypes: bill.amountsIncludeTax ? 'Inclusive' : 'Exclusive',
          LineItems: bill.lines.map((l) => ({
            Description: l.description,
            Quantity: l.quantity,
            UnitAmount: poundsFromPence(l.unitAmountP),
            ...(l.lineTotalP !== null ? { LineAmount: poundsFromPence(l.lineTotalP) } : {}),
            AccountCode: connection.default_account_code,
            TaxType: connection.default_tax_code,
          })),
        }],
      }
      const data = await apiRequest<{ Invoices?: Array<{ InvoiceID?: string }> }>(
        connection, '/Invoices', { method: 'POST', body: JSON.stringify(payload) },
      )
      const externalBillId = data.Invoices?.[0]?.InvoiceID
      if (!externalBillId) throw new Error('Xero response contained no InvoiceID')
      return { externalBillId }
    },

    async revokeToken(connection) {
      if (!connection.refresh_token) return
      await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { Authorization: basicAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: connection.refresh_token }),
      })
    },
  }
}
```

- [ ] **Step 4: Write `providers/index.ts`** (registry; QBO branch lands in Task 5)

```typescript
import { createXeroAdapter, XERO_AUTHORIZE_URL, XERO_SCOPES } from './xero'
import type { AccountingAdapter, AccountingProvider } from '../types'

/** Env slice the registry needs. All optional: adapters are unavailable
 *  (null) when their vars are missing, and the UI card renders disabled. */
export interface AccountingProvidersEnv {
  XERO_CLIENT_ID?: string
  XERO_CLIENT_SECRET?: string
  QUICKBOOKS_CLIENT_ID?: string
  QUICKBOOKS_CLIENT_SECRET?: string
  QUICKBOOKS_ENV?: string
}

export function getAccountingAdapter(provider: AccountingProvider, env: AccountingProvidersEnv): AccountingAdapter | null {
  switch (provider) {
    case 'xero':
      if (!env.XERO_CLIENT_ID || !env.XERO_CLIENT_SECRET) return null
      return createXeroAdapter({ XERO_CLIENT_ID: env.XERO_CLIENT_ID, XERO_CLIENT_SECRET: env.XERO_CLIENT_SECRET })
    case 'quickbooks':
      return null
    default:
      return null
  }
}

/** Async because QuickBooks resolves its authorize endpoint from Intuit's
 *  discovery document (a written Intuit questionnaire commitment). */
export async function getAccountingAuthorizeUrl(
  provider: AccountingProvider,
  env: AccountingProvidersEnv,
  state: string,
  redirectUri: string,
): Promise<string | null> {
  switch (provider) {
    case 'xero': {
      if (!env.XERO_CLIENT_ID) return null
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.XERO_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: XERO_SCOPES,
        state,
      })
      return `${XERO_AUTHORIZE_URL}?${params.toString()}`
    }
    case 'quickbooks':
      return null
    default:
      return null
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/lib/pouriq-accounting-xero.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pouriq/accounting/providers/ tests/unit/lib/pouriq-accounting-xero.test.ts
git commit -m "feat(pouriq): Xero accounting adapter + provider registry"
```

---

### Task 5: QuickBooks adapter (TDD)

**Files:**
- Create: `src/lib/pouriq/accounting/providers/quickbooks.ts`
- Modify: `src/lib/pouriq/accounting/providers/index.ts` (fill both `'quickbooks'` branches)
- Test: `tests/unit/lib/pouriq-accounting-qbo.test.ts`

**Interfaces:**
- Consumes: types from Task 2, registry from Task 4.
- Produces: `createQuickBooksAdapter(env: QuickBooksEnv): AccountingAdapter`, `getQuickBooksDiscovery(env): Promise<{ authorization_endpoint: string; token_endpoint: string }>`, `resetQuickBooksDiscoveryCache()` (test helper).

QBO API facts used below:
- Discovery documents (questionnaire commitment — endpoints come from here):
  production `https://developer.api.intuit.com/.well-known/openid_configuration`,
  sandbox `https://developer.api.intuit.com/.well-known/openid_sandbox_configuration`.
  Select by `env.QUICKBOOKS_ENV === 'production'`. Cache module-level.
- Token requests: `Authorization: Basic base64(clientId:clientSecret)`, form body, `Accept: application/json`.
- API base: production `https://quickbooks.api.intuit.com`, sandbox `https://sandbox-quickbooks.api.intuit.com`.
- The OAuth callback carries `realmId` as a query param; it is the company id for every API path. `exchangeCodeForToken` MUST throw if `realmId` is null.
- Company name (best-effort): GET `{base}/v3/company/{realmId}/companyinfo/{realmId}?minorversion=75` → `CompanyInfo.CompanyName`.
- Query endpoint: GET `{base}/v3/company/{realmId}/query?query=<urlencoded>&minorversion=75`.
- Bills REQUIRE a `VendorRef`: find the vendor by name (`select Id from Vendor where DisplayName = '<escaped>'`, escape `'` as `\'`), create it if absent (POST `{base}/v3/company/{realmId}/vendor` with `{ DisplayName }`).
- Bill create: POST `{base}/v3/company/{realmId}/bill?minorversion=75`. `DocNumber` max length 21 — truncate. `GlobalTaxCalculation: 'TaxInclusive' | 'TaxExcluded'`. Each line: `{ Amount, DetailType: 'AccountBasedExpenseLineDetail', Description, AccountBasedExpenseLineDetail: { AccountRef: { value }, TaxCodeRef: { value } } }`. Line `Amount` = lineTotal, or quantity × unit price when the extraction had no line total.
- Every error MUST include the `intuit_tid` response header (questionnaire commitment).
- Revoke: POST `https://developer.api.intuit.com/v2/oauth2/tokens/revoke`, Basic auth, JSON `{ token: <refresh_token> }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/lib/pouriq-accounting-qbo.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createQuickBooksAdapter, resetQuickBooksDiscoveryCache,
} from '@/lib/pouriq/accounting/providers/quickbooks'
import type { AccountingConnection, NeutralBill } from '@/lib/pouriq/accounting/types'

const env = { QUICKBOOKS_CLIENT_ID: 'id', QUICKBOOKS_CLIENT_SECRET: 'secret', QUICKBOOKS_ENV: 'sandbox' }

const connection: AccountingConnection = {
  id: 'c1', trade_account_id: 't1', provider: 'quickbooks',
  external_account_id: 'realm-9', external_account_name: 'Sandbox Company',
  access_token: 'at', refresh_token: 'rt', token_expires_at: '2026-07-07T13:00:00Z',
  default_account_code: '82', default_tax_code: '3',
  last_push_at: null, last_push_error: null, enabled: 1,
  created_at: '2026-07-07 10:00:00', updated_at: '2026-07-07 10:00:00',
}

const bill: NeutralBill = {
  supplierName: "O'Brien's Wholesale", reference: 'INV-4471-LONG-REFERENCE-X', dateISO: '2026-07-01',
  amountsIncludeTax: false,
  lines: [
    { description: 'Rum 70cl', quantity: 6, unitAmountP: 2250, lineTotalP: 13500 },
    { description: 'Limes', quantity: 3, unitAmountP: 120, lineTotalP: null },
  ],
}

const discovery = {
  authorization_endpoint: 'https://appcenter.intuit.com/connect/oauth2',
  token_endpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

const fetchMock = vi.fn()

beforeEach(() => { vi.stubGlobal('fetch', fetchMock); resetQuickBooksDiscoveryCache() })
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset() })

describe('createQuickBooksAdapter', () => {
  it('fetches the sandbox discovery document and exchanges the code', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(discovery))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ CompanyInfo: { CompanyName: 'Sandbox Company' } }))
    const adapter = createQuickBooksAdapter(env)
    const result = await adapter.exchangeCodeForToken('code123', 'https://x/callback', 'realm-9')
    expect(result.externalAccountId).toBe('realm-9')
    expect(result.externalAccountName).toBe('Sandbox Company')
    expect(fetchMock.mock.calls[0][0]).toBe('https://developer.api.intuit.com/.well-known/openid_sandbox_configuration')
    expect(fetchMock.mock.calls[1][0]).toBe(discovery.token_endpoint)
  })

  it('rejects a callback with no realmId', async () => {
    const adapter = createQuickBooksAdapter(env)
    await expect(adapter.exchangeCodeForToken('code123', 'https://x/callback', null))
      .rejects.toThrow(/realmId/)
  })

  it('reuses an existing vendor and pushes the bill', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ QueryResponse: { Vendor: [{ Id: 'v7' }] } }))
      .mockResolvedValueOnce(jsonResponse({ Bill: { Id: 'qbo-bill-1' } }))
    const adapter = createQuickBooksAdapter(env)
    const result = await adapter.pushBill(connection, bill)
    expect(result.externalBillId).toBe('qbo-bill-1')
    // Vendor lookup escaped the apostrophe in the supplier name.
    expect(String(fetchMock.mock.calls[0][0])).toContain(encodeURIComponent("O\\'Brien\\'s Wholesale"))
    const billCall = fetchMock.mock.calls[1]
    expect(String(billCall[0])).toBe('https://sandbox-quickbooks.api.intuit.com/v3/company/realm-9/bill?minorversion=75')
    const payload = JSON.parse(billCall[1].body as string)
    expect(payload.VendorRef).toEqual({ value: 'v7' })
    expect(payload.TxnDate).toBe('2026-07-01')
    expect(payload.DocNumber).toBe('INV-4471-LONG-REFEREN')  // 21 chars
    expect(payload.GlobalTaxCalculation).toBe('TaxExcluded')
    expect(payload.Line[0].Amount).toBe(135)
    expect(payload.Line[0].AccountBasedExpenseLineDetail).toEqual({
      AccountRef: { value: '82' }, TaxCodeRef: { value: '3' },
    })
    expect(payload.Line[1].Amount).toBe(3.6)  // 3 x 120p, no extracted line total
  })

  it('creates the vendor when none matches', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ QueryResponse: {} }))
      .mockResolvedValueOnce(jsonResponse({ Vendor: { Id: 'v-new' } }))
      .mockResolvedValueOnce(jsonResponse({ Bill: { Id: 'qbo-bill-2' } }))
    const adapter = createQuickBooksAdapter(env)
    await adapter.pushBill(connection, bill)
    const vendorCreate = fetchMock.mock.calls[1]
    expect(String(vendorCreate[0])).toBe('https://sandbox-quickbooks.api.intuit.com/v3/company/realm-9/vendor?minorversion=75')
    expect(JSON.parse(vendorCreate[1].body as string)).toEqual({ DisplayName: "O'Brien's Wholesale" })
    const payload = JSON.parse(fetchMock.mock.calls[2][1].body as string)
    expect(payload.VendorRef).toEqual({ value: 'v-new' })
  })

  it('includes intuit_tid in provider errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"Fault":{}}', { status: 400, headers: { intuit_tid: 'tid-123' } }))
    const adapter = createQuickBooksAdapter(env)
    await expect(adapter.pushBill(connection, bill)).rejects.toThrow(/intuit_tid tid-123/)
  })

  it('lists expense accounts via the query endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ QueryResponse: { Account: [
      { Id: '82', Name: 'Cost of Goods Sold' },
      { Id: '90', Name: 'Rent' },
    ] } }))
    const adapter = createQuickBooksAdapter(env)
    const accounts = await adapter.listExpenseAccounts(connection)
    expect(accounts).toEqual([
      { code: '82', name: 'Cost of Goods Sold' },
      { code: '90', name: 'Rent' },
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/lib/pouriq-accounting-qbo.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `providers/quickbooks.ts`**

```typescript
import type {
  AccountingAdapter, AccountingConnection, AccountingExchangeResult,
  AccountingTokenSet, NeutralBill,
} from '../types'
import { poundsFromPence } from '../bill-builder'

const DISCOVERY_PRODUCTION = 'https://developer.api.intuit.com/.well-known/openid_configuration'
const DISCOVERY_SANDBOX = 'https://developer.api.intuit.com/.well-known/openid_sandbox_configuration'
const REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke'
const MINOR_VERSION = '75'
const DOC_NUMBER_MAX = 21

export interface QuickBooksEnv {
  QUICKBOOKS_CLIENT_ID: string
  QUICKBOOKS_CLIENT_SECRET: string
  QUICKBOOKS_ENV?: string
}

interface Discovery {
  authorization_endpoint: string
  token_endpoint: string
}

// Endpoints come from Intuit's discovery document, never hardcoded
// (a written Intuit production-questionnaire commitment). Cached per isolate.
let discoveryCache: Discovery | null = null

export function resetQuickBooksDiscoveryCache(): void {
  discoveryCache = null
}

export async function getQuickBooksDiscovery(env: Pick<QuickBooksEnv, 'QUICKBOOKS_ENV'>): Promise<Discovery> {
  if (discoveryCache) return discoveryCache
  const url = env.QUICKBOOKS_ENV === 'production' ? DISCOVERY_PRODUCTION : DISCOVERY_SANDBOX
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`QuickBooks discovery ${res.status}`)
  const doc = await res.json() as Discovery
  discoveryCache = doc
  return doc
}

function apiBase(env: Pick<QuickBooksEnv, 'QUICKBOOKS_ENV'>): string {
  return env.QUICKBOOKS_ENV === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com'
}

function toExpiryIso(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

export function createQuickBooksAdapter(env: QuickBooksEnv): AccountingAdapter {
  const basicAuth = `Basic ${btoa(`${env.QUICKBOOKS_CLIENT_ID}:${env.QUICKBOOKS_CLIENT_SECRET}`)}`
  const base = apiBase(env)

  async function qboFetch<T>(url: string, init?: RequestInit, accessToken?: string): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.body && !(init.body instanceof URLSearchParams) ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
    if (!res.ok) {
      const tid = res.headers.get('intuit_tid') ?? 'none'
      throw new Error(`QuickBooks ${res.status} [intuit_tid ${tid}]: ${(await res.text()).slice(0, 300)}`)
    }
    return await res.json() as T
  }

  async function tokenRequest(body: URLSearchParams): Promise<AccountingTokenSet> {
    const discovery = await getQuickBooksDiscovery(env)
    const data = await qboFetch<{ access_token: string; refresh_token?: string; expires_in: number }>(
      discovery.token_endpoint,
      {
        method: 'POST',
        headers: { Authorization: basicAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    )
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: toExpiryIso(data.expires_in),
    }
  }

  async function query<T>(connection: AccountingConnection, q: string): Promise<T> {
    const url = `${base}/v3/company/${connection.external_account_id}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`
    return await qboFetch<T>(url, undefined, connection.access_token)
  }

  async function resolveVendorId(connection: AccountingConnection, name: string): Promise<string> {
    const escaped = name.replace(/'/g, "\\'")
    const found = await query<{ QueryResponse?: { Vendor?: Array<{ Id: string }> } }>(
      connection, `select Id from Vendor where DisplayName = '${escaped}'`,
    )
    const existing = found.QueryResponse?.Vendor?.[0]?.Id
    if (existing) return existing
    const created = await qboFetch<{ Vendor: { Id: string } }>(
      `${base}/v3/company/${connection.external_account_id}/vendor?minorversion=${MINOR_VERSION}`,
      { method: 'POST', body: JSON.stringify({ DisplayName: name }) },
      connection.access_token,
    )
    return created.Vendor.Id
  }

  return {
    provider: 'quickbooks',

    async exchangeCodeForToken(code, redirectUri, realmId): Promise<AccountingExchangeResult> {
      if (!realmId) throw new Error('QuickBooks callback did not include a realmId')
      const tokens = await tokenRequest(new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }))
      // Company name is display sugar; never fail the connection over it.
      let companyName: string | null = null
      try {
        const info = await qboFetch<{ CompanyInfo?: { CompanyName?: string } }>(
          `${base}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=${MINOR_VERSION}`,
          undefined, tokens.accessToken,
        )
        companyName = info.CompanyInfo?.CompanyName ?? null
      } catch { /* best-effort */ }
      return { ...tokens, externalAccountId: realmId, externalAccountName: companyName, tenantCandidates: null }
    },

    async refreshAccessToken(refreshToken) {
      return await tokenRequest(new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }))
    },

    async listTenants() {
      return []
    },

    async listExpenseAccounts(connection) {
      const data = await query<{ QueryResponse?: { Account?: Array<{ Id: string; Name: string }> } }>(
        connection,
        `select Id, Name from Account where AccountType in ('Expense', 'Cost of Goods Sold') and Active = true maxresults 1000`,
      )
      return (data.QueryResponse?.Account ?? []).map((a) => ({ code: a.Id, name: a.Name }))
    },

    async listTaxOptions(connection) {
      const data = await query<{ QueryResponse?: { TaxCode?: Array<{ Id: string; Name: string }> } }>(
        connection, `select Id, Name from TaxCode where Active = true maxresults 1000`,
      )
      return (data.QueryResponse?.TaxCode ?? []).map((t) => ({ code: t.Id, name: t.Name }))
    },

    async pushBill(connection, bill: NeutralBill) {
      const vendorId = await resolveVendorId(connection, bill.supplierName)
      const payload = {
        VendorRef: { value: vendorId },
        TxnDate: bill.dateISO,
        ...(bill.reference ? { DocNumber: bill.reference.slice(0, DOC_NUMBER_MAX) } : {}),
        GlobalTaxCalculation: bill.amountsIncludeTax ? 'TaxInclusive' : 'TaxExcluded',
        Line: bill.lines.map((l) => ({
          Amount: poundsFromPence(l.lineTotalP ?? Math.round(l.unitAmountP * l.quantity)),
          DetailType: 'AccountBasedExpenseLineDetail',
          Description: l.description,
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: connection.default_account_code },
            TaxCodeRef: { value: connection.default_tax_code },
          },
        })),
      }
      const data = await qboFetch<{ Bill?: { Id?: string } }>(
        `${base}/v3/company/${connection.external_account_id}/bill?minorversion=${MINOR_VERSION}`,
        { method: 'POST', body: JSON.stringify(payload) },
        connection.access_token,
      )
      const externalBillId = data.Bill?.Id
      if (!externalBillId) throw new Error('QuickBooks response contained no Bill Id')
      return { externalBillId }
    },

    async revokeToken(connection) {
      const token = connection.refresh_token ?? connection.access_token
      await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { Authorization: basicAuth, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token }),
      })
    },
  }
}
```

- [ ] **Step 4: Fill the QBO branches in `providers/index.ts`**

Replace the two `case 'quickbooks': return null` branches:

```typescript
    case 'quickbooks':
      if (!env.QUICKBOOKS_CLIENT_ID || !env.QUICKBOOKS_CLIENT_SECRET) return null
      return createQuickBooksAdapter({
        QUICKBOOKS_CLIENT_ID: env.QUICKBOOKS_CLIENT_ID,
        QUICKBOOKS_CLIENT_SECRET: env.QUICKBOOKS_CLIENT_SECRET,
        QUICKBOOKS_ENV: env.QUICKBOOKS_ENV,
      })
```

and in `getAccountingAuthorizeUrl`:

```typescript
    case 'quickbooks': {
      if (!env.QUICKBOOKS_CLIENT_ID) return null
      const discovery = await getQuickBooksDiscovery(env)
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.QUICKBOOKS_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'com.intuit.quickbooks.accounting',
        state,
      })
      return `${discovery.authorization_endpoint}?${params.toString()}`
    }
```

with imports at the top:

```typescript
import { createQuickBooksAdapter, getQuickBooksDiscovery } from './quickbooks'
```

- [ ] **Step 5: Run all accounting tests**

Run: `npx vitest run tests/unit/lib/pouriq-accounting-qbo.test.ts tests/unit/lib/pouriq-accounting-xero.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pouriq/accounting/providers/ tests/unit/lib/pouriq-accounting-qbo.test.ts
git commit -m "feat(pouriq): QuickBooks adapter (discovery endpoints, intuit_tid capture)"
```

---

### Task 6: Push orchestration + hourly sweep + cron wiring

**Files:**
- Create: `src/lib/pouriq/accounting/push.ts`
- Modify: `cloudflare-worker-entry.mjs` (import + one `ctx.waitUntil` beside `runHourlyPosBackfill`)

**Interfaces:**
- Consumes: everything from Tasks 2 to 5.
- Produces:
  - `pushInvoiceToAccounting(db: D1Database, env: AccountingProvidersEnv, tradeAccountId: string, invoiceId: string): Promise<void>` — NEVER throws.
  - `runAccountingPushSweep(env: { DB: D1Database } & AccountingProvidersEnv): Promise<void>` — hourly cron entry.

Behaviour locked in:
- No connection, adapter unavailable, connection not ready, or already `pushed` → silently return (no error, no record).
- Token refresh only when `needsTokenRefresh` says so, immediately before the push; a refresh failure (revoked access) is recorded as a failed push and flags the connection — no retry loop (questionnaire commitment).
- The sweep only considers invoices with `created_at >= connection.created_at`: connecting must not spam years of history into the ledger. Reconnect upserts preserve the row and its `created_at`, so the window survives reconnection.
- Sweep batch limit 25 invoices per connection per run.

- [ ] **Step 1: Write `push.ts`**

```typescript
// Best-effort push of one committed invoice to the venue's accounting
// connection, plus the hourly retry sweep. A failed push NEVER fails the
// commit: the invoice is already safely in Pour IQ; this is downstream
// bookkeeping. Auth failures are never auto-retried in a loop (Intuit
// questionnaire commitment) — they land in the retry queue for the sweep
// or the per-invoice Retry action after the venue reconnects.

import * as Sentry from '@sentry/nextjs'
import { buildBill, needsTokenRefresh, type BillInvoiceHeader, type BillInvoiceLine } from './bill-builder'
import {
  isConnectionReady, listAccountingConnections,
  markAccountingPushError, markAccountingPushSuccess, updateAccountingTokens,
} from './connections'
import { getPushForInvoiceProvider, recordPushResult } from './pushes'
import { getAccountingAdapter, type AccountingProvidersEnv } from './providers'
import type { AccountingAdapter, AccountingConnection } from './types'

const SWEEP_BATCH_LIMIT = 25

async function ensureFreshToken(
  db: D1Database,
  adapter: AccountingAdapter,
  conn: AccountingConnection,
): Promise<AccountingConnection> {
  if (!needsTokenRefresh(conn.token_expires_at, Date.now())) return conn
  if (!conn.refresh_token) throw new Error('No refresh token; reconnect required')
  const tokens = await adapter.refreshAccessToken(conn.refresh_token)
  await updateAccountingTokens(db, conn.id, tokens)
  return {
    ...conn,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? conn.refresh_token,
    token_expires_at: tokens.expiresAt,
  }
}

export async function pushInvoiceToAccounting(
  db: D1Database,
  env: AccountingProvidersEnv,
  tradeAccountId: string,
  invoiceId: string,
): Promise<void> {
  let conn: AccountingConnection | null = null
  try {
    const connections = await listAccountingConnections(db, tradeAccountId)
    conn = connections.find(isConnectionReady) ?? null
    if (!conn) return

    const existing = await getPushForInvoiceProvider(db, invoiceId, conn.provider)
    if (existing?.status === 'pushed') return

    const adapter = getAccountingAdapter(conn.provider, env)
    if (!adapter) return

    const invoice = await db
      .prepare(`SELECT supplier_name, invoice_number, invoice_date, created_at, prices_include_vat
                FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
      .bind(invoiceId, tradeAccountId)
      .first<BillInvoiceHeader>()
    if (!invoice) return
    const lines = await db
      .prepare(`SELECT extracted_name, extracted_quantity, extracted_unit_price_p, extracted_line_total_p, applied
                FROM pouriq_invoice_lines WHERE invoice_id = ?1`)
      .bind(invoiceId)
      .all<BillInvoiceLine>()
    const bill = buildBill(invoice, lines.results ?? [])
    if (!bill) return

    const fresh = await ensureFreshToken(db, adapter, conn)
    const { externalBillId } = await adapter.pushBill(fresh, bill)

    await recordPushResult(db, {
      invoiceId, connectionId: conn.id, provider: conn.provider,
      status: 'pushed', externalBillId, error: null,
    })
    await markAccountingPushSuccess(db, conn.id)
  } catch (e) {
    const message = (e as Error).message ?? 'unknown'
    Sentry.captureException(e, {
      tags: { feature: 'pouriq-accounting-push', provider: conn?.provider ?? 'unknown' },
      extra: { invoiceId },
    })
    if (conn) {
      try {
        await recordPushResult(db, {
          invoiceId, connectionId: conn.id, provider: conn.provider,
          status: 'failed', externalBillId: null, error: message,
        })
        await markAccountingPushError(db, conn.id, message)
      } catch { /* swallow: push bookkeeping must never break the caller */ }
    }
  }
}

/** Hourly: re-attempt failed pushes and back-fill invoices committed while
 *  disconnected or half-set-up. Only invoices committed after the
 *  connection was created are considered. */
export async function runAccountingPushSweep(
  env: { DB: D1Database } & AccountingProvidersEnv,
): Promise<void> {
  const db = env.DB
  const result = await db
    .prepare(`SELECT * FROM pouriq_accounting_connections WHERE enabled = 1`)
    .all<AccountingConnection>()
  for (const conn of result.results ?? []) {
    if (!isConnectionReady(conn)) continue
    try {
      const pending = await db
        .prepare(`
          SELECT i.id FROM pouriq_invoices i
          LEFT JOIN pouriq_accounting_pushes p ON p.invoice_id = i.id AND p.provider = ?1
          WHERE i.trade_account_id = ?2
            AND i.created_at >= ?3
            AND (p.id IS NULL OR p.status = 'failed')
          ORDER BY i.created_at ASC
          LIMIT ${SWEEP_BATCH_LIMIT}
        `)
        .bind(conn.provider, conn.trade_account_id, conn.created_at)
        .all<{ id: string }>()
      for (const row of pending.results ?? []) {
        await pushInvoiceToAccounting(db, env, conn.trade_account_id, row.id)
      }
    } catch (e) {
      Sentry.captureException(e, { tags: { feature: 'pouriq-accounting-sweep', provider: conn.provider } })
    }
  }
}
```

- [ ] **Step 2: Wire the cron**

In `cloudflare-worker-entry.mjs`: add the import next to the existing `runHourlyPosBackfill` import (line ~7):

```javascript
import { runAccountingPushSweep } from './src/lib/pouriq/accounting/push.ts';
```

and inside the hourly branch where `ctx.waitUntil(runHourlyPosBackfill(env));` runs (line ~54), add directly beneath it:

```javascript
      ctx.waitUntil(runAccountingPushSweep(env));
```

- [ ] **Step 3: Typecheck and commit**

Run: `npx tsc --noEmit && npx vitest run tests/unit/lib`
Expected: no type errors, all unit tests pass.

```bash
git add src/lib/pouriq/accounting/push.ts cloudflare-worker-entry.mjs
git commit -m "feat(pouriq): accounting push orchestration + hourly retry sweep"
```

---

### Task 7: OAuth routes + invoice-commit hook

**Files:**
- Create: `src/app/api/pouriq/integrations/accounting/[provider]/oauth/start/route.ts`
- Create: `src/app/api/pouriq/integrations/accounting/[provider]/oauth/callback/route.ts`
- Modify: `src/app/api/pouriq/invoices/commit/route.ts` (persist `prices_include_vat` after the header insert; push step after `finaliseInvoiceTotals`)

**Interfaces:**
- Consumes: Tasks 3, 4, 5, 6.
- Produces: the two OAuth endpoints the AccountingCard links to; committed invoices carry `prices_include_vat` and trigger an immediate push.

- [ ] **Step 1: Write `oauth/start/route.ts`** (mirrors the POS start route)

```typescript
// Generic OAuth start for accounting providers (Xero, QuickBooks).
// Mirrors the POS start route; accounting connections live in their own
// table but share the OAuth state nonce table.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { createAccountingOAuthState } from '@/lib/pouriq/accounting/connections'
import { getAccountingAuthorizeUrl } from '@/lib/pouriq/accounting/providers'
import { isKnownAccountingProvider } from '@/lib/pouriq/accounting/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function GET(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.redirect(new URL('/trade/login', request.url))
  }
  const { provider } = await params
  if (!isKnownAccountingProvider(provider)) {
    return NextResponse.redirect(new URL('/trade/pouriq/settings/integrations?error=missing_params', request.url))
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const state = await createAccountingOAuthState(db, access.tradeAccountId, provider)
  const redirectUri = new URL(`/api/pouriq/integrations/accounting/${provider}/oauth/callback`, request.url).toString()
  const authorizeUrl = await getAccountingAuthorizeUrl(provider, env, state, redirectUri)
  if (!authorizeUrl) {
    return NextResponse.redirect(new URL('/trade/pouriq/settings/integrations?error=missing_params', request.url))
  }
  return NextResponse.redirect(authorizeUrl)
}
```

- [ ] **Step 2: Write `oauth/callback/route.ts`**

```typescript
// Generic OAuth callback for accounting providers. QuickBooks appends
// realmId (the company id) to the redirect; Xero resolves its org via the
// connections endpoint inside the adapter.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { consumeAccountingOAuthState, upsertAccountingConnection } from '@/lib/pouriq/accounting/connections'
import { getAccountingAdapter } from '@/lib/pouriq/accounting/providers'
import { isKnownAccountingProvider } from '@/lib/pouriq/accounting/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function GET(request: Request, { params }: Params) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const realmId = url.searchParams.get('realmId')

  const settingsUrl = new URL('/trade/pouriq/settings/integrations', request.url)
  if (error) {
    settingsUrl.searchParams.set('error', error)
    return NextResponse.redirect(settingsUrl)
  }
  if (!code || !state) {
    settingsUrl.searchParams.set('error', 'missing_params')
    return NextResponse.redirect(settingsUrl)
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.redirect(new URL('/trade/login', request.url))
  }

  const { provider } = await params
  if (!isKnownAccountingProvider(provider)) {
    settingsUrl.searchParams.set('error', 'missing_params')
    return NextResponse.redirect(settingsUrl)
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const stateRow = await consumeAccountingOAuthState(db, state)
  if (!stateRow || stateRow.provider !== provider || stateRow.trade_account_id !== access.tradeAccountId) {
    settingsUrl.searchParams.set('error', 'invalid_state')
    return NextResponse.redirect(settingsUrl)
  }

  const adapter = getAccountingAdapter(provider, env)
  if (!adapter) {
    settingsUrl.searchParams.set('error', 'missing_params')
    return NextResponse.redirect(settingsUrl)
  }

  try {
    const redirectUri = new URL(`/api/pouriq/integrations/accounting/${provider}/oauth/callback`, request.url).toString()
    const result = await adapter.exchangeCodeForToken(code, redirectUri, realmId)
    await upsertAccountingConnection(db, {
      trade_account_id: stateRow.trade_account_id,
      provider,
      external_account_id: result.externalAccountId,
      external_account_name: result.externalAccountName,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      token_expires_at: result.expiresAt,
    })
    settingsUrl.searchParams.set('connected', provider)
    return NextResponse.redirect(settingsUrl)
  } catch (e) {
    const detail = (e as Error)?.message ?? 'unknown'
    console.error(`${provider}-accounting-oauth-callback failed:`, detail)
    Sentry.captureException(e, { tags: { route: 'accounting-oauth-callback', provider }, extra: { detail } })
    settingsUrl.searchParams.set('error', 'token_exchange_failed')
    settingsUrl.searchParams.set('detail', detail.slice(0, 300))
    return NextResponse.redirect(settingsUrl)
  }
}
```

- [ ] **Step 3: Hook the commit route**

In `src/app/api/pouriq/invoices/commit/route.ts`:

(a) Add imports at the top with the other `@/lib/pouriq` imports:

```typescript
import { pushInvoiceToAccounting } from '@/lib/pouriq/accounting/push'
```

(b) Immediately after the step-1 `insertInvoiceHeader` try/catch block succeeds, persist the VAT basis (needed later by the retry sweep):

```typescript
  // Record the commit-time VAT basis so a later accounting-push retry can
  // build the bill with the right inclusive/exclusive tax flag.
  try {
    await db
      .prepare(`UPDATE pouriq_invoices SET prices_include_vat = ?1 WHERE id = ?2`)
      .bind(body.prices_include_vat === true ? 1 : 0, invoiceId)
      .run()
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'vat-basis' }, extra: { invoiceId } })
  }
```

(c) After the step-7 `finaliseInvoiceTotals` try/catch block and before the final `return NextResponse.json({ invoice_id: invoiceId })`, add:

```typescript
  // 8. Push to the venue's connected accounting software. Best-effort and
  //    internally non-throwing: a failed push lands in the retry queue and
  //    must never fail the commit.
  await pushInvoiceToAccounting(db, env, access.tradeAccountId, invoiceId)
```

- [ ] **Step 4: Typecheck, lint, commit**

Run: `npx tsc --noEmit && npx eslint src tests`
Expected: clean.

```bash
git add src/app/api/pouriq/integrations/accounting src/app/api/pouriq/invoices/commit/route.ts
git commit -m "feat(pouriq): accounting OAuth routes + push on invoice commit"
```

---

### Task 8: Options, setup, disconnect, retry routes

**Files:**
- Create: `src/app/api/pouriq/integrations/accounting/[provider]/options/route.ts`
- Create: `src/app/api/pouriq/integrations/accounting/[provider]/setup/route.ts`
- Create: `src/app/api/pouriq/integrations/accounting/[provider]/disconnect/route.ts`
- Create: `src/app/api/pouriq/integrations/accounting/[provider]/retry/route.ts`

**Interfaces:**
- Consumes: Tasks 3 to 6.
- Produces (consumed by the AccountingCard and invoice UI in Tasks 9 and 10):
  - GET `options` → `{ needsTenant: boolean, tenants: Array<{id,name}>, accounts: Array<{code,name}>, taxOptions: Array<{code,name}> }`. Query param `?tenant=<id>` previews a specific Xero org before setup is saved. When the connection has no org chosen and no `?tenant` given, `accounts`/`taxOptions` are empty and `needsTenant` is true.
  - POST `setup` body `{ tenant_id?: string, default_account_code: string, default_tax_code: string }` → `{ ok: true }`.
  - POST `disconnect` → `{ ok: true }` (revokes best-effort, deletes the connection; push history stays).
  - POST `retry` body `{ invoice_id: string }` → `{ status: 'pushed' | 'failed', error: string | null }`.

All four follow the same skeleton: `checkPourIqAccess()` → 401; `isKnownAccountingProvider` → 400; load connection → 404 when absent. Origin check via `isAllowedOrigin` on the POST routes (same as the commit route).

- [ ] **Step 1: Write `options/route.ts`**

```typescript
// Live-fetched choices for the finish-setup panel: Xero orgs (when the
// login holds several), expense accounts, and VAT/tax treatments.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getAccountingConnection, updateAccountingTokens } from '@/lib/pouriq/accounting/connections'
import { getAccountingAdapter } from '@/lib/pouriq/accounting/providers'
import { isKnownAccountingProvider } from '@/lib/pouriq/accounting/types'
import { needsTokenRefresh } from '@/lib/pouriq/accounting/bill-builder'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function GET(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { provider } = await params
  if (!isKnownAccountingProvider(provider)) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const adapter = getAccountingAdapter(provider, env)
  let connection = await getAccountingConnection(db, access.tradeAccountId, provider)
  if (!adapter || !connection) return NextResponse.json({ error: 'Not connected' }, { status: 404 })

  try {
    if (needsTokenRefresh(connection.token_expires_at, Date.now())) {
      if (!connection.refresh_token) throw new Error('No refresh token; reconnect required')
      const tokens = await adapter.refreshAccessToken(connection.refresh_token)
      await updateAccountingTokens(db, connection.id, tokens)
      connection = {
        ...connection,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken ?? connection.refresh_token,
        token_expires_at: tokens.expiresAt,
      }
    }

    const tenantParam = new URL(request.url).searchParams.get('tenant')
    const effectiveTenant = tenantParam ?? connection.external_account_id
    const needsTenant = effectiveTenant === ''

    const tenants = provider === 'xero' ? await adapter.listTenants(connection.access_token) : []
    if (needsTenant) {
      return NextResponse.json({ needsTenant: true, tenants, accounts: [], taxOptions: [] })
    }

    const effective = { ...connection, external_account_id: effectiveTenant }
    const [accounts, taxOptions] = await Promise.all([
      adapter.listExpenseAccounts(effective),
      adapter.listTaxOptions(effective),
    ])
    return NextResponse.json({ needsTenant: false, tenants, accounts, taxOptions })
  } catch (e) {
    Sentry.captureException(e, { tags: { route: 'accounting-options', provider } })
    return NextResponse.json({ error: 'Could not load choices from the provider. Try reconnecting.' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Write `setup/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getAccountingConnection, saveAccountingSetup } from '@/lib/pouriq/accounting/connections'
import { isKnownAccountingProvider } from '@/lib/pouriq/accounting/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

interface SetupBody {
  tenant_id?: string
  tenant_name?: string
  default_account_code: string
  default_tax_code: string
}

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { provider } = await params
  if (!isKnownAccountingProvider(provider)) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  let body: SetupBody
  try {
    body = (await request.json()) as SetupBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.default_account_code || typeof body.default_account_code !== 'string') {
    return NextResponse.json({ error: 'default_account_code required' }, { status: 400 })
  }
  if (!body.default_tax_code || typeof body.default_tax_code !== 'string') {
    return NextResponse.json({ error: 'default_tax_code required' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const connection = await getAccountingConnection(db, access.tradeAccountId, provider)
  if (!connection) return NextResponse.json({ error: 'Not connected' }, { status: 404 })
  if (connection.external_account_id === '' && !body.tenant_id) {
    return NextResponse.json({ error: 'Choose an organisation first' }, { status: 400 })
  }

  await saveAccountingSetup(db, access.tradeAccountId, provider, {
    external_account_id: body.tenant_id,
    external_account_name: body.tenant_name ?? null,
    default_account_code: body.default_account_code,
    default_tax_code: body.default_tax_code,
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Write `disconnect/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { deleteAccountingConnection, getAccountingConnection } from '@/lib/pouriq/accounting/connections'
import { getAccountingAdapter } from '@/lib/pouriq/accounting/providers'
import { isKnownAccountingProvider } from '@/lib/pouriq/accounting/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { provider } = await params
  if (!isKnownAccountingProvider(provider)) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const connection = await getAccountingConnection(db, access.tradeAccountId, provider)
  if (!connection) return NextResponse.json({ error: 'Not connected' }, { status: 404 })

  const adapter = getAccountingAdapter(provider, env)
  if (adapter) {
    try { await adapter.revokeToken(connection) } catch { /* best-effort */ }
  }
  await deleteAccountingConnection(db, access.tradeAccountId, provider)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Write `retry/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { pushInvoiceToAccounting } from '@/lib/pouriq/accounting/push'
import { getPushForInvoiceProvider } from '@/lib/pouriq/accounting/pushes'
import { isKnownAccountingProvider } from '@/lib/pouriq/accounting/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { provider } = await params
  if (!isKnownAccountingProvider(provider)) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  let body: { invoice_id?: string }
  try {
    body = (await request.json()) as { invoice_id?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.invoice_id || typeof body.invoice_id !== 'string') {
    return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const invoice = await db
    .prepare(`SELECT id FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(body.invoice_id, access.tradeAccountId)
    .first<{ id: string }>()
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  await pushInvoiceToAccounting(db, env, access.tradeAccountId, body.invoice_id)
  const push = await getPushForInvoiceProvider(db, body.invoice_id, provider)
  return NextResponse.json({ status: push?.status ?? 'failed', error: push?.error ?? null })
}
```

- [ ] **Step 5: Typecheck, lint, commit**

Run: `npx tsc --noEmit && npx eslint src tests`
Expected: clean.

```bash
git add src/app/api/pouriq/integrations/accounting
git commit -m "feat(pouriq): accounting setup, options, disconnect, retry routes"
```

---

### Task 9: AccountingCard + integrations page section

**Files:**
- Create: `src/components/pouriq/AccountingCard.tsx`
- Modify: `src/app/trade/pouriq/settings/integrations/page.tsx`

**Interfaces:**
- Consumes: routes from Tasks 7 and 8; `listAccountingConnections`, `isConnectionReady` from Task 3; `getAccountingAdapter` from Task 4.
- Produces: `AccountingCard` client component with props `{ provider: 'xero' | 'quickbooks', title: string, description: string, connection: AccountingCardConnection | null, available: boolean }` where `AccountingCardConnection = { external_account_name: string | null, default_account_code: string | null, needs_setup: boolean, last_push_at: string | null, last_push_error: string | null }` (no tokens cross the server/client boundary).

Card states: unavailable (secrets missing) → muted "Coming soon" card; not connected → Connect button linking to `/api/pouriq/integrations/accounting/{provider}/oauth/start`; connected but `needs_setup` → finish-setup panel (org picker when the options response says `needsTenant`, account dropdown, VAT dropdown, Save); ready → org name, account code, last push time, last error if any, Disconnect. Every card footer: "Need help? Contact trade@jerrycanspirits.co.uk" as a mailto link (Intuit questionnaire commitment).

- [ ] **Step 1: Write `AccountingCard.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AccountingCardConnection {
  external_account_name: string | null
  default_account_code: string | null
  needs_setup: boolean
  last_push_at: string | null
  last_push_error: string | null
}

interface Props {
  provider: 'xero' | 'quickbooks'
  title: string
  description: string
  connection: AccountingCardConnection | null
  available: boolean
}

interface Options {
  needsTenant: boolean
  tenants: Array<{ id: string; name: string }>
  accounts: Array<{ code: string; name: string }>
  taxOptions: Array<{ code: string; name: string }>
}

export function AccountingCard({ provider, title, description, connection, available }: Props) {
  const router = useRouter()
  const [options, setOptions] = useState<Options | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState('')
  const [accountCode, setAccountCode] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [saving, setSaving] = useState(false)

  const needsSetup = connection?.needs_setup === true

  const loadOptions = useCallback(async (tenant?: string) => {
    setOptionsError(null)
    const qs = tenant ? `?tenant=${encodeURIComponent(tenant)}` : ''
    const res = await fetch(`/api/pouriq/integrations/accounting/${provider}/options${qs}`)
    if (!res.ok) {
      setOptionsError('Could not load choices from the provider. Try reconnecting.')
      return
    }
    const data = await res.json() as Options
    setOptions(data)
    const standard = data.taxOptions.find((t) => /20%/.test(t.name))
    if (standard && !taxCode) setTaxCode(standard.code)
  }, [provider, taxCode])

  useEffect(() => {
    if (needsSetup) void loadOptions()
  }, [needsSetup, loadOptions])

  async function saveSetup() {
    setSaving(true)
    try {
      const tenantName = options?.tenants.find((t) => t.id === tenantId)?.name
      const res = await fetch(`/api/pouriq/integrations/accounting/${provider}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(tenantId ? { tenant_id: tenantId, tenant_name: tenantName } : {}),
          default_account_code: accountCode,
          default_tax_code: taxCode,
        }),
      })
      if (res.ok) router.refresh()
      else setOptionsError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    if (!window.confirm(`Disconnect ${title}? Pushed bills stay in ${title}; new invoices stop syncing.`)) return
    await fetch(`/api/pouriq/integrations/accounting/${provider}/disconnect`, { method: 'POST' })
    router.refresh()
  }

  return (
    <div className={`rounded-xl border p-5 ${available ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {!available ? (
          <span className="text-xs text-slate-400 whitespace-nowrap">Coming soon</span>
        ) : !connection ? (
          <a
            href={`/api/pouriq/integrations/accounting/${provider}/oauth/start`}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 whitespace-nowrap"
          >
            Connect {title}
          </a>
        ) : (
          <button type="button" onClick={disconnect} className="text-sm text-slate-500 hover:text-rose-600 whitespace-nowrap">
            Disconnect
          </button>
        )}
      </div>

      {connection && !needsSetup && (
        <div className="mt-4 text-sm text-slate-600 space-y-1">
          <p>
            Connected to <strong className="text-slate-900">{connection.external_account_name ?? title}</strong>,
            coding bills to account {connection.default_account_code}.
          </p>
          <p className="text-slate-500">
            {connection.last_push_at ? `Last push ${connection.last_push_at}.` : 'No invoices pushed yet. The next committed invoice goes across automatically.'}
          </p>
          {connection.last_push_error && (
            <p role="alert" className="text-rose-600">Last push failed: {connection.last_push_error}</p>
          )}
        </div>
      )}

      {connection && needsSetup && (
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
          <p className="text-sm font-medium text-slate-900">Finish setup</p>
          <p className="text-sm text-slate-500">
            Choose where pushed bills should be coded. Invoices committed in the meantime are queued and pushed once this is saved.
          </p>
          {optionsError && <p role="alert" className="text-sm text-rose-600">{optionsError}</p>}
          {options?.needsTenant && (
            <label className="block text-sm">
              <span className="text-slate-700">Organisation</span>
              <select
                value={tenantId}
                onChange={(e) => { setTenantId(e.target.value); void loadOptions(e.target.value) }}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Choose an organisation</option>
                {options.tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          )}
          {options && !options.needsTenant && options.accounts.length > 0 && (
            <>
              <label className="block text-sm">
                <span className="text-slate-700">Bills are coded to</span>
                <select
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Choose an expense account</option>
                  {options.accounts.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-700">VAT treatment</span>
                <select
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Choose a VAT rate</option>
                  {options.taxOptions.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
                </select>
              </label>
              <button
                type="button"
                onClick={saveSetup}
                disabled={saving || !accountCode || !taxCode}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? 'Saving' : 'Save and start pushing'}
              </button>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Need help? Contact <a href="mailto:trade@jerrycanspirits.co.uk" className="underline">trade@jerrycanspirits.co.uk</a>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Add the Accounting section to the integrations page**

In `src/app/trade/pouriq/settings/integrations/page.tsx`:

(a) Add imports:

```typescript
import { listAccountingConnections, isConnectionReady } from '@/lib/pouriq/accounting/connections'
import { getAccountingAdapter } from '@/lib/pouriq/accounting/providers'
import { AccountingCard, type AccountingCardConnection } from '@/components/pouriq/AccountingCard'
import type { AccountingProvider } from '@/lib/pouriq/accounting/types'
```

(b) Extend the parallel fetch with the accounting connections:

```typescript
  const [connections, activeMenu, unmatchedCount, accountingConnections] = await Promise.all([
    listConnections(db, access.tradeAccountId),
    getActiveMenu(db, access.tradeAccountId),
    countUnmatched(db, access.tradeAccountId),
    listAccountingConnections(db, access.tradeAccountId),
  ])
```

(c) Below the map construction, add (tokens must not reach the client):

```typescript
  const accountingByProvider = new Map(accountingConnections.map((c) => [c.provider, c]))
  function accountingCardConnection(provider: AccountingProvider): AccountingCardConnection | null {
    const c = accountingByProvider.get(provider)
    if (!c) return null
    return {
      external_account_name: c.external_account_name,
      default_account_code: c.default_account_code,
      needs_setup: !isConnectionReady(c),
      last_push_at: c.last_push_at,
      last_push_error: c.last_push_error,
    }
  }
```

(d) After the closing `</div>` of the POS cards `space-y-4` block, add the accounting section:

```tsx
        <h2 className="text-xl font-bold text-slate-900 mt-12 mb-2">Accounting</h2>
        <p className="text-slate-500 text-sm mb-6">
          Connect your accounting software and every committed invoice appears there as a draft bill, ready for your bookkeeper to approve.
        </p>
        <div className="space-y-4">
          <AccountingCard
            provider="xero"
            title="Xero"
            description="Committed invoices push as draft bills, coded to the account you choose."
            connection={accountingCardConnection('xero')}
            available={getAccountingAdapter('xero', env) !== null}
          />
          <AccountingCard
            provider="quickbooks"
            title="QuickBooks Online"
            description="Committed invoices push as draft bills. Requires QuickBooks Essentials or above (bills are not available on Simple Start)."
            connection={accountingCardConnection('quickbooks')}
            available={getAccountingAdapter('quickbooks', env) !== null}
          />
        </div>
```

- [ ] **Step 3: Typecheck, lint, build, commit**

Run: `npx tsc --noEmit && npx eslint src tests && npx next build`
Expected: clean build.

```bash
git add src/components/pouriq/AccountingCard.tsx src/app/trade/pouriq/settings/integrations/page.tsx
git commit -m "feat(pouriq): accounting cards on the integrations page"
```

---

### Task 10: Push status on invoice detail + list badges

**Files:**
- Create: `src/components/pouriq/AccountingPushStatus.tsx`
- Modify: `src/app/trade/pouriq/invoices/[id]/page.tsx`
- Modify: `src/app/trade/pouriq/invoices/page.tsx`
- Modify: `src/components/pouriq/InvoiceListTabs.tsx`

**Interfaces:**
- Consumes: `getPushForInvoiceProvider`, `getPushMapForInvoices` (Task 3), `listAccountingConnections`, `isConnectionReady` (Task 3), retry route (Task 8).
- Produces: `AccountingPushStatus` client component `{ invoiceId: string, provider: 'xero' | 'quickbooks', providerTitle: string, status: 'pushed' | 'failed' | 'pending', error: string | null, pushedAt: string | null }`; `InvoiceListTabs` gains optional prop `pushBadges?: Record<string, 'pushed' | 'failed'>`.

- [ ] **Step 1: Write `AccountingPushStatus.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  invoiceId: string
  provider: 'xero' | 'quickbooks'
  providerTitle: string
  status: 'pushed' | 'failed' | 'pending'
  error: string | null
  pushedAt: string | null
}

export function AccountingPushStatus({ invoiceId, provider, providerTitle, status, error, pushedAt }: Props) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  async function retry() {
    setRetrying(true)
    try {
      await fetch(`/api/pouriq/integrations/accounting/${provider}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      router.refresh()
    } finally {
      setRetrying(false)
    }
  }

  if (status === 'pushed') {
    return (
      <p className="text-sm text-emerald-700">
        Pushed to {providerTitle} as a draft bill{pushedAt ? ` (${pushedAt})` : ''}.
      </p>
    )
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-rose-600" role={status === 'failed' ? 'alert' : undefined}>
        {status === 'failed'
          ? `Push to ${providerTitle} failed${error ? `: ${error}` : ''}`
          : `Queued for ${providerTitle}. It will push on the next hourly run.`}
      </span>
      <button
        type="button"
        onClick={retry}
        disabled={retrying}
        className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {retrying ? 'Pushing' : 'Push now'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into the invoice detail page**

In `src/app/trade/pouriq/invoices/[id]/page.tsx` (a server component; read it first to place this cleanly):

(a) Imports:

```typescript
import { listAccountingConnections, isConnectionReady } from '@/lib/pouriq/accounting/connections'
import { getPushForInvoiceProvider } from '@/lib/pouriq/accounting/pushes'
import { AccountingPushStatus } from '@/components/pouriq/AccountingPushStatus'
```

(b) Alongside the page's existing data loads, resolve the ready connection and this invoice's push row:

```typescript
  const accountingConnections = await listAccountingConnections(db, access.tradeAccountId)
  const accountingConn = accountingConnections.find(isConnectionReady) ?? null
  const push = accountingConn ? await getPushForInvoiceProvider(db, invoiceId, accountingConn.provider) : null
```

(c) In the JSX, directly beneath the invoice header summary block (supplier, date, totals), render nothing when there is no ready connection, otherwise:

```tsx
        {accountingConn && (
          <div className="mt-4">
            <AccountingPushStatus
              invoiceId={invoiceId}
              provider={accountingConn.provider}
              providerTitle={accountingConn.provider === 'xero' ? 'Xero' : 'QuickBooks'}
              status={push?.status ?? 'pending'}
              error={push?.error ?? null}
              pushedAt={push?.status === 'pushed' ? push.pushed_at : null}
            />
          </div>
        )}
```

Use the page's actual variable names for `db`, `access`, and the invoice id param; adapt only those identifiers, nothing else.

- [ ] **Step 3: Add list badges**

In `src/app/trade/pouriq/invoices/page.tsx` (server component listing invoices; read it first):

(a) Imports as in Step 2 plus `getPushMapForInvoices`.

(b) After the invoices load, when a ready connection exists build the badge map and pass it down:

```typescript
  const accountingConnections = await listAccountingConnections(db, access.tradeAccountId)
  const hasAccounting = accountingConnections.some(isConnectionReady)
  const pushMap = hasAccounting ? await getPushMapForInvoices(db, invoices.map((i) => i.id)) : new Map()
  const pushBadges = Object.fromEntries(
    [...pushMap.entries()].map(([id, p]) => [id, p.status]),
  ) as Record<string, 'pushed' | 'failed'>
```

Pass `pushBadges={hasAccounting ? pushBadges : undefined}` to `<InvoiceListTabs>`.

(c) In `src/components/pouriq/InvoiceListTabs.tsx`, extend the props:

```typescript
interface Props {
  invoices: InvoiceRow[]
  pushBadges?: Record<string, 'pushed' | 'failed'>
}
```

update the signature to `export function InvoiceListTabs({ invoices, pushBadges }: Props)`, and in the status `<td>`, after the existing applied/attention badge, add:

```tsx
                        {pushBadges?.[inv.id] === 'pushed' && (
                          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-500">in accounts</span>
                        )}
                        {pushBadges?.[inv.id] === 'failed' && (
                          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-500">push failed</span>
                        )}
```

- [ ] **Step 4: Typecheck, lint, build, commit**

Run: `npx tsc --noEmit && npx eslint src tests && npx next build`
Expected: clean.

```bash
git add src/components/pouriq/AccountingPushStatus.tsx src/components/pouriq/InvoiceListTabs.tsx src/app/trade/pouriq/invoices
git commit -m "feat(pouriq): accounting push status on invoice detail + list badges"
```

---

### Task 11: Full verification + PR

**Files:**
- None new. Runs the gates, rebases, opens the PR.

- [ ] **Step 1: Run the full gate sequence**

```bash
npx tsc --noEmit
npx eslint src tests
npx vitest run
npx next build
npx opennextjs-cloudflare build
```
Expected: all clean. `opennextjs-cloudflare build` is the deploy gate and is stricter than `next build` — do not skip it.

- [ ] **Step 2: Rebase onto origin/main**

```bash
git fetch origin && git rebase origin/main
```
Expected: clean rebase (re-run the gates if anything was rebased over).

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin feat/pouriq-accounting-integrations
gh pr create --title "feat(pouriq): Xero + QuickBooks accounting integrations (migration 0065)" --body "$(cat <<'EOF'
## Summary
- Xero and QuickBooks Online connections per venue (OAuth, tokens in D1, finish-setup account + VAT picker)
- Committed invoices push automatically as draft purchase bills; failures queue and retry (hourly sweep + per-invoice Push now)
- Push status on the invoice detail page and list badges
- Migration 0065: accounting connections + pushes tables, prices_include_vat on invoices

## Spec
docs/superpowers/specs/2026-07-07-pouriq-accounting-integrations-design.md
Includes the binding Intuit questionnaire commitments (discovery endpoints, intuit_tid capture, no auth retry loops, in-app support contact).

## After merge
- Apply migration 0065: `npx wrangler d1 migrations apply jerry-can-spirits-db --remote`
- Set secrets: XERO_CLIENT_ID, XERO_CLIENT_SECRET, QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET (QUICKBOOKS_ENV unset = sandbox)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Remind Dan of the post-merge steps**

Post-merge is not live until: migration 0065 applied to prod, the four secrets set. QuickBooks stays sandbox until Intuit production review passes (submit the questionnaire only AFTER the sandbox connect/push/revoke/reconnect test has been run — several answers assert it). Draft the "Connect your accounting software" help-guide section in the same session as the merge, per the standing rule.

---

## Manual E2E (after deploy, with Dan)

Not automatable; run per provider once secrets are in place:

1. Connect (Xero Demo Company / Intuit sandbox company) from the integrations page.
2. Finish setup: pick an expense account and the 20% VAT rate.
3. Commit a scanned invoice; verify the draft bill in the provider (supplier, reference, date, net amounts, VAT treatment).
4. Failure drill: revoke app access from the provider's side, commit an invoice, confirm a failed push is recorded and surfaced; reconnect and confirm Push now (or the hourly sweep) recovers it.
5. Only then submit the Intuit production questionnaire.
