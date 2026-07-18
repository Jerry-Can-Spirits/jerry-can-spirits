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
Sessions follow the baseline: `crypto.randomUUID()` sid in KV, 30-day TTL, `httpOnly`/`secure`/`lax` cookie (`src/lib/trade-portal/session.ts`), re-validated against D1 `active = 1` per request. Login (`src/app/api/trade/login/route.ts`) layers four rate-limit controls, all checked before PIN verification and (except the coarse request cap) incremented on genuine failure only, so a valid PIN never counts against a venue: a per-IP request cap (60/hour), a **venue-safe** per-IP failure ceiling (20 / 15 min — bars share one NAT'd wifi IP, so it tolerates staff mistypes without locking the venue out), a per-credential counter (10 / hour, keyed by a PIN hash, never the raw PIN), and a **global failed-login velocity** counter (100 / 10 min across all IPs and PINs) which is the primary bound on *distributed* enumeration of the PIN space — the per-IP and per-PIN counters are both defeated by spreading guesses, so this single counter is what closes that gap. Ceilings and the global counter's sizing are documented in `src/lib/kv.ts`. Origin allowlist checked.

PINs are stored hashed (`src/lib/trade-portal/credentials.ts`): HMAC-SHA-256 with the `PIN_PEPPER` Wrangler secret — so a database dump alone cannot be brute-forced, which matters more than the stretch for a low-entropy PIN — then PBKDF2-SHA-256 (100k iterations — the Workers WebCrypto maximum, discovered live; per-row iteration counts allow raising it if the cap ever lifts — constant-time compare). A deterministic peppered HMAC in `pin_lookup` gives login an O(1) SELECT. Format `pin:v1:` is versioned; `pw:v1:` is reserved for the planned owner username/password model. Migration is self-healing: the hourly cron sweep hashes plaintext rows, and login upgrades any straggler on first contact. PBKDF2 rather than Argon2 is a deliberate Workers trade-off (no WASM dependency, native speed); the pepper carries the DB-dump defence, and the versioned format allows a `pin:v2` upgrade if that judgement changes.

The trade portal is a **transitional** surface — it retires when distributor sales begin, so its hardening is scoped to that horizon rather than gold-plated. A **six-digit minimum PIN** is the deliberate long-term floor (six, not higher, trades brute-force headroom against bar-tablet usability; the global velocity counter carries the enumeration defence), enforced at login (`pin.length < 6`) since 2026-07-19. Its enforcement was staged behind a one-off reissue: a PIN's length is unrecoverable once hashed, so every live account was reissued a known ≥6-digit PIN (both active accounts — The Bank Bar & Grill and the demo venue — reissued and re-hashed 2026-07-19) before the floor was raised, so no venue is locked out. **Turnstile-after-N-failures** is a considered-and-deferred follow-up, not an oversight: the CSP is already Turnstile-ready and the friction would land only on someone already failing repeatedly, so it is defence-in-depth rather than urgent. The `pending/` upload R2 lifecycle expiry is already in place (see Data).

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
- **Trade-portal login rate limiting / PIN brute-force hardening** — reference: this repo (`src/lib/kv.ts` counters + the `src/app/api/trade/login/route.ts` flow: per-IP request cap, venue-safe failures-only per-IP ceiling, per-credential counter, and the global failed-login velocity bound). The pour-iq portal carries the byte-identical reconciled version. Reconciled 2026-07-18 — folding brute-force alongside hashing so the whole auth surface has one owner and cannot drift again (this repo owns both).
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

Resolved 2026-07-18 (trade-portal auth hardening, reconciled with the pour-iq portal — this repo is now the reference for the whole auth surface):
- **#5 PIN brute-force** — added a global failed-login velocity counter (the primary bound on distributed enumeration; per-IP and per-PIN counters are both defeated by spreading guesses across IPs and PIN values), and fixed the per-IP failure counter to increment on genuine failure only with a venue-safe ceiling. It previously incremented *before* verify, a live self-DoS that locked a whole venue out after a few mistypes on shared wifi. The per-PIN counter is unchanged but its misleading "account-level" comment is corrected: it bounds one credential, not enumeration. The six-digit PIN floor is the paired policy change, shipped 2026-07-19 after both live accounts were reissued to ≥6-digit PINs (see Auth).
- **#6 Trade checkout** — `src/app/api/trade/checkout/route.ts` now rate-limits `createCart` per account and validates every `variantId` against the trade catalogue (`getTradeVariantIdSet`), so an authenticated account can no longer build a cart from arbitrary Shopify variants.
- **#9 Loaded gun** — deleted `getTradeAccountByPin` (a plaintext-PIN equality lookup that bypassed the hash scheme; confirmed unreferenced in live code) and removed the unused `read-excel-file` dependency.

Resolved 2026-07-13: the disclosure contact mismatch — `security.txt` now names `security@jerrycanspirits.co.uk`, matching `/security-policy`; that address is canonical across both repos.
