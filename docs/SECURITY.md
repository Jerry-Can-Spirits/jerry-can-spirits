# Security baseline

The security standard shared by the Jerry Can Spirits Ltd repos (`jerry-can-spirits` and `pour-iq`). The baseline section is near-identical in both repos; the sections after it state where **this repo** stands against it, with file references, and end with the known gaps. Docs only — each gap ships as its own PR.

Audited: 2026-07-13.

---

## The baseline (applies to all new work)

1. **HTTP headers.** Every response carries HSTS (with preload), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a Permissions-Policy denying what the app does not use, and a CSP. Framing is denied by default (`frame-ancestors 'none'` and/or `X-Frame-Options: DENY`) with narrow, documented per-route exceptions.
2. **CSP.** `default-src 'self'`; `object-src 'none'`; `base-uri 'self'`. Third-party hosts are allowlisted individually, never wildcarded. `'unsafe-eval'` in development only, never production. `'unsafe-inline'` only as a documented, dated acceptance.
3. **Secrets.** Real secrets live in Wrangler secrets (or CI secrets), never in source, never in `.env` files that could be committed. `.env*`, `.dev.vars`, and `.wrangler/` are gitignored. Public client identifiers (analytics IDs, widget tokens) may live in source but are commented as deliberately public.
4. **Auth and sessions.** Sessions are opaque random IDs in KV with a TTL, delivered as `httpOnly`, `secure`, `sameSite` cookies, and re-validated against the datastore on every request. Login endpoints are rate-limited per-IP and per-credential and check request origin. Credentials are stored hashed, never plaintext (currently unmet — see gaps).
5. **Third parties.** No third-party script loads without consent gating where consent law applies. Consent defaults to denied before any tag runs. Every third-party addition updates the CSP allowlist and the consent gating in the same PR.
6. **Disclosure.** A `.well-known/security.txt` with an unexpired `Expires`, pointing at a published security policy page with response SLAs and safe harbor. The contact address in both must match.
7. **Dependencies.** Dependabot on every package manifest in the repo (including sub-projects), grouped minor/patch updates, and CI that lints, typechecks, and builds every project the repo contains on every PR.
8. **Data.** Every datastore states what it holds, its region, and its retention. Tenant/business data has an export path and an automated retention sweep implementing the published privacy policy. Documents in R2 carry lifecycle rules.

---

## Where this repo stands

### Headers and CSP
The single source of truth is `next.config.ts` (`buildCsp()`, lines ~13–152) — middleware headers are unreliable on the Cloudflare Edge runtime, and `middleware.ts` deliberately sets no security headers (it handles bot detection and geo cookies only). The CSP is hash-based, not nonce-based, because nonce propagation fails on OpenNext + Workers. Full third-party allowlist (Cookiebot, GTM/GA, Klaviyo, Sentry, Trustpilot, Facebook, Google Ads/AdSense, Metricool, Cloudflare, Ahrefs, Turnstile); `script-src` accepts `'unsafe-inline'` (documented acceptance); `'unsafe-eval'` dev-only. Per-route exceptions: `/qr/*` may be framed by `info.qr.jerrycanspirits.co.uk`; `/api/pouriq/invoices/*` allows `frame-ancestors 'self'`. HSTS preload, Permissions-Policy, and COOP are all set. `public/_headers` is a backup for static files only and does not carry the CSP.

### Secrets
Clean sweep — no private secrets in source. Deliberately public identifiers (GA4/Ads IDs, Klaviyo company ID, Cookiebot CBID, Trustpilot business unit id and widget tokens, AdSense publisher ID) live in components. Real secrets via Wrangler secrets and gitignored `.dev.vars`; CI injects `NEXT_PUBLIC_*` build values from GitHub secrets. Note `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` in `.env.example` must stay stable across Worker versions.

### Auth (trade portal)
Sessions follow the baseline: `crypto.randomUUID()` sid in KV, 30-day TTL, `httpOnly`/`secure`/`lax` cookie (`src/lib/trade-portal/session.ts`), re-validated against D1 `active = 1` per request. Login (`src/app/api/trade/login/route.ts`) is rate-limited per-IP (10/hour) and per-PIN (keyed by a hash, never the raw PIN), with an origin allowlist check.

PINs are stored hashed (`src/lib/trade-portal/credentials.ts`): HMAC-SHA-256 with the `PIN_PEPPER` Wrangler secret — so a database dump alone cannot be brute-forced, which matters more than the stretch for a low-entropy PIN — then PBKDF2-SHA-256 (600k iterations, WebCrypto-native, constant-time compare). A deterministic peppered HMAC in `pin_lookup` gives login an O(1) SELECT. Format `pin:v1:` is versioned; `pw:v1:` is reserved for the planned owner username/password model. Migration is self-healing: the hourly cron sweep hashes plaintext rows, and login upgrades any straggler on first contact. PBKDF2 rather than Argon2 is a deliberate Workers trade-off (no WASM dependency, native speed); the pepper carries the DB-dump defence, and the versioned format allows a `pin:v2` upgrade if that judgement changes.

### Third parties and consent
Google Consent Mode v2 defaults everything to denied before any tag; Cookiebot loads in auto-blocking mode; GA4/Ads, Klaviyo, Trustpilot, Sentry Replay, and AdSense are all individually consent-gated in their components. This is the reference implementation of baseline §5.

### Disclosure
`public/.well-known/security.txt` (expires 2026-12-31) plus a comprehensive `/security-policy` page (SLAs, scope, Computer Misuse Act 1990 safe harbor). Known defect: security.txt says `hello@jerrycanspirits.co.uk`, the policy page says `security@jerrycanspirits.co.uk`.

### Dependencies
Dependabot (npm weekly + github-actions, grouped, reviewers set). CI runs lint + typecheck and a secrets-injected build with a summary gate, then purges Cloudflare cache post-push. No audit/SAST step. Node pinning conflicts: `.nvmrc` says 24.8.0 (CI uses this), `.node-version` says 22.13.0.

### Data
Customer PII and payments live in Shopify (headless checkout). D1 holds batch/bottle tracking, expedition log, referrals, trade accounts and applications; R2 `jerry-can-spirits-trade-docs` holds application documents with lifecycle rules (`pending/` 24h, `applications/` 30 days). The Pour IQ dataset (migrations 0015–0069) is migrating out to the `pour-iq` repo. No tenant export endpoint or automated retention sweep here.

---

## Reference implementations

Each shared control names the repo whose implementation is canonical, so fixes port rather than get reinvented and the repos cannot drift back apart. When a control ships its first implementation, name it here and in the pour-iq copy of this file in the same PR.

- **Token encryption at rest** — reference: the pour-iq portal (`portal/src/lib/pouriq/token-crypto.ts`). This repo ports it.
- **Credential (PIN) hashing** — reference: this repo (`src/lib/trade-portal/credentials.ts`, peppered HMAC + PBKDF2 with `pin_lookup` login column). The pour-iq portal carries a byte-identical copy.
- **Consent gating of third parties** — reference: this repo (Cookiebot + Consent Mode v2, per-component gating).
- **Vulnerability disclosure** — reference: this repo (`security.txt` + `/security-policy`). Canonical contact: `security@jerrycanspirits.co.uk`.
- **Data retention, export, and residency** — reference: the pour-iq portal (`retention.ts`, the export endpoint, WEUR pinning).

---

## Gaps (in rough priority order)

1. ~~**Hash trade PINs**~~ — shipped 2026-07-13 (see Auth above). Requires the `PIN_PEPPER` secret set on the Worker and migration 0070 applied; until the secret exists the code runs dark on the legacy plaintext path.
2. **Encrypt OAuth/integration tokens at rest** — port `token-crypto.ts` (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) from the pour-iq portal; QuickBooks tokens in D1 predate that hardening. The port must include a one-off backfill of existing rows: the pour-iq implementation encrypts on write only, so existing plaintext rows survive until rewritten — verified against its code, and pour-iq owes itself the same backfill check.
3. **Resolve Node pinning** — delete `.node-version` or align it with `.nvmrc`.
4. **Retention and export for trade data** — the pour-iq portal's `retention.ts` sweep and export endpoint have no counterpart here.
5. **Stale docs** — `docs/DEPENDENCIES_STATUS.md` (Nov 2025: wrong Node version, says Cloudflare Pages/`next-on-pages`, wrong CSP location) should be corrected or retired; the `public/_headers` comment claiming CSP comes from middleware is false and should be fixed alongside `docs/CSP_AUDIT.md`'s next review.
6. **Consider** a `pnpm/npm audit` or CodeQL step in CI, and explicit data-residency pinning on D1/R2 as the pour-iq portal does (WEUR).

Resolved 2026-07-13: the disclosure contact mismatch — `security.txt` now names `security@jerrycanspirits.co.uk`, matching `/security-policy`; that address is canonical across both repos.
