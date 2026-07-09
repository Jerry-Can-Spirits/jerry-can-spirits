# Pour IQ — End-to-End Test Script

Date: 2026-07-07
Supersedes: `pouriq-e2e-test-script-2026-06-29.md` (most of that script's "Phase 9 known limits" are now shipped features — menu sections, per-category GP, fresh-produce stock, ABV, allergens — and accounting integrations are new).

Purpose: A full manual run-through of Pour IQ as a **bar owner** would use it, top to bottom on a **clean test venue**, to confirm it does everything we claim. This is now a **whole-venue menu** run (cocktails, beer, cider, wine, spirits, soft drinks, food), not cocktail-only. Tick each step, note anything off in the Result column. Every `⚠️`/`❌` becomes the amendment list.

**Legend:** ✅ pass · ⚠️ works with a niggle · ❌ broken · — not tested

---

## Before you start

- **Use a clean/empty test venue** (no menus, library, invoices, POS, accounting) so onboarding + import read as a first-time user.
- Have ready:
  - A **whole-venue menu** (text or PDF) — ideally a real bar menu with cocktails AND beer/wine/spirits/soft drinks/food, so item types and sections get exercised.
  - A **sample supplier invoice PDF** (real or the Appendix C mock) with a mix of pack formats and a few priced lines.
  - **Accounting test targets** (Phase 6): a **Xero Demo Company set to United Kingdom**, and a **QuickBooks GB sandbox company** (realm-linked to your Intuit developer account). Both give safe, resettable, UK-VAT data.
  - Optionally a **POS sandbox** (Square / SumUp / Zettle) for Phase 8.
- Test on **laptop AND a tablet/phone** at least for Phase 0.
- Browser print ("Save as PDF") is the export mechanism.
- **Time yourself** where Appendix A asks — time-to-value is the metric that sells onboarding.

**Two nav items have no sidebar link** (by design — verify you can still reach them):
- **Compare menus** — only via "Compare menus →" on the Menus list page.
- **Unmatched sales** — only via the amber banner on the Integrations page when POS items are unmatched.

---

## Phase 0 — Access, shell & identity

| # | Step | Expected | Result |
|---|------|----------|--------|
| 0.1 | Open `/trade/login`, sign in with the venue PIN | Light page, serif **Pour IQ** wordmark + "Built by Jerry Can Spirits", flat emerald **Sign in** button | |
| 0.2 | Land on the Today dashboard (`/trade/pouriq`) | Whole page light: white header, white sidebar, light slate canvas. White cards, emerald accents | |
| 0.3 | Repeat on **tablet/phone** | Same light surface; mobile nav drawer white; no dark-green main area | |
| 0.4 | Scan the left nav | **Operate** (Dashboard / Variance / Stock) · **Build** (Menus / Ingredients / Serves / Suppliers & invoices) · **Connect** (Integrations) · **Settings** (Voice profile / Help). Active item emerald | |
| 0.5 | Header top-right | "Add import menu" action button present; venue name shown | |
| 0.6 | The dashboard **setup checklist** | Shows the onboarding steps (upload invoice / import menu / connect till / first stock count); legible | |
| 0.7 | "← Return to trade account" (bottom of nav) | Neutral slate link; lands on `/trade/landing` | |
| 0.8 | Visit `/trade/pouriq/onboarding` | Light static quickstart; loads (not licence-gated, not dark) | |

---

## Phase 1 — Whole-menu import & AI extraction (the front door)

Create a menu (`/trade/pouriq/new`: name, venue type, city, **target GP**, **VAT mode**), then import. Use your whole-venue menu. Try at least one of paste-text / PDF / spreadsheet (`/trade/pouriq/[menuId]/import`).

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.1 | Pick a source: **Paste menu text** / **Upload a PDF** / **Upload spreadsheet**; provide the menu; **Extract drinks →** | "Reading menu…" then a preview with every line + inferred recipe lines | |
| 1.2 | Read the sticky stats bar | "[N] drinks · [N] auto-matched · [N] new library entries · [N] need a choice"; **Jump to next unresolved →** works | |
| 1.3 | **Truncation check** (long menu) | If extraction was cut off, an amber banner warns "extraction may be incomplete — check the last drinks". (New this cycle.) | |
| 1.4 | **Compound splitting** — a line like "Lemon & Lime juice" | Splits into two ingredient lines, not one blob | |
| 1.5 | **Matcher quality** — lines auto-match to library/catalogue; near-misses are suggestions, not silent autofill | No wrong silent fills ("Mint" must not become "Gin") | |
| 1.6 | **Brand↔generic** — a line like "Archers" | Resolves to / suggests Peach Schnapps | |
| 1.7 | **Bulk-fill propagation** — resolve ONE ingredient row (pick library / create new) | The same ingredient auto-fills across every other drink using it (price + match), but per-drink **pour amounts stay untouched** | |
| 1.8 | **Non-cocktail lines** — confirm beer / wine / spirit / soft drink / food lines import | They come in as drinks; you'll set their **Drink type** (Phase 3.x / editor) to beer/wine/spirit/soft-drink/food | |
| 1.9 | **New ingredient adopt** — set a new line's price | "price you pay / how many packs / size per pack" with live cost readout; **Inc/Ex VAT** toggle; Inc shows "Stored net" | |
| 1.10 | **Cider / alcohol-free** — set a new line's type to cider or alcohol-free and commit | Commits without "invalid ingredient_type"; type dropdown offers the full 13-type set | |
| 1.11 | **Import [N] drink(s)** (only enabled once all resolved) | Drinks created on the menu; Field Manual links attached where our recipe matches | |

---

## Phase 2 — Ingredient model & costing (the engine)

Ingredients (`/trade/pouriq/library`) → **Add ingredient** (`/trade/pouriq/library/new`).

| # | Step | Expected | Result |
|---|------|----------|--------|
| 2.1 | Add a spirit manually | Form: **Name**, **Category** (13 types), optional **Subcategory**, **ABV %** (appears for spirit/liqueur/wine/beer/cider) | |
| 2.2 | **Purchase model** chips | "Liquid / volume" (ml) · "Weight" (g) · "Count / each" · "Made in-house" | |
| 2.3 | Enter **Price paid Inc VAT** (e.g. £14.40) | "Stored net: £12.00" shows; per-ml / per-serve readout uses the **net** £12.00 | |
| 2.4 | Set **Packs bought** + **Volume per pack** (chips for standard sizes, or type any, e.g. 10000 for a 10L keg) + **Pack format** (Bottle/Can/Keg/Bag-in-box/Case…) | Live cost readout, e.g. "£0.021/ml · £0.52 per 25ml" | |
| 2.5 | Save, reopen | Price shows exactly £14.40 on **Inc** (penny-exact round-trip); **completeness checklist** ticks Price / Pack size / Purchase quantity | |
| 2.6 | **ABV** on the spirit (e.g. 40) | Saves; feeds per-drink ABV + UK units later. (Change type to a non-alcoholic one → ABV field hides; note the stored value persists silently.) | |
| 2.7 | **Advanced costing → Yield %** (e.g. 75 on a citrus) | Usable cost reflects the yield | |
| 2.8 | **Serve units** — add a custom unit (e.g. 25ml shot) | Saves; usable in recipe lines and on spec cards | |
| 2.9 | **Made in-house** recipe (e.g. simple syrup = sugar + water; set yield unit + amount, then add components) | Cost derived from components; batch cost readout; appears as a usable ingredient | |
| 2.10 | **Allergens & dietary** (edit mode) — reopen an ingredient, tick Contains (14 allergens) + Vegetarian/Vegan, tick "confirmed" | Saves; Vegan auto-ticks Vegetarian; **GF is computed** (confirmed + no gluten). Note: allergens only appear in **edit** mode, not on first create | |
| 2.11 | **Cost confidence** badge on the price field | Reflects estimated / set / confirmed as expected | |
| 2.12 | **Barcode** — set/scan a barcode | Saves; note "scanning this in the cocktail editor auto-selects this ingredient" | |
| 2.13 | **Catalogue adoption** — search a known AF spirit (Clean G/R, Everleaf, Havana Club Spiced) | Findable; adopt = type your price → library entry | |

---

## Phase 3 — Fresh produce (per-item yield costing)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 3.1 | Add a new ingredient; use a **produce quick-start chip** (Lemon / Lime / Mint / Cucumber…) | Pre-fills name, base unit **each**, and stages the standard **uses** | |
| 3.2 | Save, reopen; open the **Uses** editor | "Define how this ingredient is used… each use has its own yield and costing unit"; **Suggested uses** chips (e.g. "Juice (30 ml per item)") | |
| 3.3 | Confirm/add uses (Juice ml, Wheel count, Wedge count) | Each use shows its yield + per-unit cost (e.g. "30 ml per item · £0.0014/ml") | |
| 3.4 | In a cocktail that uses the lemon, open the drink editor | For the produce ingredient you get a **Use** dropdown (Juice / Wheel…) + **Amount** field, instead of the standard serve picker | |
| 3.5 | Cost check | Drink cost reflects the produce **per-use** cost (one lemon → juice vs garnish priced differently) | |

---

## Phase 4 — Menu profitability & engineering

Open the imported menu's detail page (`/trade/pouriq/[menuId]`).

| # | Step | Expected | Result |
|---|------|----------|--------|
| 4.1 | **KPI cards** (top) | Blended/Average GP · Best margin · Worst margin · Waste risk flags. Drinks with incomplete cost data flagged + excluded from the headline | |
| 4.2 | **Menu performance** matrix (needs sales — see Phase 8, or enter volumes) | 2×2 popularity × margin; without sales, the "add this week's sales…" placeholder shows | |
| 4.3 | **Movers (last 30 days)** | Top / slow / dead by sales where POS volumes exist | |
| 4.4 | **Drinks** table + **Bulk promo actions** | Per-drink GP%/margin; incomplete drinks flagged | |
| 4.5 | **VAT toggle** (menu VAT mode) | Sale-side GP recomputes on the right base; net view matches the accountant figure | |
| 4.6 | **Menu balance** (needs sales + costed drinks) | Four labelled groups: Strong sellers / Popular, low margin / High margin, low sales / Underperformers (no star-dog jargon) | |
| 4.7 | **GP by category** | Per-category blended GP grouped by label (beer+cider merge etc.), each vs the venue target; sub-note "[n]% target" | |
| 4.8 | **Ingredient overlap** | Shows shared ingredients across drinks | |
| 4.9 | **AI recommendations** | Streamed plain-English suggestions grounded in your menu + Field Manual | |
| 4.10 | **Cost-change what-if** (`/trade/pouriq/library/what-if`, or from the library) | Dial a hypothetical cost → GP shifts live across every drink using it; drinks crossing below target flagged | |
| 4.11 | **Promotional pricing** — set a happy-hour price / bulk % off | Promo GP shown alongside standard | |
| 4.12 | **Compare menus** (Menus list → "Compare menus →", `/trade/pouriq/compare`) | Pick Baseline vs Compare; Δ GP / Δ Margin / Δ Contribution table + removed/added drinks | |

---

## Phase 5 — Spec cards, menu builder & output

| # | Step | Expected | Result |
|---|------|----------|--------|
| 5.1 | **Spec cards** (`/trade/pouriq/[menuId]/specs`) | Per-drink card: name, price, glass, garnish, ingredients, Directions, "Tell the customer" | |
| 5.2 | Spec cards **Show allergens** / **Show ABV** toggles | Allergens under "Contains:" + V/Ve/GF badges; "ABV [N]% · [N] units" or "ABV estimate incomplete" | |
| 5.3 | Spec cards **Print** | White page, dark text, one card per page (or 2-col compact) | |
| 5.4 | **Menu builder** (`/trade/pouriq/[menuId]/menu-builder`) — Arrange pane | Create **sections** + **sub-sections**; drag drinks or use "Move to"; unplaced drinks sit in the **Unplaced** tray; reorder ↑ ↓ | |
| 5.5 | Menu builder **controls** | Title · **Theme** (Heritage/Premium/Clean/Casual/Bold/Classic) · **Logo** upload + align (Left/Center/Right) · **1/2 columns** · Show prices/descriptions/photos/allergens/ABV | |
| 5.6 | Menu builder **Preview** pane | White "paper" card, dark legible text; sections/sub-sections styled; drink blocks show price, description, badges, ABV, optional photo | |
| 5.7 | **Save as PDF** | Clean customer menu prints; controls/arrange panes not printed | |
| 5.8 | **Generate descriptions** (menu header button) | Drink descriptions generated in your voice profile | |
| 5.9 | **Menu copy** (`/trade/pouriq/[menuId]/menu-copy`) | Plain-text / markdown of names + prices + descriptions; copy/download works | |

---

## Phase 6 — Accounting integrations (NEW: Xero + QuickBooks)

Targets: **Xero Demo Company (set to UK)** and **QuickBooks GB sandbox**. Both push a committed invoice as a **draft bill** (nothing hits the ledger without approval). Only **one** accounting connection per venue at a time.

### 6A — Xero

| # | Step | Expected | Result |
|---|------|----------|--------|
| 6.1 | Integrations → **Accounting** section → **Connect Xero** | Redirects to Xero OAuth; approve for the Demo Company | |
| 6.2 | Back on the card | "Connected" shows a **Finish setup** state | |
| 6.3 | If the login has several orgs | An **Organisation** dropdown appears first ("Choose an organisation") | |
| 6.4 | **Bills are coded to** dropdown | Lists your Xero expense accounts (Expense / Direct Costs / Overheads) — pick one, e.g. a Cost of Sales account | |
| 6.5 | **VAT treatment** dropdown | Lists active expense tax rates; the **20% VAT on Expenses** option is pre-selected | |
| 6.6 | **Save and start pushing** (disabled until account + VAT chosen) | Card moves to "Connected to [org], coding bills to account [code]" | |
| 6.7 | Commit a scanned invoice (Phase 7) with Xero connected | On the invoice detail page: "Pushed to Xero as a draft bill (time)" | |
| 6.8 | Open Xero Demo Company → Bills | A **draft** ACCPAY bill exists: correct supplier, reference (invoice number), date, **net** line amounts, VAT treatment | |
| 6.9 | The other card (QuickBooks) while Xero is connected | Shows "One accounting connection per venue. Disconnect the other provider first." | |
| 6.10 | **Failure drill** — in Xero, revoke Pour IQ's access; commit another invoice | Invoice detail shows "Push to Xero failed" (or queued); a **Push now** button is offered | |
| 6.11 | Reconnect Xero, then **Push now** (or wait for the hourly sweep) | The queued/failed invoice pushes; status flips to "Pushed" | |
| 6.12 | **Disconnect Xero** | Connection removed; push history stays; the QuickBooks card becomes available again | |

### 6B — QuickBooks Online (GB sandbox)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 6.13 | **Connect QuickBooks Online** | OAuth against the **GB sandbox** company; realm captured automatically (no org picker) | |
| 6.14 | Finish setup — account + VAT | Expense accounts listed (Expense / Cost of Goods Sold / **Other Expense**); UK **20%** VAT code pre-selected | |
| 6.15 | Commit an invoice | "Pushed to QuickBooks as a draft bill"; in the GB sandbox a **draft Bill** exists with vendor, DocNumber (invoice ref, ≤21 chars), TxnDate, net amounts, TaxExcluded/TaxInclusive | |
| 6.16 | Invoice **list badges** | A pushed invoice shows an "in accounts" badge; a failed one shows "push failed" | |
| 6.17 | **Predates-connection copy** — view an invoice committed *before* you connected | Status reads "This invoice predates the connection. Push it now to send it across." + **Push now** (it will not auto-sweep) | |

> Note: QuickBooks runs against **sandbox** until Intuit approves the production app. The GB sandbox gives real UK VAT behaviour so this phase is representative. Do the sandbox connect/push/revoke/reconnect run **before** submitting the Intuit production questionnaire.

---

## Phase 7 — Invoicing & cost ripple

Suppliers & invoices (`/trade/pouriq/invoices`) → **Scan invoice** (`/trade/pouriq/invoices/new`).

| # | Step | Expected | Result |
|---|------|----------|--------|
| 7.1 | Upload a supplier PDF | "Reading [file]…" then the preview | |
| 7.2 | **Invoice image beside the lines** | Left pane = scrollable original PDF/image (Document tab on mobile); right pane = extracted lines | |
| 7.3 | **Truncation banner** (long invoice) | Amber warning if extraction was cut off | |
| 7.4 | Lines grouped | **Needs your attention (N)** · **Price changes detected (N)** · **● N auto-matched** (collapsible) | |
| 7.5 | Header fields | Supplier / Invoice number / Date extracted and editable | |
| 7.6 | **Inc/Ex VAT toggle** (default **Ex/net**) | Flip to Inc: Δ column compares net-to-net; price-change routing reflects net | |
| 7.7 | Resolve lines (existing dropdown or **Create new**) + tick Apply; **Save invoice** | Library prices update (stored net); invoice + cost-change rows written; cider/AF lines accepted | |
| 7.8 | Land on **GP impact** (`/trade/pouriq/invoices/[id]/impact`) | How many drinks affected + how many now below target | |
| 7.9 | **Invoice list tabs** | All / Fully applied / Needs attention counts correct | |
| 7.10 | **Price changes** view (Invoices → `← Invoices` breadcrumb → `/trade/pouriq/price-changes`) | Date / Ingredient / Old / New / Change / Source / Supplier | |
| 7.11 | Invoice detail → **Download original PDF** | Renders light; PDF downloads | |
| 7.12 | **Delete** an invoice | Receipts/lines/invoice removed; cost-change audit kept; applied prices NOT rolled back (by design) | |
| 7.13 | Save an invoice with **no lines applied** | Redirects to the library (intentional — confirm it doesn't feel lost) | |

---

## Phase 8 — Variance, stock & reorder (whole-bar, unit-aware)

Stock (`/trade/pouriq/stock`) and Variance (`/trade/pouriq/variance`) are **library-wide**, not per menu.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 8.1 | Stock → enter counts for several ingredients | Counts save (rolling, timestamped) | |
| 8.2 | **Unit-aware counts** — count a spirit (ml/bottles), a produce item (**each**), a weight item (**g**) | Each counts in its own base unit, not ml-only | |
| 8.3 | Variance view | Theoretical (POS × recipe) vs actual (count delta + receipts + production); within-tolerance calm; amber/red bands; persistent-loss flag on repeated directional loss | |
| 8.4 | **Produce in variance** — a lemon used for juice + garnish | Produce appears in variance in items/g (not excluded) | |
| 8.5 | **Variance reason codes** — on a variance row | Over-pour / spillage / comps / breakage / theft selectable | |
| 8.6 | Per-ingredient variance detail (`/trade/pouriq/variance/[ingredientId]`) | Drill-in loads | |
| 8.7 | **Par levels** — set a par on an ingredient | Saves; low-stock flag where on-hand < par | |
| 8.8 | **Order report** (`/trade/pouriq/stock/order`) | Order qty for items below par; printable + legible in print | |
| 8.9 | **Make a batch** (production on a prepared ingredient) | Yield tops up the prepared stock; components consumed | |

---

## Phase 9 — POS integrations (optional, needs a sandbox)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 9.1 | Integrations → connect **Square** / **SumUp** / **Zettle** via OAuth | Completes; no "could not complete the connection" | |
| 9.2 | Sync / wait for ingest | Orders pull in; per-cocktail volumes appear in movers / blended GP / matrix | |
| 9.3 | **Unmatched items** (amber banner → `/trade/pouriq/unmatched`) | Map to cocktail / serve, create-serve inline, ignore; historical lines backfill | |
| 9.4 | **Serves** (`/trade/pouriq/serves`) | Non-cocktail POS serves (e.g. house single) with a light pour spec, for matching till items | |
| 9.5 | Active menu | Exactly one active menu; sales route to it | |
| 9.6 | **Coming soon** cards | Lightspeed + ePOSnow render disabled with description, no Connect button | |

---

## Phase 10 — Dashboard, attention & recommendations

| # | Step | Expected | Result |
|---|------|----------|--------|
| 10.1 | Today dashboard tiles | Sales this period + Menu profitability; setup checklist; quick actions | |
| 10.2 | **Attention required** list | Ordered: no active menu → sync errors → unmatched items → drinks needing prices → drinks under target GP. Hidden when clear | |
| 10.3 | AI recommendations (dashboard/menu) | Streamed, grounded, plain-English | |

---

## Phase 11 — Print / output fidelity (spot-check)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 11.1 | Print spec cards | White page, dark text | |
| 11.2 | Print the menu builder (Save as PDF) | Clean customer menu, dark on white, logo/theme honoured | |
| 11.3 | Print the order report | Legible | |
| 11.4 | Print the menu report | KPIs + matrix; the four quadrants stay distinguishable on paper | |

---

## Phase 12 — Remaining edge cases / known limits (document, don't fail)

Most of the old known-limits are now shipped. Probe what's left and record behaviour rather than failing it:

- **Post-mix / bag-in-box syrup ratio** — pack format "Bag-in-box" exists, but dilution-ratio modelling for post-mix guns may still be approximate. Note how a post-mix line costs.
- **Kegs / draught pints** — keg volume goes in as ml; a pint relies on a manual serve unit. Confirm a draught beer costs per pint sensibly.
- **ABV field hides on type change** — switching an ingredient from alcoholic to non-alcoholic hides ABV but keeps the stored value. Note if that surprises you.
- **Allergens are edit-mode only** — you must save a new ingredient before allergens can be set. Note the two-step friction.
- Anything else that felt like a wall for a whole-venue menu.

---

## Regression focus (recent merges — check specifically)

- **Accounting push** (this cycle): connect → finish setup → commit → draft bill appears; failure → queued/failed + Push now → recovers; one connection per venue; predates-connection copy; "in accounts" / "push failed" list badges.
- **Sweep fixes** (this cycle):
  - Deleting your **last real menu** must not strand the venue with no active menu, and must never promote the hidden serves menu (dashboard/POS keep working after a delete).
  - An **Inc £14.40** ingredient and an **Ex £12.00** ingredient yield the **same** pour cost / GP; re-edit penny-exact; the VAT basis reaches the accounting bill correctly.
  - **Same-day delivery** — an invoice dated today still counts in today's stock/variance (not string-compared out).
  - **AI extraction truncation** surfaces a banner instead of a silent short preview.
  - **Login** — repeated wrong PINs lock out (per-PIN, not just per-IP).
- **VAT basis**, **cider/AF import**, **print fidelity** — as before.

---

## Summary for the run

- Phases 1–11 should pass on the **whole-venue** path end to end.
- Phase 12 documents the few remaining edge cases (expected).
- Log every ⚠️/❌ with the phase number → that's the amendment list we work from.

---

## Appendix A — Time-to-value measurement (the metric that sells it)

Target framing: a real venue reaches a **fully costed menu in well under an hour**.

| Metric | How to capture | Target | Actual |
|---|---|---|---|
| **Total onboarding** | Blank venue → first menu with GP on every drink | < 45–60 min | |
| Extract time **per import** | Time each upload → preview | < ~60s each | |
| **Auto-match hit rate** | (auto + catalogue matched) ÷ total ingredient lines | higher = faster | |
| Ingredients needing **manual creation** | Count new entries you had to price | lower = faster | |
| Avg **time per drink** to resolve/price | total review ÷ drinks | | |
| Invoice scan (Phase 7) | upload → committed | < ~2 min | |
| **Accounting connect** (Phase 6) | OAuth start → first draft bill visible | < ~5 min | |
| First **stock count** for N ingredients | time to enter | | |

Note time sinks (slow scroll to unresolved lines, re-entering prices, fiddly pack sizes). Every missing brand/generic (Appendix B) is onboarding time saved for the next venue.

---

## Appendix B — Brand / generic gap log

Log every line the catalogue did NOT cover (had to create manually). Feeds the next catalogue migration.

| Product (as on the menu) | Type | Should map to (generic) | In catalogue? |
|---|---|---|---|
| | | | |

---

## Appendix C — Test supplier invoice (for Phase 7)

Render as a PDF, then scan. Built to exercise the matcher + every pack format + the cider/AF commit path + catalogue items. **Net (ex-VAT)** line prices with a 20% VAT summary at the foot (so the per-invoice toggle defaults to Ex/net). Lines should mix: catalogue auto-matches, brand↔generic (e.g. Archers → peach schnapps), cider + alcohol-free, and awkward formats (keg / bag-in-box post-mix / 2L / small bottle / case / weight / count / food).

(Paste the finalised line list here so the test invoice is repeatable.)
