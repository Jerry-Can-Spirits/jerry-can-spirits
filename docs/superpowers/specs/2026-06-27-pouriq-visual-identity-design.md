# Pour IQ — Visual Identity ("Daylight" reskin)

Date: 2026-06-27
Status: Approved (design)

## Problem

The Pour IQ trade app inherited the Jerry Can Spirits consumer skin (dark `jerry-green` + `gold` + `parchment`, serif headings). Per the brand-identity decision ([[project_pouriq_brand_identity]]), Pour IQ should be its **own** product brand — a lighter, professional, software-first identity — with only a quiet "Built by Jerry Can Spirits" attribution. This spec defines that identity and the reskin of the trade surface. It is a styling pass only: no schema, no behaviour, no migration.

## The identity (decided with Dan, 2026-06-27, via the visual companion)

- **Theme:** light only ("Daylight"). White cards on a soft slate canvas, generous whitespace.
- **Accent:** emerald `#059669` (conveniently Tailwind `emerald-600`) — a deliberate quiet nod to the parent brand's green while staying distinct.
- **Type:** Inter for all UI, data, headings and labels. The **only** serif is the **"Pour IQ" wordmark** (Playfair Display) — the single family cue.
- **Attribution:** a quiet "Built by Jerry Can Spirits" microline under the wordmark. **No JCS logo/mark** in the app.
- **Rollout:** one cohesive pass so the app is coherent for the upcoming whole-menu E2E.

## Colour system (stock Tailwind, no custom tokens)

Pour IQ uses built-in Tailwind palettes, applied through shared className constants. The consumer site's `jerry-green`/`gold`/`parchment` tokens are **untouched** — the two brands stay separate at the token level.

| Role | Tailwind | Hex |
|---|---|---|
| Canvas (app background) | `slate-50` | `#f8fafc` |
| Surface (cards, bars) | `white` | `#ffffff` |
| Surface subtle (nested) | `slate-50` | `#f8fafc` |
| Border | `slate-200` | `#e2e8f0` |
| Border strong | `slate-300` | `#cbd5e1` |
| Ink (primary text) | `slate-900` | `#0f172a` |
| Ink secondary | `slate-700` | `#334155` |
| Muted text / labels | `slate-500` | `#64748b` |
| Faint (microcopy) | `slate-400` | `#94a3b8` |
| **Accent** | `emerald-600` | `#059669` |
| Accent strong (hover/active) | `emerald-700` | `#047857` |
| Accent soft (tint bg) | `emerald-50` | `#ecfdf5` |
| Accent ink (text on accent) | `white` | `#ffffff` |
| Success (good GP / connected) | `emerald-600` | `#059669` |
| Warning (at risk / amber band) | `amber-600` | `#d97706` |
| Danger (under target / errors) | `rose-600` | `#e11d48` |

Status/severity (variance, GP traffic-lights, menu matrix quadrants) map to success=`emerald-600`, watch=`amber-600`, bad=`rose-600`, with `-50` soft backgrounds where a fill is used. These replace the current ad-hoc `emerald-300`/`amber-300`/`red-300`/`sky-300` on dark.

## Typography

No new font loading: Inter and Playfair Display are already loaded app-wide (`src/app/layout.tsx` + `globals.css`). Pour IQ:
- Body, headings, data, labels: **Inter** (headings just heavier/tighter, e.g. `font-semibold`/`font-bold`, `tracking-tight`). The trade app stops using `font-serif` for page headings.
- **Wordmark only:** Playfair Display, via a new small `PourIqWordmark` component rendering serif "Pour IQ" plus an optional "Built by Jerry Can Spirits" subline (Inter, faint). Used in the shell header, login, and trade landing.

## Architecture

The look lives in **shared className constants**, not scattered inline strings, so the reskin is centralised and future-consistent.

- **`src/lib/pouriq/ui.ts` (new):** canonical light-theme class strings — `CANVAS`, `SURFACE`/`CARD` (+ padded variant), `BORDER`, `INPUT`, `SELECT`, `LABEL`, `SECTION_LABEL`, `HEADING`/`PAGE_TITLE`, `TABLE_WRAP`/`TABLE_HEAD`/`TABLE_ROW`, `CHIP`/`CHIP_ACTIVE`/`CHIP_IDLE`, `EMPTY_STATE`, and the status helpers (`statusText(sev)`, `statusDot(sev)`). Single source of truth for the surface language.
- **`src/lib/pouriq/button-styles.ts` (update):** repoint the existing 3-tier system to light — PRIMARY `bg-emerald-600 text-white hover:bg-emerald-700`, SECONDARY `bg-white border border-slate-300 text-slate-700 hover:border-slate-400`, DESTRUCTIVE `bg-rose-600 text-white` (+ existing SM variants). Same export names, so call sites don't churn.
- **`PourIqWordmark` (new component):** the serif wordmark + attribution lockup.
- **Components/pages** import from `ui.ts`/`button-styles.ts` and drop the inherited `bg-jerry-green-*`, `text-parchment-*`, `border-gold-*`, `text-gold-*` strings.

## Scope (one branch)

**Shell + chrome**
- `PourIqShell.tsx`: top bar and sidebar nav flipped to light (white bar, slate canvas, emerald active-state); insert `PourIqWordmark`. Recolour the "Return to trade account" exit link off destructive-red to a neutral muted treatment (folded-in audit fix).
- `src/app/trade/landing` and `src/app/trade/login`: light skin + `PourIqWordmark`; **flatten the login submit** to the standard primary button (folded-in audit fix). `LicenceGate` chrome to match.

**Canonical patterns (restyle once in `ui.ts`, then adopt)**
Card, table, chip/filter, input/select, label/section-label, page title/heading, empty state.

**Page + component sweep (skin only, layout unchanged — it is the shipped redesign)**
Every page under `src/app/trade/pouriq/**` (Today dashboard, library, menus, `[menuId]` detail + specs + menu-builder + menu-copy, variance, stock + order, invoices, settings + integrations, onboarding) and the trade components under `src/components/pouriq/**` that render in-app UI (e.g. `KpiCards`, `MenuMatrix`, `MoversReport`, `AttentionPanel`, `IngredientList`, `IngredientForm`, `IngredientMatchRow`, `Invoice*`, `VarianceEditor`, `StockManager`, `OrderReport`, `IntegrationCard`, on-screen `SpecCard`/`MenuBuilder` chrome).

## Out of scope (deliberately)

- The consumer marketing site and its tokens (untouched).
- White-label of customer **outputs** (venue logo/colour/font on spec cards + menus) — roadmap and a pricing lever ([[project_pouriq_pricing_positioning]]).
- Dark mode (later add if customers ask).
- The structural whole-menu features (menu sections, per-category GP, non-ml stock) — separate roadmap items.
- Print-fidelity bugs (order-report `print-region`, matrix quadrant print colours) — separate small fix; this pass must at least not regress the existing `.print-region` white-print behaviour.

## Verification

- No DB, no migration, no behaviour change.
- Per-area visual review against this spec (local dev / the visual companion) — the layout must be unchanged, only the skin.
- `npx tsc --noEmit` clean; `npm run build` passes.
- Spot-check: status colours remain distinguishable (emerald/amber/rose); the menu matrix quadrants read clearly; `.print-region` pages still print on white.
- Regression watch: any component still showing dark `jerry-green`/`parchment` after the sweep (grep `jerry-green|parchment|text-gold|gold-500` under `src/app/trade/pouriq`, `src/app/trade/landing`, `src/app/trade/login`, `src/components/pouriq` should return effectively nothing once done).

## Sequencing (for the plan)

Cohesive pass, internally ordered to minimise breakage:
1. `ui.ts` constants + `button-styles.ts` repoint + `PourIqWordmark`.
2. `PourIqShell` + landing + login (the chrome every page sits in).
3. Sweep pages/components onto the constants, area by area, verifying as you go.
4. Final grep sweep for stray dark-theme classes; `tsc` + `build`; visual pass.
