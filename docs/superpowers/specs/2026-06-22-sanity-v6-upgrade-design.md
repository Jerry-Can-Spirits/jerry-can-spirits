# Sanity 4 → 6 Upgrade — Design

**Date:** 2026-06-22
**Status:** Approved

## Problem

The project runs `sanity` / `@sanity/vision` 4.22.0, `next-sanity` 11.6.13, `@sanity/image-url` 1.2.0. The now-hosted Studio shows "Studio is not fully compatible with Dashboard" / "Content Agent is not supported" — newer Sanity tooling requires a current Sanity version. Goal: get current so those tools become available (enabled later from Sanity's side), and clear the warnings. Latest `sanity` is **6.1.0** (the `7.x` seen earlier was the separately-versioned `@sanity/cli`, not the Studio package).

## Decisions (from brainstorming)

- **Version upgrade only** — no wiring of Content Agent / Dashboard in this work (separate, later; Content Agent is a paid AI feature).
- **Direct to latest** (4 → 6 in one branch), not incremental, relying on a strong verification surface.

## Scope

One coordinated bump (single `package.json`):
- `sanity` 4.22 → ^6 (latest 6.1.0)
- `@sanity/vision` 4.22 → ^6 (must match `sanity` major)
- `next-sanity` 11.6 → ^13 (latest 13.1.1; peer supports sanity ^5.29 || ^6)
- `@sanity/image-url` 1.2 → ^2 (latest 2.1.1)
- `@sanity/client` — unchanged (already 7.13.2, compatible)

## Risk surfaces

### Public site (live; low risk, high stakes — verify hard)
Uses only stable Sanity APIs:
- `src/sanity/lib/client.ts` — `createClient` from `next-sanity`.
- `PortableText`, `PortableTextBlock`, `PortableTextComponents` from `next-sanity` — rendered by `FieldManualPortableText.tsx`, `HelpPortableText.tsx`, `CocktailRecipeDisplay.tsx`.
- `src/sanity/lib/image.ts` — `@sanity/image-url` `createImageUrlBuilder(...).image(src).auto('format')`, used by Field Manual ingredient/equipment pages; plus `sanityOgUrl` (string manipulation, version-independent).
- GROQ via `client.fetch` in the Field Manual + Pour IQ help pages.

**Concrete watch-points:**
- `@sanity/image-url` v2 may move the `SanityImageSource` type import path (currently `@sanity/image-url/lib/types/types` in `image.ts`). Adjust to the v2 path if the build flags it.
- `next-sanity` 13 default exports / visual-editing (stega) defaults — `client.ts` already sets `stega: false`; keep PortableText behaviour unchanged.

### Studio (decoupled / hosted; lower stakes)
- `sanity.config.ts` (singleton `document` hooks, `structureTool`, `visionTool`, basePath `/`), `src/sanity/structure.ts`, `src/sanity/schemaTypes/*` (`defineType` / `defineField`).
- Verified by `npx sanity build` + loading the hosted Studio. Any breakage is fixed before `sanity deploy`; the live site is unaffected by Studio issues.

## Process

One branch:
1. Bump the four packages; `npm install`.
2. Resolve type/build breakages — consult the official Sanity v5 and v6 migration guides for anything non-obvious rather than guessing.
3. Gate: `npx tsc --noEmit`, `npx next lint`, `npx sanity build`, `npm run build`, `npm run test:unit`.
4. May take a couple of fix iterations; the type-checker + both builds surface the breaks.

## Sequencing

- The site PR merges normally; CI's Build + Workers Build is the gate.
- After merge, **Dan runs `npx sanity deploy`** to push the v6 Studio to `jerrycanspirits.sanity.studio`, which clears the compatibility/Content-Agent warnings and makes the new tools available.
- Content authoring remains unaffected throughout.

## Verification

- All five gate commands pass (above).
- Build output: Field Manual cocktail/ingredient/equipment pages and Pour IQ help still prerender; no Sanity import/type errors.
- Manual after deploy (Dan): hosted Studio loads on v6, a test edit saves and appears on the site, images render, the previous "not supported" warnings are gone.
- `@sanity/client` query behaviour unchanged (no version change).

## Out of scope

- Wiring Content Agent / Dashboard.
- `@sanity/client` bump (already current).
- Schema shape changes; any content migration.

## No migration

No D1 / content migration. Package versions + any required API adjustments only.
