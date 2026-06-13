# Pour IQ Integration Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add api-key auth-mode groundwork (so Tevalis drops in on approval) and a full Zettle (PayPal POS) adapter for the free UK POS segment.

**Architecture:** PR 1 makes the connection model and adapter interface auth-mode aware, adds a provider registry, a connect-key route, and a credential-form variant of `IntegrationCard`. PR 2 adds the Zettle adapter (OAuth2, Purchase API polling) plus generic `[provider]/oauth/start|callback` routes; Square's static routes shadow the generic ones, so Square is untouched. Both build on PR #744's dedup + token refresh.

**Tech Stack:** Next.js route handlers on Workers, D1, existing `PosAdapter` pattern.

**Spec:** `docs/superpowers/specs/2026-06-12-pouriq-integration-expansion-design.md`

**Branch:** `feat/pouriq-zettle-integration` (PR 2). PR 1 gets its own branch `feat/pouriq-auth-mode` cut first; PR 2 rebases on it after merge.

**Caveat:** Zettle endpoint shapes (`oauth.zettle.com`, `purchase.izettle.com/purchases/v2`, `users/me` org UUID, `lastPurchaseHash` pagination) are from documentation knowledge; the end-to-end sandbox step verifies them and small adjustments there are expected, not failures.

---

## PR 1 — auth-mode groundwork (branch `feat/pouriq-auth-mode`)

### Task 1: Migration + types

**Files:**
- Create: `migrations/0030_pos_connection_auth_mode.sql`
- Modify: `src/lib/pouriq/pos/types.ts`

- [ ] **Step 1: Migration**

```sql
-- api-key providers (Tevalis etc.) store their credential in access_token;
-- refresh fields stay null and the cron skips token refresh for them.
ALTER TABLE pouriq_pos_connections ADD COLUMN auth_mode TEXT NOT NULL DEFAULT 'oauth';
```

- [ ] **Step 2: Types**

In `src/lib/pouriq/pos/types.ts`:

1. Replace the provider union:
```ts
export type PosProvider = 'square' | 'zettle' | 'sumup' | 'tevalis' | 'eposnow' | 'lightspeed' | 'toast'
export type PosAuthMode = 'oauth' | 'api-key'
```
2. Add to `PosConnection` (after `enabled: number`):
```ts
  auth_mode: PosAuthMode
```
3. Replace the `PosAdapter` interface:
```ts
export interface PosAdapter {
  provider: PosProvider
  authMode: PosAuthMode
  /** OAuth adapters only. */
  exchangeCodeForToken?(code: string, redirectUri: string): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
    scopes: string | null
    externalAccountId: string
    externalLocationId: string | null
  }>
  /** OAuth adapters only. */
  refreshAccessToken?(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
  }>
  /** Api-key adapters only: verify credentials against the provider, return account identity. */
  validateCredentials?(fields: Record<string, string>): Promise<{
    externalAccountId: string
    externalLocationId: string | null
  }>
  fetchOrdersSince(connection: PosConnection, since: Date): Promise<PosOrderLine[]>
  verifyWebhook(request: Request, body: string): Promise<boolean>
  parseWebhookPayload(payload: unknown): PosOrderLine[]
  /** Revoke the token with the provider on disconnect. Best-effort. */
  revokeToken?(accessToken: string): Promise<void>
}

export interface ProviderCredentialField {
  key: string
  label: string
  secret: boolean
}

/** Credential fields per api-key provider. Empty until Tevalis lands. */
export const PROVIDER_CREDENTIAL_FIELDS: Partial<Record<PosProvider, ProviderCredentialField[]>> = {}
```

- [ ] **Step 3: Fix the Square adapter for the new interface**

In `src/lib/pouriq/pos/providers/square.ts`, add `authMode: 'oauth',` directly under `provider: 'square',` in the returned object.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean (optional methods are backwards-compatible; call sites use them via the cron/oauth routes which pass concrete adapters).

- [ ] **Step 5: Commit**

```bash
git add migrations/0030_pos_connection_auth_mode.sql src/lib/pouriq/pos/types.ts src/lib/pouriq/pos/providers/square.ts
git commit -m "feat(pouriq): auth-mode column and adapter interface for api-key providers"
```

### Task 2: Provider registry

**Files:**
- Create: `src/lib/pouriq/pos/providers/index.ts`

- [ ] **Step 1: Registry module**

```ts
import { createSquareAdapter, getSquareBaseUrl } from './square'
import type { PosAdapter, PosProvider } from '../types'

/** Env slice the registry needs. All optional — adapters throw if their vars are missing. */
export interface ProvidersEnv {
  SQUARE_APP_ID?: string
  SQUARE_APP_SECRET?: string
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string
  SQUARE_ENV?: string
  ZETTLE_CLIENT_ID?: string
  ZETTLE_CLIENT_SECRET?: string
}

export function getAdapterForProvider(provider: PosProvider, env: ProvidersEnv): PosAdapter | null {
  switch (provider) {
    case 'square':
      if (!env.SQUARE_APP_ID || !env.SQUARE_APP_SECRET || !env.SQUARE_WEBHOOK_SIGNATURE_KEY) return null
      return createSquareAdapter({
        SQUARE_APP_ID: env.SQUARE_APP_ID,
        SQUARE_APP_SECRET: env.SQUARE_APP_SECRET,
        SQUARE_WEBHOOK_SIGNATURE_KEY: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
        SQUARE_ENV: env.SQUARE_ENV,
      })
    default:
      return null
  }
}

/** Authorize URL for OAuth providers; null for api-key providers / unknown. */
export function getOAuthAuthorizeUrl(
  provider: PosProvider,
  env: ProvidersEnv,
  state: string,
  redirectUri: string,
): string | null {
  switch (provider) {
    case 'square': {
      if (!env.SQUARE_APP_ID) return null
      const params = new URLSearchParams({
        client_id: env.SQUARE_APP_ID,
        scope: 'ORDERS_READ ITEMS_READ MERCHANT_PROFILE_READ',
        session: 'false',
        state,
        redirect_uri: redirectUri,
      })
      return `${getSquareBaseUrl({ SQUARE_ENV: env.SQUARE_ENV })}/oauth2/authorize?${params.toString()}`
    }
    default:
      return null
  }
}
```

(Zettle cases are added in PR 2 Task 6.)

- [ ] **Step 2: Use the registry in the cron, sync route, disconnect route, and webhook route**

`src/lib/pouriq/pos/scheduled.ts` — replace the Square-only branch:

```ts
import { getAdapterForProvider } from './providers'
```
and inside the loop replace `if (conn.provider === 'square') { const adapter = createSquareAdapter(env) ... }` with:

```ts
      const adapter = getAdapterForProvider(conn.provider, env)
      if (!adapter) continue

      // Refresh the access token before it expires; a lapsed token
      // would fail every sync until the venue reconnects manually.
      if (adapter.authMode === 'oauth' && adapter.refreshAccessToken && conn.refresh_token && conn.token_expires_at) {
        const expiresAt = new Date(conn.token_expires_at).getTime()
        if (Number.isFinite(expiresAt) && expiresAt - Date.now() < TOKEN_REFRESH_WINDOW_MS) {
          const refreshed = await adapter.refreshAccessToken(conn.refresh_token)
          await updateConnectionTokens(db, conn.id, refreshed)
          conn.access_token = refreshed.accessToken
          conn.refresh_token = refreshed.refreshToken ?? conn.refresh_token
          conn.token_expires_at = refreshed.expiresAt
        }
      }

      const since = conn.last_synced_at
        ? new Date(new Date(conn.last_synced_at).getTime() - 60 * 60 * 1000)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const lines = await adapter.fetchOrdersSince(conn, since)
      const result = await ingestOrderLines(db, conn, lines)
      if (!result.paused) {
        await markSyncSuccess(db, conn.id)
      }
```
Remove the now-unused `createSquareAdapter` import and the `// Future providers: dispatch here.` comment. The `Env` interface in scheduled.ts becomes `{ DB: D1Database } & ProvidersEnv` (import `ProvidersEnv`).

`src/app/api/pouriq/integrations/[provider]/sync/route.ts` — replace the hardcoded `if (provider !== 'square')` check and `createSquareAdapter` call with:

```ts
import { getAdapterForProvider } from '@/lib/pouriq/pos/providers'
import { isKnownProvider } from '@/lib/pouriq/pos/types'
```
```ts
  if (!isKnownProvider(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }
  ...
  const adapter = getAdapterForProvider(provider, env)
  if (!adapter) {
    return NextResponse.json({ error: 'Provider not available' }, { status: 400 })
  }
```
Add the guard helper to `types.ts`:
```ts
const KNOWN_PROVIDERS: readonly PosProvider[] = ['square', 'zettle', 'sumup', 'tevalis', 'eposnow', 'lightspeed', 'toast']
export function isKnownProvider(p: string): p is PosProvider {
  return (KNOWN_PROVIDERS as readonly string[]).includes(p)
}
```

`src/app/api/pouriq/integrations/[provider]/disconnect/route.ts` — replace the Square-specific revoke block with the registry:

```ts
  if (isKnownProvider(provider)) {
    const connection = await getConnection(db, access.tradeAccountId, provider)
    if (connection) {
      const adapter = getAdapterForProvider(provider, env)
      await adapter?.revokeToken?.(connection.access_token).catch(() => {})
    }
  }
```
(also swap the hardcoded `['square', 'eposnow', 'lightspeed', 'toast'].includes(provider)` validation for `isKnownProvider(provider)`).

`src/app/api/pouriq/integrations/square/webhook/route.ts` — unchanged (Square-specific by design).

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src/lib/pouriq src/app/api/pouriq`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pouriq/pos src/app/api/pouriq/integrations
git commit -m "feat(pouriq): provider registry; cron and routes dispatch by provider"
```

### Task 3: connect-key route

**Files:**
- Create: `src/app/api/pouriq/integrations/[provider]/connect-key/route.ts`

- [ ] **Step 1: Route**

```ts
// POST /api/pouriq/integrations/[provider]/connect-key
// Connects an api-key provider: validates the submitted credential fields
// against the provider and upserts the connection.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { isRateLimited } from '@/lib/pouriq/rate-limit'
import { upsertConnection } from '@/lib/pouriq/pos/connections'
import { getAdapterForProvider } from '@/lib/pouriq/pos/providers'
import { isKnownProvider, PROVIDER_CREDENTIAL_FIELDS } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { provider } = await params
  if (!isKnownProvider(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }
  const declaredFields = PROVIDER_CREDENTIAL_FIELDS[provider]
  if (!declaredFields) {
    return NextResponse.json({ error: 'Provider does not use API key connection' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  if (await isRateLimited(kv, 'pouriq-connect-key', access.tradeAccountId, 10, 3600)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let body: { fields?: Record<string, string> }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const fields: Record<string, string> = {}
  for (const f of declaredFields) {
    const value = body.fields?.[f.key]?.trim()
    if (!value) {
      return NextResponse.json({ error: `Missing ${f.label}` }, { status: 400 })
    }
    fields[f.key] = value
  }

  const adapter = getAdapterForProvider(provider, env)
  if (!adapter?.validateCredentials) {
    return NextResponse.json({ error: 'Provider not available' }, { status: 400 })
  }

  try {
    const identity = await adapter.validateCredentials(fields)
    const db = env.DB as D1Database
    await upsertConnection(db, {
      trade_account_id: access.tradeAccountId,
      provider,
      external_account_id: identity.externalAccountId,
      external_location_id: identity.externalLocationId,
      access_token: JSON.stringify(fields),
      refresh_token: null,
      token_expires_at: null,
      scopes: null,
      auth_mode: 'api-key',
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Credentials were rejected by the provider' }, { status: 422 })
  }
}
```

Check the actual rate-limit helper name/signature in `src/lib/pouriq/` before using (`grep -rn "isRateLimited" src/lib/pouriq`) and match it — the variance route uses it (`src/app/api/pouriq/menus/[menuId]/variance/route.ts:86`).

- [ ] **Step 2: Extend `upsertConnection` for auth_mode**

In `src/lib/pouriq/pos/connections.ts`, add `auth_mode?: 'oauth' | 'api-key'` to `NewConnection`, add the column to the INSERT (`auth_mode` with value `?9`, defaulting `'oauth'` when not supplied) and to the `DO UPDATE SET` list (`auth_mode = excluded.auth_mode`).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/pouriq/integrations/[provider]/connect-key" src/lib/pouriq/pos/connections.ts
git commit -m "feat(pouriq): connect-key route for api-key providers"
```

### Task 4: IntegrationCard credential form + page wiring

**Files:**
- Modify: `src/components/pouriq/IntegrationCard.tsx`
- Modify: `src/app/trade/pouriq/settings/integrations/page.tsx`

- [ ] **Step 1: Credential-form variant**

In `IntegrationCard.tsx`:
1. Import the field type: `import { PROVIDER_CREDENTIAL_FIELDS } from '@/lib/pouriq/pos/types'`.
2. Inside the component, before `return`: `const credentialFields = PROVIDER_CREDENTIAL_FIELDS[provider]` and `const [credentials, setCredentials] = useState<Record<string, string>>({})`.
3. Add a connect-key submit handler:
```ts
  function connectWithKey() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/integrations/${provider}/connect-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: credentials }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setError(err.error ?? 'Could not connect')
        return
      }
      router.refresh()
    })
  }
```
4. In the JSX, replace the not-connected branch (`<button ... onClick={connect}>`) with:
```tsx
        ) : credentialFields ? (
          <form
            onSubmit={(e) => { e.preventDefault(); connectWithKey() }}
            className="w-full space-y-3"
          >
            {credentialFields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`${provider}-${f.key}`} className="block text-xs font-medium text-parchment-300 mb-1">
                  {f.label}
                </label>
                <input
                  id={`${provider}-${f.key}`}
                  type={f.secret ? 'password' : 'text'}
                  autoComplete="off"
                  value={credentials[f.key] ?? ''}
                  onChange={(e) => setCredentials((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
                />
              </div>
            ))}
            <button type="submit" disabled={disabled || pending} className={PRIMARY_BUTTON}>
              {pending ? 'Connecting…' : `Connect ${title}`}
            </button>
          </form>
        ) : (
          <button type="button" onClick={connect} disabled={disabled || pending} className={PRIMARY_BUTTON}>
            Connect {title}
          </button>
        )}
```

- [ ] **Step 2: Type-check, lint, build**

Run: `npx tsc --noEmit && npx eslint src/components/pouriq && npm run build 2>&1 | tail -3`
Expected: all clean. (The form renders for no provider yet — `PROVIDER_CREDENTIAL_FIELDS` is empty — so the integrations page is visually unchanged.)

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/IntegrationCard.tsx
git commit -m "feat(pouriq): credential-form variant of IntegrationCard for api-key providers"
```

### Task 5: PR 1

- [ ] **Step 1:** `npm run test:unit` — expected pass.
- [ ] **Step 2:** Push and open the PR:

```bash
git push -u origin feat/pouriq-auth-mode
gh pr create --title "feat(pouriq): api-key auth mode groundwork for partner-API providers" --body "..."
```
PR body must note: migration 0030 to apply at deploy; behaviour-neutral for existing Square connections (default 'oauth'); Tevalis plugs in by declaring credential fields + adapter.

---

## PR 2 — Zettle adapter (branch `feat/pouriq-zettle-integration`, rebased on PR 1)

### Task 6: Zettle adapter + registry entries

**Files:**
- Create: `src/lib/pouriq/pos/providers/zettle.ts`
- Modify: `src/lib/pouriq/pos/providers/index.ts`
- Modify: `cloudflare-env.d.ts`

- [ ] **Step 1: Adapter**

```ts
import type { PosAdapter, PosOrderLine } from '../types'

const OAUTH_BASE = 'https://oauth.zettle.com'
const PURCHASE_BASE = 'https://purchase.izettle.com'

export interface ZettleEnv {
  ZETTLE_CLIENT_ID: string
  ZETTLE_CLIENT_SECRET: string
}

interface ZettlePurchase {
  purchaseUUID: string
  timestamp: string
  refund?: boolean
  products?: Array<{
    name?: string
    variantName?: string
    quantity?: string
    unitPrice?: number
  }>
}

function toExpiryIso(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

export function createZettleAdapter(env: ZettleEnv): PosAdapter {
  async function tokenRequest(body: URLSearchParams) {
    const res = await fetch(`${OAUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) throw new Error(`Zettle token ${res.status}`)
    return await res.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }
  }

  return {
    provider: 'zettle',
    authMode: 'oauth',

    async exchangeCodeForToken(code, redirectUri) {
      const data = await tokenRequest(new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: env.ZETTLE_CLIENT_ID,
        client_secret: env.ZETTLE_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }))
      // Resolve the organisation for external_account_id.
      const meRes = await fetch(`${OAUTH_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      if (!meRes.ok) throw new Error(`Zettle users/me ${meRes.status}`)
      const me = await meRes.json() as { organizationUuid?: string; uuid?: string }
      const externalAccountId = me.organizationUuid ?? me.uuid
      if (!externalAccountId) throw new Error('Zettle users/me returned no organisation id')
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt: toExpiryIso(data.expires_in),
        scopes: 'READ:PURCHASE',
        externalAccountId,
        externalLocationId: null,
      }
    },

    async refreshAccessToken(refreshToken) {
      const data = await tokenRequest(new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: env.ZETTLE_CLIENT_ID,
        client_secret: env.ZETTLE_CLIENT_SECRET,
        refresh_token: refreshToken,
      }))
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt: toExpiryIso(data.expires_in),
      }
    },

    async fetchOrdersSince(connection, since) {
      const lines: PosOrderLine[] = []
      let lastPurchaseHash: string | undefined
      do {
        const params = new URLSearchParams({
          startDate: since.toISOString(),
          descending: 'false',
          limit: '200',
        })
        if (lastPurchaseHash) params.set('lastPurchaseHash', lastPurchaseHash)
        const res = await fetch(`${PURCHASE_BASE}/purchases/v2?${params.toString()}`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
        })
        if (!res.ok) throw new Error(`Zettle purchases ${res.status}`)
        const data = await res.json() as {
          purchases?: ZettlePurchase[]
          lastPurchaseHash?: string
        }
        const purchases = data.purchases ?? []
        for (const purchase of purchases) {
          if (purchase.refund) continue
          for (const product of purchase.products ?? []) {
            if (!product.name) continue
            const quantity = parseFloat(product.quantity ?? '1') || 1
            const variant = product.variantName?.trim()
            lines.push({
              external_order_id: purchase.purchaseUUID,
              external_item_id: null,
              name: variant && variant.toLowerCase() !== 'regular' ? `${product.name} ${variant}` : product.name,
              quantity,
              sold_at: purchase.timestamp,
              gross_amount_p: Math.round((product.unitPrice ?? 0) * quantity),
            })
          }
        }
        lastPurchaseHash = purchases.length > 0 ? data.lastPurchaseHash : undefined
      } while (lastPurchaseHash)
      return lines
    },

    // No webhooks in v1 — hourly cron polling only. Zettle push
    // subscriptions are a documented fast-follow.
    async verifyWebhook() {
      return false
    },
    parseWebhookPayload() {
      return []
    },
  }
}
```

- [ ] **Step 2: Registry entries**

In `src/lib/pouriq/pos/providers/index.ts` add to `getAdapterForProvider`:

```ts
    case 'zettle':
      if (!env.ZETTLE_CLIENT_ID || !env.ZETTLE_CLIENT_SECRET) return null
      return createZettleAdapter({
        ZETTLE_CLIENT_ID: env.ZETTLE_CLIENT_ID,
        ZETTLE_CLIENT_SECRET: env.ZETTLE_CLIENT_SECRET,
      })
```
and to `getOAuthAuthorizeUrl`:
```ts
    case 'zettle': {
      if (!env.ZETTLE_CLIENT_ID) return null
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.ZETTLE_CLIENT_ID,
        scope: 'READ:PURCHASE',
        state,
        redirect_uri: redirectUri,
      })
      return `https://oauth.zettle.com/authorize?${params.toString()}`
    }
```
with `import { createZettleAdapter } from './zettle'`.

- [ ] **Step 3: Env typing**

In `cloudflare-env.d.ts` after the SQUARE block (lines 46-49):
```ts
  ZETTLE_CLIENT_ID: string;
  ZETTLE_CLIENT_SECRET: string;
```
Also add both to `.dev.vars` locally with placeholder values (NOT committed — confirm `.dev.vars` is gitignored first) and note in the PR that `wrangler secret put` is needed for both (see memory `feedback_wrangler_versions_secrets.md` for the Versions-mode gotcha).

- [ ] **Step 4: Type-check, commit**

Run: `npx tsc --noEmit`

```bash
git add src/lib/pouriq/pos/providers cloudflare-env.d.ts
git commit -m "feat(pouriq): Zettle adapter — OAuth, purchase polling, registry entries"
```

### Task 7: Generic OAuth start/callback routes

**Files:**
- Create: `src/app/api/pouriq/integrations/[provider]/oauth/start/route.ts`
- Create: `src/app/api/pouriq/integrations/[provider]/oauth/callback/route.ts`

Square's static `/square/oauth/*` routes shadow these for `provider=square`, so Square's registered redirect URI keeps working untouched. The generic callback is registered with Zettle as `https://jerrycanspirits.co.uk/api/pouriq/integrations/zettle/oauth/callback`.

- [ ] **Step 1: Start route** — mirror the Square start route but provider-generic:

```ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { createOAuthState } from '@/lib/pouriq/pos/connections'
import { getOAuthAuthorizeUrl } from '@/lib/pouriq/pos/providers'
import { isKnownProvider } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function GET(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.redirect(new URL('/trade/login', request.url))
  }
  const { provider } = await params
  if (!isKnownProvider(provider)) {
    return NextResponse.redirect(new URL('/trade/pouriq/settings/integrations?error=missing_params', request.url))
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const state = await createOAuthState(db, access.tradeAccountId, provider)
  const redirectUri = new URL(`/api/pouriq/integrations/${provider}/oauth/callback`, request.url).toString()
  const authorizeUrl = getOAuthAuthorizeUrl(provider, env, state, redirectUri)
  if (!authorizeUrl) {
    return NextResponse.redirect(new URL('/trade/pouriq/settings/integrations?error=missing_params', request.url))
  }
  return NextResponse.redirect(authorizeUrl)
}
```

- [ ] **Step 2: Callback route** — read the existing Square callback (`src/app/api/pouriq/integrations/square/oauth/callback/route.ts`) first and mirror its structure exactly (state consumption via `consumeOAuthState`, error redirects with the same `?error=` codes the integrations page already maps, upsert, redirect to `?connected=<provider>`), with these generalisations: provider comes from the route param and must equal the provider stored in the consumed state row; the adapter comes from `getAdapterForProvider`; `exchangeCodeForToken` is called through the optional-method guard (`if (!adapter?.exchangeCodeForToken) → ?error=missing_params`); upsert passes `auth_mode: 'oauth'`.

- [ ] **Step 3: Zettle tile on the integrations page**

In `src/app/trade/pouriq/settings/integrations/page.tsx`, insert after the Square card:

```tsx
          <IntegrationCard
            provider="zettle"
            title="Zettle by PayPal"
            description="Free POS used by thousands of UK independents. Sales import hourly once connected."
            connection={byProvider.get('zettle') ?? null}
            menus={menuOptions}
          />
```

- [ ] **Step 4: Verify, commit**

Run: `npx tsc --noEmit && npx next lint && npm run build 2>&1 | tail -3`

```bash
git add "src/app/api/pouriq/integrations/[provider]/oauth" src/app/trade/pouriq/settings/integrations/page.tsx
git commit -m "feat(pouriq): generic OAuth routes and Zettle integration tile"
```

### Task 8: PR 2 + deferred sandbox verification

- [ ] **Step 1:** `npm run test:unit` — expected pass.
- [ ] **Step 2:** Push, open PR. Body must include: depends on PR 1 (merge order); secrets `ZETTLE_CLIENT_ID`/`ZETTLE_CLIENT_SECRET` via `wrangler secret put` before the tile can connect; redirect URI to register in the Zettle developer dashboard; end-to-end sandbox test deferred until Dan creates the Zettle developer account (the tile fails gracefully — `getAdapterForProvider` returns null → "Provider not available" — until secrets exist).
- [ ] **Step 3:** Record in the venue-tech-intel memory: Zettle shipped pending sandbox verification; SumUp spike still gated on account creation.
