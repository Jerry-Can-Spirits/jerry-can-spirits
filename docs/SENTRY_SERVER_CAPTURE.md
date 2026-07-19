# Sentry server-side error capture — design spec

Status: **proposed** (investigation complete, not yet implemented).
Date: 2026-07-20.

## Problem

Server-side error capture does not work on this stack. Over 30 days the Sentry
project (`javascript-nextjs`) shows **only browser errors** — zero server events
— despite ~10 explicit `Sentry.captureException`/`captureMessage` call sites in
server routes that demonstrably fail (seven in `trade-application` alone: R2
move, R2 presign, D1 rollback, Resend). Every one of those is a silent no-op.

Those are exactly the failures the code audit flagged as causing orphaned
records and lost customer data — and Sentry has been swallowing all of them.

### Evidence (three independent lines)

1. **The codebase documents its own failure.** `sentry.edge.config.ts:3-6`:
   *"instrumentation.ts only loaded the Node config for NEXT_RUNTIME === 'nodejs',
   meaning API routes running on the Cloudflare Workers edge runtime were
   silently dropping captures."* Someone diagnosed a drop, added the edge config
   as a partial fix — and it was itself dead code, because this app's routes use
   D1/KV bindings (nodejs runtime), so `NEXT_RUNTIME === 'edge'` is never true
   for them. This is the false-security-docs pattern (a comment describing a
   control that does not work) appearing again.
2. **30 days, zero server events, ~10 explicit capture sites.** If the server
   client worked, these would be in Sentry. None are.
3. **Architecturally it cannot work.** `@sentry/nextjs`'s server SDK is
   `@sentry/node`: OpenTelemetry-based, instrumenting Node internals
   (`async_hooks`, `http`, plus Redis/Postgres/MySQL/amqplib/mongo/prisma
   integrations — all confirmed in the tree). workerd does not provide that
   machinery even with `nodejs_compat`. This is precisely why Sentry ships a
   separate `@sentry/cloudflare` for Workers.

**Where it is lost:** `instrumentation.ts`'s `register()` only inits Sentry for
`NEXT_RUNTIME === 'nodejs'`/`'edge'`. On OpenNext the app runs on workerd
emulating the nodejs runtime, so the `@sentry/node` config loads and cannot
initialise its OTel pipeline on workerd — `captureException` then has no
functioning client and no-ops.

## What is verified (not assumed)

- **Client SDK works.** The 124 `beTracker` events, the browser-extension noise,
  and every other browser issue reviewed on the dashboard **arrived** in Sentry.
  The client SDK captures and transports — proven by those events existing. Its
  ~183 KB is therefore justified (it does its job; the noise-filtering trim is a
  separate item). This spec does not touch the client SDK.
- **Server SDK does not work.** Zero events; see above. The asymmetry (same DSN,
  same project, browser present / server absent) is itself the proof.

## Decision: a manual fetch-based capture helper

**Recommendation: a small `fetch`-based helper that POSTs to the Sentry ingest
API**, not `@sentry/cloudflare`.

The value we want from Sentry is: *know when a server route fails, with a stack
trace and enough context to reproduce.* A `fetch` POST to the ingest envelope
endpoint delivers exactly that, runs natively on workerd, costs near-zero
bundle, and has **no dependency on an SDK's internals continuing to behave on a
runtime it does not primarily target.** We already have ten explicit capture
sites; the helper slots straight in behind them.

Given this project's runtime-parity history — PBKDF2, the `src/middleware.ts`
location trap, nonce propagation, and now this — the version with the fewest
moving parts against workerd is the safer bet.

## Bundle math

| Piece | Now | After |
|---|---|---|
| Server `@sentry/node` (OTel + Redis/PG/MySQL/amqp/mongo/prisma) | **~279 KB gzip, catches nothing** | **removed** |
| Manual helper (`src/lib/server-error-capture.ts`) | — | ~1–2 KB |
| Client `@sentry/nextjs` (works) | ~183 KB | unchanged |

**Net: −~277 KB off the Worker bundle, and server capture goes from broken to
working.** The 279 KB is currently pure cold-start + deploy cost for zero
benefit; those DB/queue integrations would be useless on workerd even if it ran
(the app uses D1/KV bindings, not Redis/PG/AMQP).

## Design

### The helper — `src/lib/server-error-capture.ts`

`captureServerError(error, context?)`:
- Derives the ingest URL from the DSN
  (`https://<key>@o<org>.ingest.<region>.sentry.io/<project>` →
  `https://o<org>.ingest.<region>.sentry.io/api/<project>/envelope/`), with the
  `X-Sentry-Auth` header (`sentry_key=<key>`).
- Builds a minimal Sentry **event envelope**: `exception` (type, value,
  stacktrace frames), `level`, `platform: 'node'`, `environment`, `release`,
  `server_name`, `timestamp`, plus `tags`/`extra` from `context`.
- **Reuses the existing PII/secret scrub** (the `emailRegex`/`secretRegex` from
  `sentry.server.config.ts`'s `beforeSend`) on message and exception values.
- **Fire-and-forget and never throws** — wrapped in `try/catch`, not awaited on
  the hot path (or via `ctx.waitUntil` where a Cloudflare context is available),
  so capturing an error can never fail or delay the route. This mirrors the
  discipline already used for the GA4 Measurement Protocol send.
- Reads the DSN and environment from env, not hard-coded.

Stack traces reference minified worker code; server-side source-map upload is an
open question (see Risks) but stack + route + tags is usually enough to
reproduce.

### Wiring

1. **`onRequestError` (instrumentation.ts) → `captureServerError`.** *This is the
   most important change.* The existing explicit calls only cover failures we
   already thought of; `onRequestError` (Next 15's hook for uncaught server
   errors) is what catches the failures **nobody anticipated** — it turns this
   from "logging the errors we listed" into actual error monitoring. Confirm
   OpenNext invokes the hook on this stack as part of the preview test.
2. **Replace the existing explicit sites** — `Sentry.captureException(err, {tags})`
   / `captureMessage` in `/api/checkout` (×2), `/api/meta/events` (×2),
   `/api/trade-application` (×7), the Shopify webhook route — with
   `captureServerError(err, { tags })`. Same call shape, working transport.
3. **Delete `sentry.server.config.ts` and `sentry.edge.config.ts`** and the
   server branch of `register()` — the `@sentry/node` init is what pulls the
   279 KB, and it does nothing useful here.
4. **Stop `withSentryConfig` instrumenting the server**, so `@sentry/node` is
   dropped from the Worker bundle, while keeping it for client source-map upload
   and the client SDK. Likely via `autoInstrumentServerFunctions: false` (+
   removing the server configs); **must be verified by bundle analysis**, not
   assumed (see Risks).

## Migration sequence

Each step is independently verifiable; preview deploys only, never main.

1. Write `captureServerError` + a preview-only throwaway route that throws. Deploy
   to a preview; **confirm the error arrives in the Sentry dashboard** (the exact
   test that proved the current setup broken). Confirm `onRequestError` fires for
   an *unhandled* throw, not just an explicit call.
2. Wire `onRequestError` → helper; re-test the unhandled-throw path.
3. Swap the ~10 explicit sites to the helper; spot-check one (e.g. force a
   trade-application R2 failure on preview) reaches Sentry.
4. Remove the server/edge configs + server `register()` branch.
5. Drop server instrumentation from `withSentryConfig`; run `ANALYZE=true` and
   confirm `@sentry/node` (the 279 KB, the Redis/PG/etc. integrations) is gone
   from the Worker bundle.
6. Merge. Post-deploy: confirm a real server failure (or a one-off throwaway
   throw on production behind a guard) lands in Sentry.

## Alternative considered: `@sentry/cloudflare` (and why not)

The dedicated Workers SDK: fetch-based transport, no OTel/Node deps, wired into
`cloudflare-worker-entry.mjs` via its handler wrapper / the documented OpenNext
integration. It would also fix capture and drop `@sentry/node`.

**Not chosen because** it buys auto-instrumentation we do not especially need
(we already call `capture` explicitly where it matters, and `onRequestError`
covers the rest) in exchange for: a new dependency, Worker-entry wiring, and a
documented-but-fiddly combination of `@sentry/cloudflare` **with**
`@sentry/nextjs` (kept for the client) that is a candidate to break on either
package's next major. Against this project's runtime-parity track record, the
manual helper's smaller surface is the safer trade. `@sentry/cloudflare` remains
the fallback if we later want distributed tracing or richer auto-context.

## Risks / open questions

- **Can `withSentryConfig` keep client instrumentation while fully dropping
  server `@sentry/node`?** The 279 KB removal depends on this. Verify with
  `ANALYZE=true` after applying `autoInstrumentServerFunctions: false` / removing
  the server configs; if `@sentry/node` persists, investigate
  `disableServerWebpackPlugin` or dropping `withSentryConfig`'s server side
  entirely and keeping only client source-map upload.
- **Server-side source maps.** The helper's stack traces point at minified
  worker code. Acceptable initially (stack + route + tags reproduces most
  issues); a follow-up could upload worker source maps or symbolicate.
- **`onRequestError` on OpenNext.** Confirm the hook is actually invoked by the
  OpenNext server on workerd (step 1) — it is the linchpin of real coverage; if
  it is not invoked, fall back to a shared route wrapper.
