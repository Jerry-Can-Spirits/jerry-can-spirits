# Pour IQ SumUp Adapter — Design (addendum to 2026-06-12 integration expansion)

**Date:** 2026-06-15
**Status:** Approved (spike passed)
**Parent spec:** `docs/superpowers/specs/2026-06-12-pouriq-integration-expansion-design.md`

## Spike result (2026-06-15)

PASS. SumUp's transaction-detail resource carries a `products[]` array; each product has `name`, `quantity`, `price`, `total_price` and VAT fields (confirmed from the SumUp API reference). That is full itemised sales data — same shape Pour IQ already ingests from Square and Zettle. SumUp is build-worthy.

## Architecture

A third POS adapter on the existing pattern. The `'sumup'` provider value, auth-mode interface, provider registry, generic OAuth routes, dedup table, and integrations UI all already exist (PRs #744/#745, and the generic OAuth routes from #746). This adds one adapter file, two registry cases, two env vars, and one UI tile.

`authMode: 'oauth'` — production Pour IQ connects venues' own accounts, so this uses the OAuth client (not the first-party API key seen during the spike).

## The one real difference from Zettle: two-call fetch

SumUp has no single "list purchases with line items" endpoint. `fetchOrdersSince` therefore does:

1. **List** completed transactions in the window: `GET https://api.sumup.com/v2.1/merchants/{merchant_code}/transactions/history` with a date filter, paginating via the response's `links` (a `next` href). The list returns summaries only — id, transaction_code, status, timestamp — no products.
2. **Hydrate** each `SUCCESSFUL` transaction: `GET https://api.sumup.com/v2.1/merchants/{merchant_code}/transactions?id={id}` to read its `products[]`.

This is N+1 calls per sync. Acceptable for v1: target venues are independents (tens of transactions per hourly window, not thousands), and the cron's overlap window keeps each run small. The seen-orders dedup (migration 0029) still prevents double-counting; it does not save the detail calls, but that is a known, documented cost, not a correctness issue. If a high-volume venue ever makes this expensive, the mitigation is to pre-filter the hydrate step against `pouriq_pos_seen_orders` — deferred until a real need appears, to keep the adapter boundary clean.

## Mapping to `PosOrderLine`

Per product in a hydrated transaction's `products[]`:
- `external_order_id` = transaction `id` (the dedup key; same order never counted twice)
- `external_item_id` = `null` (SumUp products carry no stable per-line id we need)
- `name` = product `name`
- `quantity` = product `quantity`
- `sold_at` = transaction `timestamp`
- `gross_amount_p` = `Math.round(product.total_price * 100)` — SumUp amounts are major-unit decimals (the docs show `amount: 10.1` meaning £10.10), so multiply to pence. **Verify the unit in sandbox** before announcing.

Skip any transaction whose `status` is not `SUCCESSFUL` (excludes `REFUNDED`, `FAILED`, `CANCELLED`, `PENDING`). Refunds are out of scope for v1, matching Square and Zettle.

## OAuth

- Authorize: `https://api.sumup.com/authorize` (`response_type=code`, `client_id`, `redirect_uri`, `scope=transactions.history`, `state`).
- Token: `https://api.sumup.com/token` (authorization_code + refresh_token grants). Response: `access_token`, `refresh_token`, `expires_in`, `scope`.
- Merchant code: after token exchange, `GET https://api.sumup.com/v0.1/me` returns the merchant profile; store `merchant_profile.merchant_code` as `external_account_id` (it is required in every transactions path). `external_location_id` = null. **Verify the /v0.1/me shape in sandbox.**
- Redirect URI to register: `https://jerrycanspirits.co.uk/api/pouriq/integrations/sumup/oauth/callback` (the generic `[provider]/oauth/callback` route already handles it).
- Tokens are short-lived; the cron's refresh-before-expiry logic (refreshes every run when the window is short) handles it exactly as for Zettle.
- No webhooks v1: `verifyWebhook` returns false, `parseWebhookPayload` returns `[]`. (SumUp's Pusher API is a documented fast-follow.)

## Files

- Create: `src/lib/pouriq/pos/providers/sumup.ts`
- Modify: `src/lib/pouriq/pos/providers/index.ts` — `getAdapterForProvider` + `getOAuthAuthorizeUrl` cases for `'sumup'`; add `SUMUP_CLIENT_ID`/`SUMUP_CLIENT_SECRET` to `ProvidersEnv`
- Modify: `cloudflare-env.d.ts` — `SUMUP_CLIENT_ID`, `SUMUP_CLIENT_SECRET`
- Modify: `src/app/trade/pouriq/settings/integrations/page.tsx` — SumUp tile

## Caveat

Like the Zettle PR, the exact shapes of `transactions/history` (date-filter param name, pagination `links`) and `/v0.1/me`, plus the amount unit, are from documentation. The sandbox end-to-end (connect a SumUp account, record an itemised sale, sync twice, confirm volumes land once and match) is the verification gate before announcing — small payload adjustments there are expected, not failures.

## Out of scope

SumUp Pusher webhooks, refund ingestion, the first-party API-key path, multi-location handling beyond the single merchant_code.

## Verification

`npx tsc --noEmit`, `npx next lint`, `npm run build`, `npm run test:unit`; CI green; sandbox end-to-end once `SUMUP_CLIENT_ID`/`SUMUP_CLIENT_SECRET` exist.

## Merge-order note

Independent of #746 (Zettle) but touches the same three shared files (`providers/index.ts`, `integrations/page.tsx`, `cloudflare-env.d.ts`). Whichever of #746 / this SumUp PR merges second will need a trivial rebase on those additive sections — handle at merge time.
