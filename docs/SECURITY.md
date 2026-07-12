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
Sessions follow the baseline: `crypto.randomUUID()` sid in KV, 30-day TTL, `httpOnly`/`secure`/`lax` cookie (`src/lib/trade-portal/session.ts`), re-validated against D1 `active = 1` per request. Login (`src/app/api/trade/login/route.ts`) is rate-limited per-IP (10/hour) and per-PIN, with an origin allowlist check. **PINs are stored and compared in plaintext** in `trade_accounts.pin` — the standing violation of baseline §4.

### Third parties and consent
Google Consent Mode v2 defaults everything to denied before any tag; Cookiebot loads in auto-blocking mode; GA4/Ads, Klaviyo, Trustpilot, Sentry Replay, and AdSense are all individually consent-gated in their components. This is the reference implementation of baseline §5.

### Disclosure
`public/.well-known/security.txt` (expires 2026-12-31) plus a comprehensive `/security-policy` page (SLAs, scope, Computer Misuse Act 1990 safe harbor). Known defect: security.txt says `hello@jerrycanspirits.co.uk`, the policy page says `security@jerrycanspirits.co.uk`.

### Dependencies
Dependabot (npm weekly + github-actions, grouped, reviewers set). CI runs lint + typecheck and a secrets-injected build with a summary gate, then purges Cloudflare cache post-push. No audit/SAST step. Node pinning conflicts: `.nvmrc` says 24.8.0 (CI uses this), `.node-version` says 22.13.0.

### Data
Customer PII and payments live in Shopify (headless checkout). D1 holds batch/bottle tracking, expedition log, referrals, trade accounts and applications; R2 `jerry-can-spirits-trade-docs` holds application documents with lifecycle rules (`pending/` 24h, `applications/` 30 days). The Pour IQ dataset (migrations 0015–0069) is migrating out to the `pour-iq` repo. No tenant export endpoint or automated retention sweep here.

---

## Gaps (follow-up PR candidates, in rough priority order)

1. **Hash trade PINs** (shared with pour-iq — same ported code). Store a salted hash, compare in constant time; migrate existing rows on first successful login or by reissue.
2. **Encrypt OAuth/integration tokens at rest** — port `token-crypto.ts` (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) from the pour-iq portal; QuickBooks tokens in D1 predate that hardening.
3. **Fix the disclosure contact mismatch** — pick one address for security.txt and `/security-policy`.
4. **Resolve Node pinning** — delete `.node-version` or align it with `.nvmrc`.
5. **Retention and export for trade data** — the pour-iq portal's `retention.ts` sweep and export endpoint have no counterpart here.
6. **Stale docs** — `docs/DEPENDENCIES_STATUS.md` (Nov 2025: wrong Node version, says Cloudflare Pages/`next-on-pages`, wrong CSP location) should be corrected or retired; the `public/_headers` comment claiming CSP comes from middleware is false and should be fixed alongside `docs/CSP_AUDIT.md`'s next review.
7. **Consider** a `pnpm/npm audit` or CodeQL step in CI, and explicit data-residency pinning on D1/R2 as the pour-iq portal does (WEUR).
