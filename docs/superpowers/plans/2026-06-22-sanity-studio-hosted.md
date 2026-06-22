# Sanity Studio → Hosted Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Remove the embedded `/studio` route so the Studio dependency subtree leaves the production worker; the Studio is deployed to `jerrycanspirits.sanity.studio` via `sanity deploy`.

**Architecture:** Consolidate on the root `sanity.config.ts` (basePath `/`, Vision on), pin `studioHost`, delete `src/app/studio/`, and clean the `/studio` CSP/headers/robots references plus add a redirect for old bookmarks. No data migration; content unaffected.

**Spec:** `docs/superpowers/specs/2026-06-22-sanity-studio-hosted-design.md`
**Branch:** `feat/sanity-studio-hosted` (off origin/main)

---

### Task 1: Studio config for hosting

**Files:** Modify `sanity.config.ts`, `sanity.cli.ts`

- [ ] **Step 1: basePath + Vision in `sanity.config.ts`.** Change `basePath: '/studio'` to `basePath: '/'`. Replace the dev-gated Vision line with an unconditional one:

```ts
  plugins: [
    structureTool({structure}),
    visionTool({defaultApiVersion: apiVersion}),
  ],
```
(Removes the `...(process.env.NODE_ENV === 'development' ? [...] : [])` wrapper — `sanity build` runs in production, so the gate would strip Vision from the hosted Studio. Schema, singleton `document` hooks, projectId/dataset stay unchanged.)

- [ ] **Step 2: Pin the host in `sanity.cli.ts`.** Add `studioHost` so `sanity deploy` is deterministic:

```ts
export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'jerrycanspirits',
})
```

- [ ] **Step 3: Confirm the Studio still builds.** Run: `npx sanity build`
Expected: builds successfully into `dist/` (the hosted Studio bundle). This proves the consolidated config is valid before we remove the embedded route. (Do not commit `dist/`; it is build output.)

- [ ] **Step 4: Commit.**
```bash
git add sanity.config.ts sanity.cli.ts
git commit -m "feat(sanity): hosted-studio config (basePath /, Vision on, pinned studioHost)"
```

---

### Task 2: Remove the embedded route + clean references

**Files:** Delete `src/app/studio/` (recursive); Modify `next.config.ts`, `public/_headers`, `src/app/robots.ts`

- [ ] **Step 1: Delete the embedded Studio route.**
```bash
git rm -r "src/app/studio"
```
(Removes `page.tsx`, `StudioClient.tsx`, `studio-config.ts` — the only app importers of `sanity` / `sanity/structure` / `@sanity/vision`.)

- [ ] **Step 2: Remove the `/studio` headers block in `next.config.ts`.** Delete the entire trailing entry in the `headers()` return array — the object beginning with the comment `// Security headers for Sanity Studio (permissive CSP — must come AFTER /:path* to override it)` and its `{ source: '/studio/:path*', headers: [...] }` object (the block ending `},` immediately before the `]` that closes the headers array). After removal, the headers array's last entry is the one ending in the `Cross-Origin-Opener-Policy` block that precedes it.

- [ ] **Step 3: Add the redirect in `next.config.ts`.** Inside the existing `async redirects() { return [ ... ] }` array, add two entries at the top of the array:

```ts
      // Sanity Studio moved to Sanity hosting. Send old bookmarks there.
      {
        source: '/studio',
        destination: 'https://jerrycanspirits.sanity.studio',
        permanent: false,
        basePath: false,
      },
      {
        source: '/studio/:path*',
        destination: 'https://jerrycanspirits.sanity.studio',
        permanent: false,
        basePath: false,
      },
```

- [ ] **Step 4: Remove the `/studio/*` block from `public/_headers`.** Delete the block starting with the comment `# Less restrictive CSP for Sanity Studio` and the `/studio/*` rule through its final `Strict-Transport-Security` line (the whole indented header set for that path).

- [ ] **Step 5: Drop `/studio/` from robots disallow in `src/app/robots.ts`.** Change:
```ts
  const disallow = ['/studio/', '/api/', '/refer/', '/search']
```
to:
```ts
  const disallow = ['/api/', '/refer/', '/search']
```

- [ ] **Step 6: Commit.**
```bash
git add -A
git commit -m "feat(sanity): remove embedded /studio route, redirect to hosted Studio"
```

---

### Task 3: Verify the worker shrinks and nothing else broke

- [ ] **Step 1: Clear stale route types.** Run: `rm -rf .next`
(The build cache holds generated types for the deleted route; clearing avoids false `tsc` errors referencing the removed `/studio` path — a failure mode hit before when deleting routes.)

- [ ] **Step 2: Type-check + lint.** Run: `npx tsc --noEmit && npx next lint`
Expected: clean.

- [ ] **Step 3: Build and confirm the route is gone + size dropped.** Run: `npm run build`
Expected: completes; the route list **no longer contains** `/studio/[[...tool]]` (previously ~1.74 MB / 1.93 MB First Load JS); the worker upload total is smaller than before.

- [ ] **Step 4: Confirm public Sanity-driven pages still prerender.** In the build output, verify these still build without error: `/field-manual/cocktails/[slug]`, `/field-manual/ingredients/[slug]`, `/field-manual/equipment/[slug]`, `/trade/pouriq/help`. (They use `next-sanity`, untouched.)

- [ ] **Step 5: Unit tests.** Run: `npm run test:unit`
Expected: pass (no logic changed).

- [ ] **Step 6: Commit** (only if Step 1–5 produced fixes; otherwise nothing to commit).

---

### Task 4: PR + handoff

- [ ] **Step 1: Push and open the PR.** Body must include:
  - What/why: Studio moved to Sanity hosting; embedded route removed; worker bundle reclaimed.
  - **Sequencing for Dan:** the hosted Studio must be stood up with `npx sanity deploy` (requires `sanity login`). It can be deployed from this branch (or main) at any time since it builds from `sanity.config.ts` independently — running `sanity deploy` *before* merging avoids any window where neither `/studio` nor the hosted Studio is reachable. After merge + site deploy, `/studio` on the main domain redirects to `jerrycanspirits.sanity.studio`.
  - Content authoring is unaffected; only schema changes need a future `sanity deploy`.
  - No migration.

- [ ] **Step 2: Watch CI green.**

- [ ] **Step 3:** Report the before/after worker size from the build output so the reclaimed headroom is on record.
