# Pour IQ — End-to-End Test Script

Date: 2026-06-29
Purpose: A full manual run-through of Pour IQ as it stands today, after the light "Daylight" reskin, the cost-side VAT work, the catalogue/type fixes and the print/SEO tidy. Follow it top to bottom on a **clean test venue**. Tick each step, note anything off in the Result column.

Goal: validate the product end to end and push toward Dan's north star — running a **whole venue menu** (not just cocktails). Where the non-cocktail long tail hits a **known structural gap**, the script says so (Phase 9) — note it as a known limit, not a bug.

---

## Before you start

- **Use a clean/empty test venue** (no menus, library, invoices, POS) so import + onboarding read as a first-time user. (The Bank pilot account is the realistic data set; a second populated test account exists for POS/active-menu data. PINs are not in this doc.)
- Have ready: the **Bank cocktail menu** (text or `TheBankDrinks` PDF), a **sample supplier invoice PDF** (real or mock with a few priced lines), and optionally a **POS sandbox** (Square / SumUp) for Phase 6.
- Test on **laptop AND a tablet/phone** at least for Phase 0 (the shell canvas bug was viewport-wide).
- Browser print is the export mechanism — have "Save as PDF" available.

**Legend:** ✅ pass · ⚠️ works with a niggle · ❌ broken · — not tested

---

## Phase 0 — Access, shell & the new identity (reskin regression)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 0.1 | Open `/trade/login`, sign in with the venue PIN | Light page, serif **Pour IQ** wordmark + "Built by Jerry Can Spirits", flat emerald **Sign in** button (no gold gradient) | |
| 0.2 | Land on the Today dashboard (`/trade/pouriq`) | **Whole page is light** — white header, white sidebar, **light slate canvas** behind the cards (no dark-green block). White cards, emerald accents, slate text | |
| 0.3 | Repeat 0.1–0.2 on **tablet/phone** | Same light surface; the mobile nav drawer is white; no dark-green main area | |
| 0.4 | Scan the left nav | Groups: Operate (Dashboard/Variance/Stock), Build (Menus/Ingredients/Serves/Suppliers & invoices), Connect (Integrations), Settings (Voice profile/Help). Active item = emerald | |
| 0.5 | Click "← Return to trade account" | Reads as a neutral link (slate, not red/destructive); lands on `/trade/landing` (light, with the wordmark + tiles) | |
| 0.6 | Note the "Pour IQ setup" / onboarding progress panel | Shows X of 4 (upload invoice / import menu / connect till / first stock count); items are light + legible | |
| 0.7 | Visit `/trade/pouriq/onboarding` (the quickstart) | Light (the TradeSheetShell light variant), not dark | |

---

## Phase 1 — Menu import & AI extraction (the front door)

Use the **Bank cocktail menu**. Try at least one of paste-text / PDF / spreadsheet.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.1 | Start an import (Menus → import, or the Add/Import button) and paste/upload the menu | Extraction runs (Claude), returns a preview with every drink + inferred recipe lines | |
| 1.2 | Check **compound splitting** — find a drink with "Lemon & Lime juice" / "Lime & Apple juice" | Split into two ingredient lines, not one un-matchable blob | |
| 1.3 | Check the **matcher** — lines auto-match to your library or the shared catalogue; near-misses show as suggestions, **not** silent autofill | No wrong silent fills (e.g. "Mint" must not become "Gin"); near-misses prompt you to confirm | |
| 1.4 | Check **brand↔generic** — a line like "Archers" | Resolves to / suggests Peach Schnapps (catalogue alias) | |
| 1.5 | For a **new** ingredient, adopt it: set price | Purchase model: "price you pay / how many that buys / size of each" with a live cost readout. **Inc/Ex VAT toggle** present; Inc shows a "Stored net" figure | |
| 1.6 | **Cider / alcohol-free test** — set a new line's type to `cider` or `alcohol-free` and commit | Commits without "invalid ingredient_type" (the #829 fix). The type dropdown offers the full set incl. cider/soft-drink/alcohol-free/food | |
| 1.7 | Commit the import | Drinks created on the menu; Field Manual links attached where our recipe matches | |

---

## Phase 2 — Ingredient model & costing

| # | Step | Expected | Result |
|---|------|----------|--------|
| 2.1 | Ingredients → add one manually (e.g. a spirit) | Form: category + subcategory, "How do you buy this?" (Liquid/Weight/Count/Made in-house), pack size chips, **Price paid + Inc/Ex VAT toggle** | |
| 2.2 | Enter a price **Inc VAT** (e.g. £14.40) | "Stored net: £12.00" shows; the per-ml / per-serve readout uses the **net** £12.00 | |
| 2.3 | Save, reopen the entry | Price field shows **exactly £14.40**, toggle on **Inc** (penny-exact round-trip) | |
| 2.4 | Add a **Made in-house** recipe (e.g. simple syrup = sugar + water, set a yield) | Cost derived from components; cost/ml shown; appears as a usable ingredient | |
| 2.5 | Add **serve units** to an ingredient (e.g. a 25ml shot, or wedge on a citrus) | Custom serve units save; used in recipe lines and shown on spec cards | |
| 2.6 | **Catalogue adoption** — search for one of the new AF spirits | `Clean G`, `Clean R`, `Everleaf Forest/Mountain/Marine`, `Havana Club Spiced` are findable (migration 0055). Adopt = type your price → library entry | |
| 2.7 | Advanced costing — set a yield % (e.g. 75% on a citrus) | Usable cost reflects the yield | |

---

## Phase 3 — Menu profitability & engineering

Open the imported menu's detail page.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 3.1 | Per-drink GP + the headline numbers | GP%/margin per drink; drinks with incomplete cost data flagged + excluded from the headline | |
| 3.2 | **VAT toggle** on the menu (Inc / Net) | Sale-side GP recomputes against the right base; net-of-VAT view matches the accountant's figure | |
| 3.3 | **Menu matrix** (Winners / Promote / Fix / Review) | 2×2 by popularity × margin; four quadrants visually distinct | |
| 3.4 | **Movers report** | Top / slow / dead stock by sales (where POS volumes exist) | |
| 3.5 | **Cost-change what-if** — pick an ingredient, dial a hypothetical new cost | GP shifts live across every drink using it; drinks crossing below target are flagged | |
| 3.6 | **Promotional pricing** — set a happy-hour price (or bulk % off) | Promo GP shown alongside standard | |
| 3.7 | **Spec cards** — open the specs view | Per-drink card: name, price, glass, garnish, ingredients, **Directions**, "Tell the customer". **Print** button works (legible on white) | |
| 3.8 | **Menu builder** — open it | Customer-menu preview is a **white "paper" card with dark legible text** (not invisible). Toggle columns / prices / descriptions; "Save as PDF" prints cleanly | |
| 3.9 | **Menu copy export** | Plain-text / markdown of names + prices + descriptions; copy/download works | |

---

## Phase 4 — Invoicing & cost ripple

| # | Step | Expected | Result |
|---|------|----------|--------|
| 4.1 | Suppliers & invoices → scan a supplier PDF | Lines extracted (net), grouped: needs-attention / price-changes / auto-matched | |
| 4.2 | The per-invoice **inc/ex VAT toggle** (default **Ex/net**) | Default Ex = unchanged behaviour. Flip to **Inc**: the Δ column compares net-to-net; price-change routing reflects net | |
| 4.3 | Apply lines + commit | Library prices update (stored **net**), invoice + cost-change rows written; new cider/AF lines accepted | |
| 4.4 | Land on the cost-change **impact / ripple** page | Before/after GP across every affected drink; drinks newly below target flagged | |
| 4.5 | Invoice ledger + open one + **Download PDF** | Ledger lists it; detail page renders light; PDF downloads | |
| 4.6 | **Delete** an invoice | Receipts/lines/invoice removed; cost-change audit kept; applied prices NOT rolled back (by design) | |

---

## Phase 5 — Variance, stock & reorder

| # | Step | Expected | Result |
|---|------|----------|--------|
| 5.1 | Stock → enter counts for a few ingredients (rolling, timestamped) | Counts save | |
| 5.2 | Variance view | Theoretical (POS × recipe) vs actual (count delta + receipts + production); ml/%/£; within-tolerance shows nothing scary; amber/red bands; persistent-loss flag on repeated directional loss | |
| 5.3 | **Variance reason codes** | Over-pour / spillage / comps / breakage / theft selectable on a variance row | |
| 5.4 | **Par levels** — set a par on an ingredient | Saves; low-stock flag where on-hand < par | |
| 5.5 | **Reorder report** (`/trade/pouriq/stock/order`) | Order qty = ceil(par − on-hand); table is printable and **legible in print** (print-region fix) | |
| 5.6 | **Make a batch** (production) on a prepared ingredient | Yield tops up the prepared ingredient's stock; components consumed | |

---

## Phase 6 — POS / integrations (optional, needs a sandbox)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 6.1 | Connect → Integrations; connect **Square** (or SumUp/Zettle) via OAuth | Connection completes (the auth_mode fix); no "could not complete the connection" | |
| 6.2 | Sync / wait for sales ingest | Orders pull in; per-cocktail volumes appear in movers/blended GP | |
| 6.3 | **Unmatched items** review | Map to cocktail / serve, create-serve inline, ignore; historical lines backfill | |
| 6.4 | Active menu | Exactly one active menu; sales route to it | |

---

## Phase 7 — Dashboard, attention & recommendations

| # | Step | Expected | Result |
|---|------|----------|--------|
| 7.1 | Today dashboard signals | Sales this period, menu profitability, setup progress | |
| 7.2 | **Attention** panel | Ordered: no active menu → sync errors → unmatched items → drinks needing prices → drinks under target GP. Hidden when clear | |
| 7.3 | **AI recommendations** | Streamed, plain-English suggestions grounded in your menu + the Field Manual | |

---

## Phase 8 — Print / output fidelity (spot-check)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 8.1 | Print spec cards | White page, dark text, one card per page (or 2-col compact) | |
| 8.2 | Print the menu builder (Save as PDF) | Clean customer menu, dark text on white | |
| 8.3 | Print the order report | Legible (not white-on-white) | |
| 8.4 | Print the menu report | KPIs + matrix; the four matrix quadrants stay **distinguishable** on paper | |

---

## Phase 9 — Whole-menu long tail (KNOWN LIMITS — document, don't fail)

Dan's goal is the whole Bank menu. Try adding/importing the non-cocktail lines (draught + bottled beer/cider, wines by 125/175/250/bottle, spirits neat, soft drinks incl. post-mix, hot drinks, food) and the spirits/AF list (Absolut, Beefeater, Jack Daniel's, Clean G/R, Everleaf, etc.). Expect to hit these **known structural gaps** — record where, but they are roadmap items, not bugs:

- **No menu sections / item types** — beers, wines, spirits, soft drinks, food all collapse into one flat "cocktails" list.
- **Single GP target per menu** — food (~65%) and drinks (~75%) share one target, so matrix/balance/attention skew for mixed menus.
- **Cross-type threshold pollution** — a high-volume beer inflates the popularity threshold and can bury cocktails in the matrix/movers.
- **Post-mix / bag-in-box not modelled**; **kegs not first-class** (freehand ml; pint relies on a manual serve unit).
- **Unit-count ingredients excluded from variance**; **par/stock is ml-only** — bottled beer/cans get no variance or reorder.
- **No ABV, no allergens/dietary** — the menu's `40% VE,GF` / `0%` tags aren't captured anywhere yet.

Note for each: did it import/cost at all, and which limit you hit. This list is the input to the next phase of build (menu sections + per-category GP + non-ml stock + allergen/dietary), which is what turns "cocktail E2E" into "whole-menu E2E".

---

## Regression focus (recent merges — check these specifically)

- **Reskin:** every Pour IQ page is light end-to-end on laptop AND tablet/phone (the shell-canvas fix). No stray dark-green panels.
- **VAT basis:** an Inc £14.40 ingredient and an Ex £12.00 ingredient yield the **same** pour cost / GP; re-edit is penny-exact.
- **Cider / alcohol-free import** commits without "invalid ingredient_type".
- **Catalogue 0055** — the AF spirits/aperitifs + Havana Club Spiced are findable (only if migration 0055 was applied to prod).
- **Print fixes** — order report, the menu-report sales-volume heading, matrix quadrants.

---

## Summary for the run

- Phases 1–8 should pass on the **cocktail** path end to end.
- Phase 9 documents the whole-menu limits (expected).
- Log every ⚠️/❌ with the phase number; that becomes the next fix/build list.

---

## Appendix A — Time-to-value measurement (the metric that sells it)

The single biggest objection to onboarding software is "how long until it's set up." Capture timings during this run — this is the data that decides whether the initial phase is sellable. Target framing for the pitch: a real venue should reach a **fully costed menu in well under an hour**, not a day.

| Metric | How to capture | Target | Actual |
|---|---|---|---|
| **Total onboarding** | Stopwatch from blank venue → first menu with GP on every drink | < 45–60 min | |
| Extract time **per PDF** (×4) | Time each upload→preview | < ~60s each | |
| Whole-menu extract total | Sum of the 4 | | |
| **Auto-match hit rate** | (auto-matched + catalogue-matched) ÷ total ingredient lines | higher = faster | |
| Ingredients needing **manual creation** | Count the new entries you had to price | lower = faster | |
| Avg **time per drink** to resolve/price | total review time ÷ drinks | | |
| Invoice scan (Phase 4) | upload → committed | < ~2 min | |
| First **stock count** for N ingredients | time to enter | | |

Note any specific time sinks (slow scroll to find unresolved lines, re-entering the same price, fiddly pack sizes). Those are the onboarding-speed backlog. The higher the catalogue auto-match rate, the less manual entry — so **every missing brand/generic you log below is also onboarding-time saved for the next venue.**

---

## Appendix B — Brand / generic gap log

As you import all 4 PDFs, log every line the catalogue did NOT cover (had to create manually). This feeds the next catalogue migration.

| Product (as on the menu) | Type | Should map to (generic) | In catalogue? |
|---|---|---|---|
| | | | |

---

## Appendix C — Test supplier invoice (for Phase 4)

Use the prompt Claude gave you to render this as a PDF, then scan it in Phase 4. It is built to exercise the full matcher + every pack format + the cider/AF commit path + catalogue 0055 items. Net (ex-VAT) line prices; 20% VAT summary at the foot (so the per-invoice toggle defaults to **Ex/net** correctly). The lines deliberately mix: catalogue auto-matches, brand↔generic, 0055/0053 additions, cider + alcohol-free, and awkward formats (keg / BIB post-mix / 2L / small bottle / case / weight / count / food).

(The full line list lives in the ChatGPT prompt Claude supplied; reproduce it here once finalised so the test invoice is repeatable.)
