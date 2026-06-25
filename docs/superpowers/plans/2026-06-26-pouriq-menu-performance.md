# Pour IQ Menu Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** A menu-engineering matrix + per-drink Status on the menu page, classifying each drink on popularity × profitability in plain words.

**Spec:** `docs/superpowers/specs/2026-06-26-pouriq-menu-performance-design.md`

**Gates:** `npm run test:unit` + `npx tsc --noEmit`; final `npx opennextjs-cloudflare build`.

---

### Task 1: Pure `menu-performance.ts`

**Files:** `src/lib/pouriq/menu-performance.ts` (new); `tests/unit/lib/pouriq-menu-performance.test.ts` (new).

- [ ] **Step 1:** Implement `PerfStatus`, `STATUS_LABEL`, `classifyDrinkPerformance`, `MenuPerformance`, `buildMenuPerformance` exactly as in the spec.
- [ ] **Step 2: Tests** (build minimal `CocktailMetrics` inline — the fields read are `cocktail_id`, `sale_price_p`, `gp_pct`, `cost_complete`, `volume?.units_sold`):
  - `classifyDrinkPerformance`: price 0 → 'needs-price'; `!cost_complete` → 'missing-cost'; no-sales (`hasSales:false`) → 'good-margin' (gp≥target) / 'thin-margin'; with sales → 'winner' (good+popular), 'promote' (good+slow), 'fix-margin' (thin+popular), 'review' (thin+slow).
  - `buildMenuPerformance`: all units 0 → `hasSales:false` and statuses are good/thin-margin; a set with sales → threshold `0.7 × avg`, correct quadrant partition + `statusById`.
- [ ] **Step 3:** Run `npm run test:unit -- pouriq-menu-performance` + `npx tsc --noEmit`. **Commit** `feat(pouriq): menu-performance classifier`.

---

### Task 2: `MenuMatrix` component

**Files:** `src/components/pouriq/MenuMatrix.tsx` (new). Match the existing theme.

- [ ] **Step 1:** Server component, props `{ quadrants: MenuPerformance['quadrants'] }`. Render a 2×2 grid (a 96px label column + two content columns):
  - column headers: "Popular sellers" | "Slow sellers"; row labels "Good margin" / "Thin margin".
  - top row: Winners (quadrants.winner) | Promote (quadrants.promote); bottom row: Fix the margin (quadrants.fixMargin) | Review or cut (quadrants.review).
  - each quadrant: a coloured-bordered card (green / blue / amber / red) with its label + drink-name chips (`m.name`); empty quadrant shows a muted "—".
  - below the grid, the plain-English rule line: "A popular seller sells at least 70% of what an average drink on this menu sells. Good margin is at or above your Target GP."
- [ ] **Step 2:** `npx tsc --noEmit`. **Commit** `feat(pouriq): MenuMatrix component`.

---

### Task 3: Status column + menu-page wiring

**Files:** `src/components/pouriq/CocktailTable.tsx`; `src/app/trade/pouriq/[menuId]/page.tsx`.

- [ ] **Step 1:** Read `CocktailTable.tsx`. Add a prop `statusById: Record<string, PerfStatus>` (import `PerfStatus`, `STATUS_LABEL` from `@/lib/pouriq/menu-performance`). Add a **Status** `<th>Status</th>` header and, per row, a `<td>` rendering `STATUS_LABEL[statusById[m.cocktail_id]]` (guard missing) with a colour: winner→emerald, promote→sky, fix-margin→amber, review/missing-cost/needs-price→red, good/thin-margin→parchment-muted.
- [ ] **Step 2:** `[menuId]/page.tsx`: import `buildMenuPerformance` + `MenuMatrix`. After `metrics` is computed, `const perf = buildMenuPerformance(metrics.cocktail_metrics, menu.target_gp_pct)`. In the `cocktails.length > 0` branch, before the "Drinks" `<section>`, add a "Menu performance" section: when `perf.hasSales` render `<MenuMatrix quadrants={perf.quadrants} />`, else a muted `<p>` hint ("Add this week's sales below to see your menu performance matrix."). Pass `statusById={perf.statusById}` to `<CocktailTable />`.
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`. Reason: a menu with sales shows the matrix + statuses; no-sales shows the hint + good/thin-margin statuses.
- [ ] **Step 4: Commit** `feat(pouriq): menu performance matrix + status column on the menu page`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 6 — menu-engineering matrix + per-drink Status (plain wording, grid, Winners→Review reading order); re-render of existing metrics; no migration.
