# Tevalis Integration (Sprint 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Tevalis EPOS sales sync into Pour IQ end-to-end so the Bank Bar and Grill pilot venue gets the same variance pipeline that Square venues already get.

**Architecture:** Tevalis slots into the existing `PosProvider` abstraction in `src/lib/pouriq/pos/`. Pour IQ holds shared dev credentials (`TEVALIS_GUID`, `TEVALIS_DEVELOPER_ID`) as Cloudflare Workers secrets; the bar manager pastes their venue's Tevalis Site ID into Settings. The new adapter implements the existing `PosAdapter` interface (with `exchangeCodeForToken`/`refreshAccessToken` made optional, since Tevalis uses static credentials). Sales are polled every 15 minutes by the existing cron job; no DB schema change needed.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare Workers + D1, Vitest (already installed in PR #722).

**Spec:** `docs/superpowers/specs/2026-05-24-tevalis-resdiary-integrations-design.md`

**Discovery-call dependency:** Tasks marked **⚠️ VERIFY** assume the spec's default Tevalis-auth model (GUID + DeveloperID in header, per-developer credentials, one set of dev creds servicing many venue Site IDs). If Tevalis's response materially differs, those tasks need revision before code lands.

---

## File Structure

### New files
- `src/lib/pouriq/pos/providers/tevalis.ts` — adapter implementation
- `src/app/api/pouriq/integrations/tevalis/connect/route.ts` — POST to register a venue's Tevalis Site ID
- `tests/unit/lib/pouriq/pos/providers/tevalis.test.ts` — adapter unit test
- `docs/sanity-help/connecting-tevalis-to-pour-iq.md` — Sanity help-guide draft (copy-paste into Sanity Studio post-merge)

### Modified files
- `src/lib/pouriq/pos/types.ts` — add `'tevalis'` to `PosProvider`, mark OAuth methods optional on `PosAdapter`
- `src/lib/pouriq/pos/scheduled.ts` — dispatch to Tevalis adapter alongside Square
- `src/app/trade/pouriq/settings/integrations/page.tsx` — add "Connect Tevalis" card
- `cloudflare-env.d.ts` — register `TEVALIS_GUID` and `TEVALIS_DEVELOPER_ID` secrets

### Untouched (deliberately)
- `src/lib/pouriq/pos/providers/square.ts` — Square adapter unchanged
- `src/lib/pouriq/pos/connections.ts` — DB layer unchanged (reuses `pouriq_pos_connections`)
- `src/lib/pouriq/pos/ingest.ts` — variance ingestion unchanged
- `migrations/` — no schema change

---

## Task 1: Branch from origin/main

**Files:** none

- [ ] **Step 1: Branch creation**

```bash
git fetch origin && git checkout -b feat/pouriq-tevalis-integration origin/main
```

Expected: switched to new branch tracking origin/main, clean working tree.

---

## Task 2: Make OAuth methods optional on PosAdapter, add 'tevalis' to provider union

**Files:**
- Modify: `src/lib/pouriq/pos/types.ts`

- [ ] **Step 1: Update the PosProvider union**

In `src/lib/pouriq/pos/types.ts`, change line 4:

```ts
export type PosProvider = 'square' | 'tevalis' | 'eposnow' | 'lightspeed' | 'toast'
```

- [ ] **Step 2: Make OAuth methods optional on PosAdapter**

Replace the `PosAdapter` interface (lines 37-58) with:

```ts
export interface PosAdapter {
  provider: PosProvider
  exchangeCodeForToken?(code: string, redirectUri: string): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
    scopes: string | null
    externalAccountId: string
    externalLocationId: string | null
  }>
  refreshAccessToken?(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
  }>
  fetchOrdersSince(
    connection: PosConnection,
    since: Date,
  ): Promise<PosOrderLine[]>
  verifyWebhook?(request: Request, body: string): Promise<boolean>
  parseWebhookPayload?(payload: unknown): PosOrderLine[]
}
```

The change marks `exchangeCodeForToken`, `refreshAccessToken`, `verifyWebhook`, and `parseWebhookPayload` as optional (the `?`). Square continues to implement all four; Tevalis implements only `fetchOrdersSince`.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no output. Square's adapter still satisfies the interface (it implements all methods, and optional doesn't forbid presence). Any other code that previously assumed those methods existed will now flag — fix in place if anything surfaces.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pouriq/pos/types.ts
git commit -m "refactor(pouriq): make OAuth methods optional on PosAdapter, add 'tevalis' provider"
```

---

## Task 3: Register Tevalis Cloudflare secrets in the env interface

**⚠️ VERIFY**: assumes Tevalis auth uses two scalar credentials (GUID + DeveloperID). If they issue an OAuth client instead, this changes.

**Files:**
- Modify: `cloudflare-env.d.ts`

- [ ] **Step 1: Read the current env interface**

```bash
cat cloudflare-env.d.ts
```

Expected: a `CloudflareEnv` interface listing all bindings/secrets.

- [ ] **Step 2: Add Tevalis secrets**

Append to the existing `CloudflareEnv` interface (preserve all existing fields):

```ts
  TEVALIS_GUID?: string
  TEVALIS_DEVELOPER_ID?: string
```

Both optional so local dev without the secrets doesn't break typing.

- [ ] **Step 3: Add the secrets in Cloudflare (deferred to ops, not code)**

This is an operator step, not a code step. After this PR merges, run (or get Dan to run):

```bash
wrangler secret put TEVALIS_GUID
wrangler secret put TEVALIS_DEVELOPER_ID
```

Note the spec's `feedback_wrangler_versions_secrets.md` memory: if the Worker is in Versions mode, the secret prompt needs the `--env` flag. Check that memory before running.

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit
git add cloudflare-env.d.ts
git commit -m "chore(env): register TEVALIS_GUID and TEVALIS_DEVELOPER_ID Worker secrets"
```

---

## Task 4: Implement the Tevalis adapter

**⚠️ VERIFY**: endpoint paths and request/response shape below are based on the public Tevalis API documentation PDF. The implementer must cross-check against `https://api.tevalis.com/Help/Index` (Tevalis's live API help portal) and adjust the URL and JSON shape if the docs have moved on.

**Files:**
- Create: `src/lib/pouriq/pos/providers/tevalis.ts`

- [ ] **Step 1: Write the adapter file**

Create `src/lib/pouriq/pos/providers/tevalis.ts`:

```ts
import type { PosAdapter, PosConnection, PosOrderLine } from '../types'

export interface TevalisEnv {
  TEVALIS_GUID?: string
  TEVALIS_DEVELOPER_ID?: string
}

const TEVALIS_BASE_URL = 'https://api.tevalis.com'

interface TevalisSale {
  TransactionId: string
  ItemId: string
  ItemName: string
  Quantity: number
  GrossAmount: number  // pence — confirm against Tevalis docs
  SoldAt: string       // ISO datetime
}

interface TevalisSalesResponse {
  Sales: TevalisSale[]
}

export function createTevalisAdapter(env: TevalisEnv): PosAdapter {
  return {
    provider: 'tevalis',

    async fetchOrdersSince(connection: PosConnection, since: Date): Promise<PosOrderLine[]> {
      if (!env.TEVALIS_GUID || !env.TEVALIS_DEVELOPER_ID) {
        throw new Error('Tevalis credentials not configured (TEVALIS_GUID, TEVALIS_DEVELOPER_ID)')
      }

      const siteId = connection.external_account_id
      const url = new URL(`${TEVALIS_BASE_URL}/api/SalesAttendance`)
      url.searchParams.set('siteId', siteId)
      url.searchParams.set('from', since.toISOString())

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'GUID': env.TEVALIS_GUID,
          'DeveloperID': env.TEVALIS_DEVELOPER_ID,
          'Accept': 'application/json',
        },
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Tevalis ${res.status}: ${errText.slice(0, 200)}`)
      }

      const data = (await res.json()) as TevalisSalesResponse

      return (data.Sales ?? []).map((sale): PosOrderLine => ({
        external_order_id: sale.TransactionId,
        external_item_id: sale.ItemId,
        name: sale.ItemName,
        quantity: sale.Quantity,
        sold_at: sale.SoldAt,
        gross_amount_p: sale.GrossAmount,
      }))
    },
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output. The returned object satisfies `PosAdapter` because the OAuth methods are now optional.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/pos/providers/tevalis.ts
git commit -m "feat(pouriq): Tevalis POS adapter with sales pull"
```

---

## Task 5: Add the unit test for the adapter

**Files:**
- Create: `tests/unit/lib/pouriq/pos/providers/tevalis.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/lib/pouriq/pos/providers/tevalis.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTevalisAdapter } from '@/lib/pouriq/pos/providers/tevalis'
import type { PosConnection } from '@/lib/pouriq/pos/types'

const stubConnection: PosConnection = {
  id: 'conn-1',
  trade_account_id: 'ta-1',
  provider: 'tevalis',
  external_account_id: 'SITE-001',
  external_location_id: null,
  access_token: '',
  refresh_token: null,
  token_expires_at: null,
  scopes: null,
  last_synced_at: null,
  last_sync_error: null,
  enabled: 1,
  target_menu_id: null,
  created_at: '2026-05-25T00:00:00Z',
  updated_at: '2026-05-25T00:00:00Z',
}

describe('createTevalisAdapter', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          Sales: [
            {
              TransactionId: 'tx-1',
              ItemId: 'item-1',
              ItemName: 'Expedition Spiced — 25ml',
              Quantity: 2,
              GrossAmount: 800,
              SoldAt: '2026-05-25T18:30:00Z',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('sends GUID and DeveloperID headers and normalises sales into PosOrderLine[]', async () => {
    const adapter = createTevalisAdapter({
      TEVALIS_GUID: 'test-guid',
      TEVALIS_DEVELOPER_ID: 'test-dev-id',
    })
    const since = new Date('2026-05-25T00:00:00Z')

    const lines = await adapter.fetchOrdersSince(stubConnection, since)

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('SalesAttendance')
    expect(String(url)).toContain('siteId=SITE-001')

    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(headers.GUID).toBe('test-guid')
    expect(headers.DeveloperID).toBe('test-dev-id')

    expect(lines).toEqual([
      {
        external_order_id: 'tx-1',
        external_item_id: 'item-1',
        name: 'Expedition Spiced — 25ml',
        quantity: 2,
        sold_at: '2026-05-25T18:30:00Z',
        gross_amount_p: 800,
      },
    ])
  })

  it('throws if credentials are not configured', async () => {
    const adapter = createTevalisAdapter({})
    await expect(adapter.fetchOrdersSince(stubConnection, new Date())).rejects.toThrow(
      /TEVALIS_GUID/,
    )
  })
})
```

- [ ] **Step 2: Run the test, expect pass**

```bash
npm run test:unit
```

Expected: both Tevalis tests pass plus the existing `shopify-admin` test from PR #722.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/lib/pouriq/pos/providers/tevalis.test.ts
git commit -m "test(pouriq): cover Tevalis adapter header + normalisation contract"
```

---

## Task 6: Wire Tevalis into the polling cron

**Files:**
- Modify: `src/lib/pouriq/pos/scheduled.ts`

- [ ] **Step 1: Add Tevalis dispatch to the cron**

Replace the `Env` interface and the `for` loop body in `src/lib/pouriq/pos/scheduled.ts`:

```ts
import { createSquareAdapter } from './providers/square'
import { createTevalisAdapter } from './providers/tevalis'
import { ingestOrderLines } from './ingest'
import { markSyncSuccess, markSyncError } from './connections'
import type { PosConnection } from './types'

interface Env {
  DB: D1Database
  SQUARE_APP_ID: string
  SQUARE_APP_SECRET: string
  SQUARE_WEBHOOK_SIGNATURE_KEY: string
  SQUARE_ENV?: string
  TEVALIS_GUID?: string
  TEVALIS_DEVELOPER_ID?: string
}

export async function runHourlyPosBackfill(env: Env): Promise<void> {
  const db = env.DB
  const result = await db
    .prepare(`SELECT * FROM pouriq_pos_connections WHERE enabled = 1`)
    .all<PosConnection>()
  const connections = result.results ?? []
  for (const conn of connections) {
    try {
      if (conn.provider === 'square') {
        const adapter = createSquareAdapter(env)
        const since = conn.last_synced_at
          ? new Date(new Date(conn.last_synced_at).getTime() - 60 * 60 * 1000)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const lines = await adapter.fetchOrdersSince(conn, since)
        const result = await ingestOrderLines(db, conn, lines)
        if (!result.paused) {
          await markSyncSuccess(db, conn.id)
        }
      } else if (conn.provider === 'tevalis') {
        const adapter = createTevalisAdapter(env)
        const since = conn.last_synced_at
          ? new Date(new Date(conn.last_synced_at).getTime() - 60 * 60 * 1000)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const lines = await adapter.fetchOrdersSince(conn, since)
        const result = await ingestOrderLines(db, conn, lines)
        if (!result.paused) {
          await markSyncSuccess(db, conn.id)
        }
      }
      // Future providers: dispatch here.
    } catch (e) {
      await markSyncError(db, conn.id, (e as Error).message ?? 'unknown').catch(() => {})
    }
  }
}
```

The Tevalis branch is a near-duplicate of the Square branch by design — keeps each provider's flow explicit and avoids premature abstraction. A future refactor can collapse the shared shape if a third provider lands.

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/pos/scheduled.ts
git commit -m "feat(pouriq): poll Tevalis venues in the hourly cron"
```

---

## Task 7: Add the connect API route

**Files:**
- Create: `src/app/api/pouriq/integrations/tevalis/connect/route.ts`

- [ ] **Step 1: Write the route**

Create the file:

```ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountForUser } from '@/lib/pouriq/access'
import { upsertConnection } from '@/lib/pouriq/pos/connections'
import { createTevalisAdapter } from '@/lib/pouriq/pos/providers/tevalis'

export const dynamic = 'force-dynamic'

interface Body {
  siteId?: string
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext()
    const db = env.DB

    const tradeAccount = await getTradeAccountForUser(request, db)
    if (!tradeAccount) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    const siteId = body.siteId?.trim()
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    const adapter = createTevalisAdapter({
      TEVALIS_GUID: env.TEVALIS_GUID as string | undefined,
      TEVALIS_DEVELOPER_ID: env.TEVALIS_DEVELOPER_ID as string | undefined,
    })

    // Validate by attempting a small read. If the site ID is wrong or the
    // dev creds are missing, this throws and we surface a 400.
    try {
      await adapter.fetchOrdersSince(
        {
          id: 'validate',
          trade_account_id: tradeAccount.id,
          provider: 'tevalis',
          external_account_id: siteId,
          external_location_id: null,
          access_token: '',
          refresh_token: null,
          token_expires_at: null,
          scopes: null,
          last_synced_at: null,
          last_sync_error: null,
          enabled: 1,
          target_menu_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        new Date(Date.now() - 60 * 60 * 1000),
      )
    } catch (e) {
      return NextResponse.json(
        { error: `Tevalis validation failed: ${(e as Error).message}` },
        { status: 400 },
      )
    }

    const id = await upsertConnection(db, {
      trade_account_id: tradeAccount.id,
      provider: 'tevalis',
      external_account_id: siteId,
      external_location_id: null,
      access_token: '',
      refresh_token: null,
      token_expires_at: null,
      scopes: null,
    })

    // ISR revalidation per memory rule (feedback_isr_revalidatepath.md)
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/trade/pouriq/settings/integrations')

    return NextResponse.json({ id, provider: 'tevalis', siteId })
  } catch (error) {
    console.error('[tevalis] connect error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Confirm `getTradeAccountForUser` exists or substitute the actual access helper**

Read `src/lib/pouriq/access.ts` to confirm the helper name and signature. If it's named differently (e.g. `requireTradeAccount`, `getCurrentTradeAccount`), update the import and call site to match. The existing Square OAuth callback under `src/app/api/pouriq/integrations/square/oauth/callback/route.ts` will show the correct pattern.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/api/pouriq/integrations/tevalis/connect/route.ts
git commit -m "feat(pouriq): POST /api/pouriq/integrations/tevalis/connect"
```

---

## Task 8: Add the "Connect Tevalis" card to the Settings UI

**Files:**
- Modify: `src/app/trade/pouriq/settings/integrations/page.tsx`

- [ ] **Step 1: Read the current page**

```bash
cat src/app/trade/pouriq/settings/integrations/page.tsx
```

Expected: existing Square card pattern (client component or server component with a small client form). Mirror its visual structure exactly.

- [ ] **Step 2: Add the Tevalis card**

Add a new card adjacent to the existing Square card. The card needs:
- Section title "Tevalis"
- One input field, type=text, name=siteId, label "Tevalis Site ID"
- One Save button
- On submit: POST JSON `{ siteId }` to `/api/pouriq/integrations/tevalis/connect`
- Display success state (existing connection's `last_synced_at`, last error if any) or failure (inline error message from the API response)

Reuse the visual classes used by the Square card so styling stays consistent. The form submission needs `'use client'` if the existing card doesn't already provide a client component for this.

Exact JSX depends on the existing pattern — copy the Square card's structure verbatim, then change:
- "Square" → "Tevalis"
- OAuth flow button → form with `siteId` input + Save button
- POST target → `/api/pouriq/integrations/tevalis/connect`

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:3000/trade/pouriq/settings/integrations` (logged in as a trade account). Confirm the Tevalis card renders alongside the Square card. Submit a known-invalid Site ID — should surface an inline error.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/trade/pouriq/settings/integrations/page.tsx
git commit -m "feat(pouriq): Settings UI 'Connect Tevalis' card"
```

---

## Task 9: Draft the Sanity help-guide entry

**Files:**
- Create: `docs/sanity-help/connecting-tevalis-to-pour-iq.md`

- [ ] **Step 1: Write the help-guide draft**

Create the file. Voice per `feedback_pouriq_help_guide_style.md` in memory: measured, brand-voiced, structured. After merge, the content gets copy-pasted into Sanity Studio as a new help-guide entry.

```markdown
# Connecting Tevalis to Pour IQ

Pour IQ pulls sales data from your Tevalis EPOS so it can compare what you sold against what you stocked. Variance shows up automatically. No CSV exports, no manual reconciliation.

## What you'll need

- Your Tevalis Site ID (a short identifier — your Tevalis account manager can confirm it)
- A Pour IQ trade account with admin access

## Steps

1. In Pour IQ, go to Settings → Integrations.
2. Find the Tevalis card and paste your Site ID into the field.
3. Click Save. Pour IQ will make one read call to Tevalis to confirm the Site ID is valid and the credentials work.
4. Once connected, sales flow into Pour IQ automatically. The first sync covers the last seven days; after that, sync runs every fifteen minutes.

## What gets synced

- Sales transactions (item, quantity, time, gross amount)
- Used to calculate variance against the menu you have configured in Pour IQ

## What doesn't get synced

- Customer data
- Payment method or card details
- Anything other than the line items on a sale

## Troubleshooting

**"Tevalis validation failed"** — most often the Site ID is wrong, or has a typo. Confirm with your Tevalis account manager. Less commonly, our shared developer credentials need re-issuing — if you see this and the Site ID is definitely correct, contact us.

**Sync stopped after working previously** — check the connection card on the Settings page. The "Last sync error" line shows what went wrong. Most issues self-recover on the next cron tick. If the error mentions credentials, contact us.

## Disconnecting

Open the Tevalis card on Settings → Integrations and remove the Site ID. Pour IQ stops syncing immediately. Historical sales data stays in your Pour IQ history.
```

- [ ] **Step 2: Commit**

```bash
git add docs/sanity-help/connecting-tevalis-to-pour-iq.md
git commit -m "docs(pouriq): help-guide draft for connecting Tevalis"
```

---

## Task 10: Full verification

**Files:** none

- [ ] **Step 1: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Unit tests**

```bash
npm run test:unit
```

Expected: all tests pass. The Tevalis adapter test added in Task 5 plus the existing `shopify-admin` test should both pass.

- [ ] **Step 4: Production build**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 5: Dev server smoke (manual, gated on credentials)**

Only run this if `TEVALIS_GUID` and `TEVALIS_DEVELOPER_ID` are available in your local `.dev.vars`. Otherwise skip and rely on the unit test until credentials land.

```bash
npm run dev
```

Walk through:
- `/trade/pouriq/settings/integrations` — Tevalis card renders, accepts a Site ID, saves, shows freshness state.
- Wait 15+ minutes (or trigger the cron manually if a manual trigger exists in dev). Confirm `last_synced_at` updates and sales appear in the existing variance view at `/trade/pouriq` → variance.

Stop dev server.

---

## Task 11: Open the PR

**Files:** none

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/pouriq-tevalis-integration
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --base main --head feat/pouriq-tevalis-integration --title "feat(pouriq): Tevalis EPOS integration (Sprint 1 of Bank pilot)" --body "$(cat <<'EOF'
## Summary

Implements **Sprint 1** of the Bank Bar and Grill pilot per spec \`docs/superpowers/specs/2026-05-24-tevalis-resdiary-integrations-design.md\` (#721).

- Adds Tevalis to the existing \`PosProvider\` abstraction
- Pour-IQ-held shared dev credentials (\`TEVALIS_GUID\`, \`TEVALIS_DEVELOPER_ID\`); bar manager provides Site ID only
- Polls Tevalis venues every 15 minutes via the existing hourly cron, alongside Square
- New Settings UI card for connecting Tevalis
- Unit test covers the adapter contract (headers + normalisation)
- Sanity help-guide draft included for post-merge upload

## Operator steps (after merge)

1. \`wrangler secret put TEVALIS_GUID\` (use the GUID issued by Tevalis)
2. \`wrangler secret put TEVALIS_DEVELOPER_ID\` (use the DeveloperID issued by Tevalis)
3. Upload the help-guide draft (\`docs/sanity-help/connecting-tevalis-to-pour-iq.md\`) into Sanity Studio
4. Bank connects via Settings → Integrations using their Tevalis Site ID

## Discovery-call dependency

Several assumptions in this PR depend on the pending Tevalis partnership-call response (auth model, sandbox availability, rate limits). If Tevalis's response materially differs from the spec's defaults, follow-up PRs will adjust. The shape of the change is small enough that revision is cheap.

## Test plan

- [x] Typecheck (\`npx tsc --noEmit\`)
- [x] Lint (\`npm run lint\`)
- [x] Unit tests (\`npm run test:unit\`)
- [x] Production build (\`npm run build\`)
- [ ] Manual smoke against Bank's live Site ID once credentials land
- [ ] Confirm sales appear in the existing variance view after first cron tick

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

---

## Self-Review Notes

**Spec coverage:**
- Provider extension ✓ (Task 2)
- Auth model (shared creds + per-venue Site ID) ✓ (Tasks 3, 7)
- Adapter ✓ (Task 4)
- Sync model (polling via existing cron) ✓ (Task 6)
- Settings UI ✓ (Task 8)
- No new DB tables ✓ (reuses `pouriq_pos_connections`)
- Variance integration ✓ (free — adapter feeds existing `ingestOrderLines`)
- Help guide ✓ (Task 9)
- Tests ✓ (Task 5)

**Placeholder scan:** all code blocks contain concrete code; no TBDs.

**Type consistency:** `PosProvider` extension at Task 2 matches usage in Tasks 6, 7. `PosConnection` shape used in Task 5 stub matches the canonical type. The `createTevalisAdapter(env)` signature is consistent across the adapter (Task 4), the cron (Task 6), the route (Task 7), and the test (Task 5).

**Out-of-scope confirmations:**
- Tevalis webhooks (deferred — polling default in v1; revisit only if Tevalis confirms webhook support on the discovery call)
- Tevalis Stock endpoint (future enhancement, separate spec)
- Tevalis Reservations endpoint (future — most venues use ResDiary)
