# Sanity 4 → 6 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`). This is a dependency migration: breakages are surfaced by the type-checker and the two builds, then fixed. Expect a fix-loop in Task 2.

**Goal:** Upgrade `sanity`/`@sanity/vision` to v6, `next-sanity` to v13, `@sanity/image-url` to v2, fixing any API breakage, without breaking the public site or the hosted Studio.

**Architecture:** One branch. Bump the four packages, then drive out breakages with `tsc` + `npx sanity build` (Studio) + `npm run build` (site), consulting the official v5/v6 migration guides for anything non-obvious. `@sanity/client` is left at its current 7.x.

**Spec:** `docs/superpowers/specs/2026-06-22-sanity-v6-upgrade-design.md`
**Branch:** `chore/sanity-v6-upgrade` (off origin/main, which now includes the hosted-Studio move #773)

---

### Task 1: Capture the baseline

**Files:** none (read-only)

- [ ] **Step 1: Record current state.** Run: `npm run test:unit` and note it passes; run `npx sanity build` and confirm it succeeds on v4 (so a later failure is attributable to the upgrade). Note current versions from `package.json`: `sanity`/`@sanity/vision` ^4.22.0, `next-sanity` ^11.6.13, `@sanity/image-url` ^1.2.0.
- [ ] **Step 2: Confirm the branch is based on post-#773 main.** Run: `grep -n "basePath" sanity.config.ts` → expect `basePath: '/'` (proves the hosted-Studio move is present; we're upgrading on top of it).

---

### Task 2: Bump the four packages and resolve breakages

**Files:** `package.json` (+ `package-lock.json`); then whatever the build/types flag — likely candidates: `src/sanity/lib/image.ts`, `sanity.config.ts`, `src/sanity/structure.ts`, `src/sanity/schemaTypes/*`.

- [ ] **Step 1: Install the new versions.** Run:
```bash
npm install sanity@^6 @sanity/vision@^6 next-sanity@^13 @sanity/image-url@^2
```
Expected: installs without peer-dependency errors. If npm reports a peer conflict, read it — do **not** use `--force`/`--legacy-peer-deps` to paper over a real incompatibility; resolve the version instead.

- [ ] **Step 2: Type-check to surface API breakages.** Run: `npx tsc --noEmit`
Fix what it flags. Known watch-point: `src/sanity/lib/image.ts` imports `SanityImageSource` from `@sanity/image-url/lib/types/types`. If v2 moved it, update the import (try `import type { SanityImageSource } from '@sanity/image-url'` first). Make the minimal change that satisfies the types; do not restructure working code.

- [ ] **Step 3: Build the Studio.** Run: `npx sanity build`
Expected: succeeds. If `defineType`/`defineField` (schemaTypes), `structureTool`/`structure` (structure.ts), or the singleton `document` hooks (sanity.config.ts) error, fix against the v5/v6 migration guides. Re-run until green.

- [ ] **Step 4: Clear stale Next types + build the site.** Run:
```bash
rm -rf .next
npx next lint
npm run build
```
Expected: lint clean; build completes; Field Manual cocktail/ingredient/equipment + Pour IQ help routes still in the output. Fix any `next-sanity` (`createClient`, `PortableText`, `PortableTextComponents`) breakage flagged. Re-run until green.

- [ ] **Step 5: Unit tests.** Run: `npm run test:unit` → expect pass (no Sanity logic under test, but confirms nothing regressed).

- [ ] **Step 6: Verify rendered Sanity output in the build.** Confirm a Field Manual page actually rendered content (not an error fallback):
```bash
grep -rl "portable\|prose\|field-manual" .next/server/app/field-manual/cocktails/*.html | head -1
```
Expected: at least one prerendered cocktail HTML file exists (proves PortableText rendered at build).

- [ ] **Step 7: Commit.**
```bash
git add -A
git commit -m "chore(sanity): upgrade to v6 (sanity/vision 6, next-sanity 13, image-url 2)"
```
(If breakage fixes touched specific files, they're included in this commit. If the fix-loop produced intermediate commits, that's fine.)

---

### Task 3: Confirm the worker still fits and nothing grew unexpectedly

**Files:** none (verification)

- [ ] **Step 1: Sanity-driven pages present.** From the Task 2 build output, confirm these routes built without error: `/field-manual/cocktails/[slug]`, `/field-manual/ingredients/[slug]`, `/field-manual/equipment/[slug]`, `/trade/pouriq/help`.
- [ ] **Step 2: No Studio leak into the worker.** Run: `grep -rl "sanity/structure\|@sanity/vision" .next/server 2>/dev/null | head` → expect **no output** (Studio packages must not be in the server bundle; the `/studio` route is gone, so a hit here means an upgrade pulled a Studio import into the app — investigate before proceeding).
- [ ] **Step 3:** No commit (verification only).

---

### Task 4: PR + handoff

- [ ] **Step 1: Push and open the PR.** Body must include:
  - Versions before/after for the four packages; `@sanity/client` unchanged.
  - Any API fixes made (e.g. image-url type import path), so review is easy.
  - **Sequencing for Dan:** after merge, run `npx sanity deploy` to push the v6 Studio to `jerrycanspirits.sanity.studio`; this clears the "not supported" warnings and makes Dashboard/Content Agent available to enable from Sanity's side. Content authoring is unaffected throughout.
  - Note: this is the deferred Sanity migration from the dependency-migrations backlog.
- [ ] **Step 2: Watch CI green** (Lint/Type/Build/Workers Build/CodeQL).
- [ ] **Step 3: After merge**, Dan runs `npx sanity deploy` and confirms the hosted Studio loads on v6, a test edit saves, images render, and the warnings are gone.
