# Move Sanity Studio to Sanity Hosting — Design

**Date:** 2026-06-22
**Status:** Approved

## Problem

The Sanity Studio is embedded in the Next app at `/studio/[[...tool]]`, so its UI and the entire Studio dependency subtree (`sanity`, `sanity/structure`, `@sanity/vision`) compile into the production Cloudflare worker — ~1.74 MB for that route alone, against a 10 MB worker limit the bundle is approaching (~7 MB). The Studio is an internal editing tool; it does not need to live in the customer-facing worker.

## Solution

Deploy the Studio to Sanity's hosting (`jerrycanspirits.sanity.studio`) via `sanity deploy`, and remove the embedded `/studio` route. The public site and all content are unaffected — the site reads content through `next-sanity` / the Sanity API, which is independent of where the editing UI is served.

## Decisions (from brainstorming)

- **Hosting:** Sanity-hosted (`sanity deploy`), free, zero infra. (Custom domain would require self-hosting; deferred.)
- **URL:** `jerrycanspirits.sanity.studio` (fixed `studioHost`).
- **Schema deploys:** manual `npx sanity deploy` when schema code changes (not in CI).
- **Vision:** enabled always in the hosted Studio (internal tool; the bundle reason for dev-only is gone).

## Critical reassurance: content authoring is unaffected

Adding cocktails / ingredients / equipment and editing copy on Sanity-driven pages = creating and editing **documents** in the Studio. That requires **no deploy of anything** — open the Studio, edit, save; the site's ISR picks it up exactly as today. The only change is the Studio's address. A separate `sanity deploy` is needed **only** when the **schema** changes (a code change), which is a developer step.

## Changes

### Studio config — consolidate on the root `sanity.config.ts`

- It is already the fuller config (has the `tradeHelp` singleton guard the embedded `studio-config.ts` lacks — consolidating restores that protection).
- Change `basePath` from `/studio` to `/` (a hosted Studio serves at the subdomain root).
- Enable Vision unconditionally (remove the `process.env.NODE_ENV === 'development'` gate) — `sanity build` runs in production, so the gate would otherwise strip Vision from the hosted Studio.
- Delete `src/app/studio/[[...tool]]/studio-config.ts` (drifted duplicate, no longer referenced).

### CLI — pin the deploy target

`sanity.cli.ts`: add `studioHost: 'jerrycanspirits'` so `sanity deploy` is deterministic → `jerrycanspirits.sanity.studio`.

### Remove the embedded route

Delete `src/app/studio/` entirely:
- `page.tsx`, `StudioClient.tsx`, `studio-config.ts`.

This is what drops the Studio subtree from the worker (the route was the only app importer of `sanity` / `sanity/structure` / `@sanity/vision`; the schema files are imported only by `sanity.config.ts`, which is not part of the Next app build).

### Clean up `/studio` references

- `next.config.ts`: remove the `headers()` entry for `source: '/studio/:path*'`. Add a `redirects()` entry so old bookmarks land in the right place:
  - `/studio` and `/studio/:path*` → `https://jerrycanspirits.sanity.studio` (permanent: false, basePath: false).
- `public/_headers`: remove the `/studio/*` block.
- `src/app/robots.ts`: remove `/studio/` from the disallow list (route no longer exists).

### Dependencies

Leave `sanity` and `@sanity/vision` in `package.json` — the Sanity CLI (`sanity build` / `sanity deploy`) needs them. The worker shrinkage comes from the route removal (nothing in the app imports them now), not from package moves. No churn.

## Deploy workflow

- One-time / on schema change: `npx sanity deploy` (requires `sanity login`). Deploys to `jerrycanspirits.sanity.studio`.
- CORS: no manual setup — `*.sanity.studio` is a first-party Sanity origin already trusted by the dataset.
- Editors authenticate with their existing Sanity accounts. Unchanged.
- The GitHub site pipeline is unchanged (and now builds a smaller worker). `sanity deploy` is deliberately not in CI.

## Verification

- `npm run build`: the `/studio` route is gone from the route list and the worker upload size drops (target: the ~1.74 MB Studio route removed).
- `npx tsc --noEmit`, `npx next lint`, `npm run test:unit` pass.
- Public Sanity-driven pages still render: `field-manual/cocktails/[slug]`, `ingredients/[slug]`, `equipment/[slug]`, `trade/pouriq/help` (all use `next-sanity`, untouched).
- `npx sanity build` succeeds locally (the Studio still builds from `sanity.config.ts`).
- Post-deploy (Dan, manual): `jerrycanspirits.sanity.studio` loads, login works, a test edit saves and appears on the site, singletons (`tradeHelp`) cannot be duplicated/deleted, `/studio` on the main domain redirects to the hosted URL.

## Out of scope

- Custom Studio domain (would need self-hosting).
- CI auto-deploy of the Studio (chosen: manual).
- Any change to content, schema shape, or the public site's data fetching.

## No migration

No D1 / data migration. Content lives in Sanity and is untouched.
