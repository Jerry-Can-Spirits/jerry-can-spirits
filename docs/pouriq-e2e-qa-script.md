# Pour IQ™ — End-to-End QA Script

A manual, human-followable walkthrough of the entire Pour IQ product, as a brand-new
customer would experience it: brand voice → first menu → drinks (manual + AI import) →
ingredient library → descriptions → costs/GP → invoice scanning → volumes & variance →
POS integration → unmatched items → dashboard → outputs (copy, spec cards, menu builder)
→ compare, duplicate, delete.

Each step has an **Action** and an **Expected** result. Tick the box when it passes; note
anything that doesn't.

---

## Before you start

**Account & access**
- A trade account with an **active Pour IQ licence** (subscription valid for "now"). Without it you'll see the licence gate, not the tool.
- The trade-portal **PIN** for that account.

**Test assets to have ready** (so the AI steps have something real to chew on)
- A **drinks menu PDF** (a real cocktail menu — names, and ideally recipes/prices).
- A **supplier invoice PDF** (spirits/mixers with line items, quantities, prices).
- Optional: a **POS account** to connect (Square, Zettle, or SumUp). Note: Zettle/SumUp have no sandbox — connecting uses a real merchant account; skip the live connect if you don't have one and use the "no POS" path instead.

**Environment**
- Run against production (post-deploy) or a preview deployment. Note which.
- These steps create real data on the account. Use a throwaway/test trade account if you don't want demo data left behind. A cleanup checklist is at the end.

**Conventions**
- Routes are written as paths under the site root, e.g. `/trade/pouriq`.
- "the active menu" = the one menu marked Active (POS sales route to it).

---

## Phase 0 — Login & access

- [ ] **0.1 Log in.** Action: go to `/trade/login`, enter the PIN. Expected: redirected to the Trade Hub (`/trade/landing`); a Pour IQ tile is present.
- [ ] **0.2 Open Pour IQ.** Action: click the Pour IQ tile (or go to `/trade/pouriq`). Expected: the Pour IQ dashboard loads. For a brand-new account: no menus yet, and no "Needs attention" panel (nothing to flag).
- [ ] **0.3 Licence gate (negative check, optional).** Action: if you have an unlicensed account, open `/trade/pouriq`. Expected: a licence gate, not the tool.

## Phase 1 — Brand voice

- [ ] **1.1 Open Voice Profile.** Action: from the Pour IQ hub, open `/trade/pouriq/settings/voice-profile`. Expected: the Voice Profile form (tone, person/voice, length, hard rules, sample descriptions, free-text notes).
- [ ] **1.2 Fill it in.** Action: set a tone (e.g. warm, confident), add one or two hard rules (e.g. "no exclamation marks"), and 1–3 sample descriptions in the house style. Save. Expected: a success state; the values persist on reload.
- [ ] **1.3 Persistence.** Action: leave and re-open the page. Expected: everything you entered is still there.

## Phase 2 — Create the first menu

- [ ] **2.1 New menu.** Action: from the hub, click **New menu** (`/trade/pouriq/new`). Fill name (e.g. "Summer Cocktails"), target GP %, venue type, and whether prices include VAT. Create. Expected: redirected to the new menu's detail page.
- [ ] **2.2 First menu is auto-active.** Action: go back to the hub (`/trade/pouriq`). Expected: the new menu shows an **Active** badge (the first menu a tenant creates is automatically active).
- [ ] **2.3 Empty menu state.** Action: open the menu. Expected: a "get drinks onto this menu" prompt offering PDF import, spreadsheet import, and manual add.

## Phase 3 — Ingredient library & pricing

- [ ] **3.1 Open the library.** Action: `/trade/pouriq/library`. Expected: the ingredient library (empty for a new account).
- [ ] **3.2 Add a bottle-priced ingredient.** Action: **New** library entry — add a spirit with a **bottle size (ml)** and **bottle cost**. Save. Expected: it appears in the library with its pricing.
- [ ] **3.3 Add a unit-priced ingredient.** Action: add an item priced per **unit** (e.g. a garnish or a can). Save. Expected: it appears, unit-priced.
- [ ] **3.4 Add an ingredient with NO price** (deliberately, for later). Action: add an item leaving price blank. Expected: it saves but has no usable cost — this is what later flags a drink as "cost incomplete."
- [ ] **3.5 Barcode (optional).** Action: on the add/edit form, use the barcode scanner (camera) or enter a barcode. Expected: the barcode is stored; scanning the same barcode again later pre-fills the entry.
- [ ] **3.6 What-if (optional).** Action: `/trade/pouriq/library/what-if`. Expected: a tool to model a cost change's impact before committing it.

## Phase 4 — Add drinks manually

- [ ] **4.1 Add a drink.** Action: on the menu, click **Add drink** (`/trade/pouriq/[menuId]/edit`). Enter a name, sale price, and add 2–3 ingredients from the library with pours/units. Save. Expected: the drink appears in the menu's **Drinks** table with a computed Pour cost, Margin, and GP %.
- [ ] **4.2 Add a drink that uses the unpriced ingredient.** Action: add another drink including the no-price ingredient from 3.4. Expected: in the Drinks table this drink shows **"⚠ Cost incomplete — add prices"** in place of a GP %, and links to its edit screen.

## Phase 5 — AI menu import (PDF)

- [ ] **5.1 Start an import.** Action: on the menu, **Import drinks** → choose PDF (`/trade/pouriq/[menuId]/import`). Upload your menu PDF. Expected: a progress state, then an extracted list of drinks with inferred recipes.
- [ ] **5.2 Review the matches.** Action: review the preview — extracted ingredients are fuzzy-matched against your library; unmatched ones are flagged to create. Adjust as needed. Expected: a clear preview you can edit before saving; nothing is written yet.
- [ ] **5.3 Commit.** Action: confirm/commit the import. Expected: the drinks are added to the menu in one go; new library ingredients are created; you land back on the menu with the new drinks in the table.
- [ ] **5.4 Spreadsheet import (optional).** Action: repeat 5.1 choosing spreadsheet (Excel/CSV). Expected: same review-then-commit flow from a sheet.

## Phase 6 — Brand-voiced descriptions

- [ ] **6.1 Generate one description.** Action: on a drink row, open the generate-description control and generate. Expected: a description in your Voice Profile's style appears; you can accept/save it.
- [ ] **6.2 Bulk generate.** Action: use **Generate descriptions** (bulk) on the menu header for drinks missing descriptions. Expected: descriptions generated for the missing ones; the "missing" count drops.
- [ ] **6.3 Voice adherence.** Action: read a few descriptions. Expected: they reflect the tone/rules you set in Phase 1 (e.g. respect a "no exclamation marks" rule).

## Phase 7 — Costs & GP (trustworthy numbers)

- [ ] **7.1 Headline GP.** Action: look at the menu's KPI cards. Expected: with no sales volumes yet, the headline reads **"Average GP"** (computed only over fully-costed drinks) and notes "no sales data yet."
- [ ] **7.2 Incomplete-cost exclusion.** Action: confirm the drink from 4.2 is **excluded** from the headline and shows the "cost incomplete" flag, and that the KPI note says "(N excluded — cost incomplete)." Expected: the inflated drink does not drag the headline; it sorts to the bottom of the table.
- [ ] **7.3 Fix the price.** Action: add a price to the unpriced ingredient (Phase 3.4) in the library. Return to the menu. Expected: the previously-flagged drink now shows a real GP %, is included in the headline, and the "excluded" note drops by one.

## Phase 8 — Cost-change ripple

- [ ] **8.1 Edit an ingredient cost.** Action: in the library, raise the cost of a spirit used in several drinks. Save. Expected: a ripple preview shows which drinks are affected and any that would drop below their menu's target GP; if any would regress, a confirm gate appears.
- [ ] **8.2 Confirm and verify.** Action: confirm the change. Expected: a post-save summary links to the affected drinks; their GP % updates accordingly on the menu.

## Phase 9 — AI invoice scanning

- [ ] **9.1 New invoice.** Action: `/trade/pouriq/invoices/new` (or **Invoices** → New). Upload your supplier invoice PDF. Expected: extraction runs; every line item is listed.
- [ ] **9.2 Review & match.** Action: review the extracted lines — each is size-aware fuzzy-matched to a library ingredient, with auto-tick and override. Expected: a clear preview; you can correct matches; nothing committed yet.
- [ ] **9.3 Commit.** Action: commit the invoice. Expected: ingredient costs update per line; a combined ripple/impact page shows GP impact across affected drinks.
- [ ] **9.4 Ledger & detail.** Action: open `/trade/pouriq/invoices`, then the invoice you just committed. Expected: it appears in the ledger; the detail page shows the lines and a **Download PDF** of the original.
- [ ] **9.5 Impact view.** Action: open the invoice's **impact** page (`/trade/pouriq/invoices/[id]/impact`). Expected: the GP impact of that invoice's cost changes across drinks.

## Phase 10 — Volumes & variance

- [ ] **10.1 Enter volumes manually.** Action: on the menu, use the **Volume** editor to enter units sold for a couple of drinks for the current period. Save. Expected: the Drinks table gains **Units** and **Contribution** columns; the table re-sorts by contribution.
- [ ] **10.2 Blended GP appears.** Action: re-check the KPI headline. Expected: it now reads **"Blended GP"** (total margin ÷ total net sales across what sold), not the plain average.
- [ ] **10.3 Variance.** Action: open the **Variance** editor, enter start/end stock counts for a bottle-priced ingredient over a period. Expected: it computes theoretical (sales × recipe) vs actual (start − end) variance, with ml/%/£ and a traffic-light (<10% neutral, 10–20% amber, >20% red).

## Phase 11 — VAT toggle

- [ ] **11.1 Toggle VAT mode.** Action: on the menu, flip the Inc VAT / Net VAT control. Expected: GP figures recompute (inc-VAT divides the sale price by 1.20 before margin); the headline and per-drink GP shift accordingly.

## Phase 12 — POS integration

*(Skip the live-connect steps if you have no POS account; do 12.5 instead.)*

- [ ] **12.1 Open integrations.** Action: `/trade/pouriq/settings/integrations`. Expected: cards for Square, Zettle by PayPal, SumUp (plus "coming soon" placeholders). Each connected card will show "Sales route to your active menu: {name}".
- [ ] **12.2 Connect.** Action: click **Connect** on a provider; complete the OAuth login/consent. Expected: redirected back with a "Connected" state and a "first sync runs within an hour, or click Sync now" note.
- [ ] **12.3 Routing note.** Action: read the connected card. Expected: "Sales route to your active menu: {your active menu}" (no per-connection menu picker — routing follows the active menu).
- [ ] **12.4 Sync.** Action: click **Sync now**. Expected: a success state; if the till has sales matching cocktail names, the menu's volumes/units update; a second **Sync now** does **not** double-count (order-level dedup).
- [ ] **12.5 No active menu (negative check).** Action: if no menu is active (or you temporarily have none), the card shows an amber "Set an active menu so sales can flow," and ingest is paused (no data lost — backfills once a menu is active).
- [ ] **12.6 Disconnect (optional).** Action: **Disconnect**. Expected: confirmation; the connection is removed and the token revoked best-effort; previously imported volumes are kept.

## Phase 13 — Unmatched items

*(Requires POS sales whose till names didn't match a cocktail — e.g. "Esp Martini" vs "Espresso Martini". If you can't generate these live, review the screen's empty state.)*

- [ ] **13.1 See the prompt.** Action: after a sync with unmatched items, open `/trade/pouriq` or the integrations page. Expected: a "needs attention" / amber prompt: "N unmatched till items."
- [ ] **13.2 Review.** Action: open `/trade/pouriq/unmatched`. Expected: each unmatched till name with sales waiting, last seen, and a **pre-selected best-guess cocktail**.
- [ ] **13.3 Map (with backfill).** Action: confirm a mapping. Expected: the row clears; the waiting sales backfill into that cocktail's volume; future syncs auto-match it.
- [ ] **13.4 Not a cocktail.** Action: on a food/service item, click **Not a cocktail**. Expected: the row clears and that item won't reappear in future syncs.
- [ ] **13.5 Empty state.** Action: once all are handled. Expected: "Nothing to review — every till item is mapped."

## Phase 14 — Needs-attention dashboard

- [ ] **14.1 Panel surfaces signals.** Action: open `/trade/pouriq` while issues exist. Expected: a "Needs attention" panel at the top listing, in priority order: sales paused (no active menu), sync errors, unmatched items, drinks needing prices (active menu), drinks under target GP (active menu) — each linking to the fix.
- [ ] **14.2 Scoped to active menu.** Action: confirm the price/GP rows reference the **active** menu only (a dormant menu's issues don't appear). Expected: as stated.
- [ ] **14.3 Clears when resolved.** Action: fix the flagged items. Expected: the panel disappears entirely when nothing needs attention.

## Phase 15 — Active menu

- [ ] **15.1 Create a second menu.** Action: **New menu** again. Expected: the second menu is **not** active (creating a later menu doesn't steal active from the live one).
- [ ] **15.2 Make active.** Action: on the hub, click **Make active** on the second menu. Expected: its badge becomes Active; the first menu's badge clears (exactly one active at a time). The menu detail header also reflects active state.
- [ ] **15.3 Routing follows.** Action: re-check integrations. Expected: the routing note now names the newly active menu.

## Phase 16 — Outputs

- [ ] **16.1 Menu copy.** Action: on a menu, **Menu copy** (`/trade/pouriq/[menuId]/menu-copy`). Expected: a brand-voiced text/markdown export of names, descriptions, prices — copy/export works.
- [ ] **16.2 Spec cards.** Action: **Spec cards** (`/trade/pouriq/[menuId]/specs`). Expected: a print-styled internal training one-pager per cocktail (name, price, garnish, ingredients, manager note, "tell the customer" line, Field Manual link where set).
- [ ] **16.3 Menu builder (PDF).** Action: **Menu builder** (`/trade/pouriq/[menuId]/menu-builder`). Edit the title, toggle 1/2 columns, toggle prices and descriptions. Then **Save as PDF**. Expected: a clean branded customer menu; Save as PDF opens the browser print dialog — choosing "Save as PDF" produces a tidy white menu (controls not printed).

## Phase 17 — Compare menus

- [ ] **17.1 Compare.** Action: `/trade/pouriq/compare`. Pick two menus. Expected: a comparison (e.g. GP, what changed/added/removed) across the two.

## Phase 18 — Duplicate a menu

- [ ] **18.1 Duplicate.** Action: on a menu, **Duplicate**. Expected: a copy is created ("Copy of …") with the same drinks/ingredients; the copy is **not** active; you can rename and edit it independently of the original.

## Phase 19 — Delete a menu

- [ ] **19.1 Delete a non-active menu.** Action: delete a dormant menu. Expected: it's removed; the active menu is unchanged.
- [ ] **19.2 Delete the active menu (active promotion).** Action: delete the menu currently marked Active. Expected: it's removed and the most-recently-updated remaining menu automatically becomes Active (there's always an active menu while any exist). If it was the only menu, none is active.

## Phase 20 — Help

- [ ] **20.1 Help guide.** Action: `/trade/pouriq/help` (or the Trade Hub help tile). Expected: the in-app help guide renders its sections.

---

## Known limitations / things not to be alarmed by

- **Zettle & SumUp have no sandbox** — connecting uses a real merchant account and real endpoints. The OAuth round-trip and amount handling are best verified against a live account; absence of one is not a failure of the flow.
- **AI steps (import, invoice, descriptions)** depend on Claude and on the quality of the source document. Re-running can yield slightly different extractions — that's expected, not a bug; the review-before-commit gate is the safety net.
- **POS volumes** only appear when till item names match cocktail names (or are mapped via Phase 13). A clean till with matching names is the happy path.

## Cleanup (if using a real account)

- Delete the test menus (Phase 19) — note active promotion.
- Disconnect any POS connection (Phase 12.6).
- Remove test library ingredients and invoices if you don't want them retained (invoices are kept by design for VAT records).
- Voice Profile can be left or cleared.
