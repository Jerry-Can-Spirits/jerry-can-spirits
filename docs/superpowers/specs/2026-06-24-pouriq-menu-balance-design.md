# Pour IQ — Menu balance (menu-engineering matrix)

**Date:** 2026-06-24
**Status:** Design approved (decisions locked with Dan)
**Origin:** Competitor scan (mypouriq.com) flagged a menu-engineering matrix as the top pick. Re-cast in our own plain, measured language rather than the textbook "stars / plough-horses / puzzles / dogs" jargon.

## Goal
On a menu, group each drink by **margin** (GP%) against **popularity** (units sold) so the bar can see, at a glance, what to feature, re-cost, promote, or review. Read-only, per-menu, uses data already loaded on the menu page. No new tables, API, or POS work.

## Decisions (locked)
- **Labels (descriptive, with a one-line action each):**
  - **Strong sellers** — high margin, popular → "Keep them front and centre."
  - **Popular, low margin** — popular, below-target margin → "Re-cost or nudge the price."
  - **High margin, low sales** — at/above target margin, not popular → "Give them more visibility."
  - **Underperformers** — below-target margin, not popular → "Review or drop."
- **Thresholds: target GP% + 70% fair-share.**
  - Margin split = the menu's `target_gp_pct`; if it is null/0, fall back to the average GP% of the costed drinks.
  - Popularity split = `0.7 × (total units ÷ number of costed drinks)` (fair-share rule; avoids one big seller skewing an average). A drink is "popular" when its units ≥ this threshold.
- **Margin axis = GP%** (consistent with the rest of Pour IQ).
- **Placement:** a "Menu balance" section on the menu detail page (`/trade/pouriq/[menuId]`), per-menu, for the period already loaded on that page.
- **Layout (v1):** four labelled groups, each listing its drinks with GP% and units sold, plus the action line. (No scatter chart in v1; a visual quadrant could come later.)

## Data (already on the menu page)
`src/app/trade/pouriq/[menuId]/page.tsx` already loads:
- `cocktails` (`listCocktailsForMenu`)
- `volumes` (`listVolumesForPeriod`) for the current period
- `metrics = calculateMenuMetrics(cocktails, prices_include_vat, volumes)` — per-drink `gp_pct`, `cost_complete`, `sale_price_p`, and the `costed` set / `avg_gp_pct`.
- `menu.target_gp_pct`.

So classification needs no new query: feed per-drink `{ name, gp_pct, units, cost_complete, sale_price_p }` + `target_gp_pct` into a pure function.

## Classification (pure function)
`classifyMenuBalance(drinks, { targetGpPct, avgGpPct })` where each `drink = { id, name, gp_pct, units, included }`:
- **Included drinks only**: a drink is included when it is cost-complete AND `sale_price_p > 0` (same rule as the GP headline). Serves never appear (they live on a different menu, not in this menu's cocktails). Excluded drinks are reported separately as an "incomplete" count, not placed in a quadrant.
- `marginThreshold = targetGpPct && targetGpPct > 0 ? targetGpPct : avgGpPct`.
- `totalUnits = Σ units` over included drinks; `fairShare = includedCount > 0 ? totalUnits / includedCount : 0`; `popularityThreshold = 0.7 × fairShare`.
- For each included drink: `highMargin = gp_pct >= marginThreshold`; `popular = units >= popularityThreshold`.
  - highMargin && popular → `strong`
  - !highMargin && popular → `popular-low-margin`
  - highMargin && !popular → `high-margin-low-sales`
  - !highMargin && !popular → `underperformers`
- Returns `{ groups: { strong: Drink[], 'popular-low-margin': Drink[], 'high-margin-low-sales': Drink[], underperformers: Drink[] }, marginThreshold, popularityThreshold, totalUnits, includedCount, incompleteCount }`.

## Empty / edge states
- **No sales data** (`totalUnits === 0`): do not render quadrants (every drink would be "popular" at threshold 0, which is meaningless). Instead show a prompt: "Add sales data (sync your POS or enter volumes) to see your menu balance." with a link to the volumes/integrations area.
- **No costed drinks** (`includedCount === 0`): show "Add costs and prices to your drinks to see your menu balance."
- Each group renders only if it has drinks; empty groups show a thin "nothing here" line or are omitted (omit for cleanliness).

## Files
- `src/lib/pouriq/menu-balance.ts` — the pure `classifyMenuBalance` function + `MenuBalanceDrink`, `MenuBalanceGroupKey`, `MenuBalanceResult` types, and a `MENU_BALANCE_LABELS` map (key → `{ title, action }`). Pure, no DB.
- `tests/unit/lib/pouriq-menu-balance.test.ts` — classification + threshold + edge-case tests.
- `src/components/pouriq/MenuBalance.tsx` — server component (no interactivity) rendering the four groups (title + action + drink rows with GP% and units), the threshold note ("measured against your target GP of X% and N+ sales"), the incomplete-count note, and the empty states. Tailwind, brand-calm copy (no em-dashes/emojis/exclamation marks).
- `src/app/trade/pouriq/[menuId]/page.tsx` — build the `MenuBalanceDrink[]` from `metrics` + a `units` lookup from `volumes`, and render `<MenuBalance ... />` in a new "Menu balance" section (near the GP metrics / variance section). `no-print` is fine (it is an internal analysis aid).

## Out of scope
Scatter/quadrant chart visual; cash-margin (£) axis option; cross-menu/whole-bar view; trend over periods; acting on the recommendation (auto-reprice). All future.

## Success criteria
- A drink below target GP that sells well shows under "Popular, low margin" with the re-cost action; a high-GP slow mover shows under "High margin, low sales"; etc.
- No serves appear. Cost-incomplete/zero-price drinks are excluded and surfaced as a count, not silently dropped.
- With no sales data, the section prompts for sales data instead of showing a misleading matrix.
