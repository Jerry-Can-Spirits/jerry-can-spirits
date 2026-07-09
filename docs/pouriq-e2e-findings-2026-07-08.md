# Pour IQ E2E — Findings Log (run of 2026-07-08)

Running list of issues found during the manual E2E. Each becomes an amendment. Severity: 🔴 blocker · 🟠 needs fixing · 🟡 niggle/polish · 🔵 known-limit/roadmap.

## STATUS (2026-07-08)
- **F7** — FIXED, PR #868 (migration 0068), merged. Apply 0068 to prod.
- **F1, F3, F4, F5, F6, E2, E3** — FIXED, PR #869 (batch 1, migration 0069). Apply 0069 to prod after merge.
- **E1** (serve-aware import, incl. F2 Guinness keg) and **E4** (catalogue autocomplete on manual add) — DEFERRED to a brainstorm→spec design pass (model/feature work, not quick fixes).
- Test-script fixes pending: reword 2.13 (catalogue via import/invoice, not manual name field); tag 2.5 → F3.
- Then RESUME the E2E from Phase 3 (produce in cocktails) once 0068/0069 are live.

## Phase 1 — Whole-menu import & AI extraction

### F1 — 🟠 Kopparberg (fruit cider) mis-typed as "gin" on extraction (step 1.5)
- **Seen:** Kopparberg Mixed Fruit extracted/matched as "mixed fruit gin"; other Kopparberg flavours also became "... gin". The alcohol-free and pear variants came through correctly. Required manual correction.
- **Why it matters:** Kopparberg is a **cider** brand. A fruit descriptor is being read as gin, so the default type + likely the cost basis are wrong until hand-fixed. Wrong silent-ish default (near-miss the tester had to catch).
- **Cause (confirmed by Dan):** a **Kopparberg Gin** product exists, so the model sees "Kopparberg" + fruit and infers gin. It is appending a spirit type onto what are cider varieties.
- **Fix area:** (1) catalogue alias — "Kopparberg [fruit]" → cider unless the line literally reads "Kopparberg Gin"; (2) prompt rule — never append a spirit type onto a recognised cider/RTD brand. Cover Rekorderlig, Old Mout, Bulmers with the same guard. Contained fix; do NOT try to make general inference cleverer.

### F2 — 🟠 Bulk-fill doesn't propagate keg/pack size across serves of the same draught product (step 1.7)
- **Seen:** Guinness appears as two serves (half + pint). Setting the half to a **50L keg** did not update the pint, which **defaulted to 330ml**.
- **Why it matters:** Same underlying product should share one purchase/pack size; the tester had to set it twice, and the 330ml default is a bottle/can assumption applied to a draught line.
- **Likely cause:** (a) bulk-fill propagates price + library match but **not** the pack/purchase size; and/or (b) the two serves created/point at different sizing, and the default for a beer line is 330ml rather than keg-aware. Relates to the known keg/draught edge (E2E Phase 12): kegs go in as ml and a pint relies on a manual serve unit.
- **Fix area:** bulk-fill should carry pack/keg size for the same library entry; smarter default when a line is clearly draught (keg) vs packaged (330ml). Consider a "draught" flag so half/pint serves derive from one keg entry.

### E1 — 🟠 Enhancement: serve-aware import (adds serves inline; one product, multiple serves)
- **Idea (Dan, during the run):** at import there is only one serve option (price + 25ml). Adding serves without diving into each ingredient afterwards would speed onboarding. Considered full ingredient-page parity at import but flagged it as probably "too messy".
- **Assessment:** full-form parity IS the wrong call — the import preview is a fast-triage surface; loading ABV/allergens/uses/serves onto every row makes onboarding slower. Split by import-relevance:
  - **Inline at import (do this):** serve sizes (add/pick multiple) + draught/keg sizing — they determine whether a line costs correctly now.
  - **Post-import completion step (not inline):** ABV, allergens, produce uses, barcode — don't block costing; surface via a "finish these N ingredients" nudge (lean on the existing completeness concept).
- **Why it's high value:** "one beer, two serves" is the CORRECT data model (same as a gin bottle having 25/50ml serves) and directly **fixes F2** (Guinness half+pint double-entry / keg pack-size not propagating). One change = fewer entries + correct kegs + faster import. It is squarely a **time-to-value** win (the metric that sells onboarding).
- **Sequence:** (1) when two menu lines resolve to the same ingredient at different sizes, offer to make them serves of one entry; (2) add/pick serves inline on a create-new row.
- **Relates to:** F2, the ingredient-model design, and the onboarding-speed goal. Spec properly (brainstorm) after the E2E run.

## Phase 7 — Invoicing (findings while scanning)

### F8 — 🟠 Invoice commit doesn't set "packs bought" from "case of 6"
- **Seen (Dan):** applied an invoice line "Archers Peach Schnapps 70cl — case of 6"; type set to Liqueur (good), but the resulting library entry had **packs bought = 1** not 6, so cost worked out at £4+ per 50ml. The "case of 6" quantity wasn't parsed into purchase_qty.
- **Fix area:** invoice extract/commit should parse pack/case count ("case of 6", "x6", "6-pack") into purchase_qty. Pairs with the pack-format parse.
- **Theme (Dan):** "packs bought still needs a change somewhere — too much scope for busy bars to make mistakes." The whole purchase/pack model (packs bought vs pack size vs items per pack) is a recurring mistake-magnet (see F3). Candidate for its own small design pass on purchase-model clarity, separate from E1 (E1 is the SERVE axis; this is the PURCHASE axis).

### E5 — 🟡 Enhancement: pack_format field doesn't explain its purpose (count-unit)
- **Trigger (Dan):** asked what "how a product arrives" (pack_format) actually does — vanity or functional? A case of spirits arrives as a case but the spirit is in a bottle; unclear what to enter.
- **Finding (from code):** pack_format is NOT used in any cost calc. Its ONLY functional use is `stockUnitWords(pack_format)` in `StockManager` — it picks the noun shown in stock takes ("2 kegs" / "6 bottles"). So it's vanity for costing + a stock-take readability aid.
- **Correct rule for bars:** set pack_format to the unit you physically COUNT during a stock take (a case of spirits → bottle; a keg → keg), NOT the delivery carton. It never changes the money.
- **Do:** relabel/help the field, e.g. "The unit you count in during a stock take" with the case→bottle example. Removes the misplaced anxiety about getting it "right".
- **Belongs with:** the purchase-model-clarity sibling design (F3/F8) — packs-bought/pack-size is the real mistake-magnet; pack_format is cosmetic + stock wording only.
- **Note for E1 (serve-aware import):** draught→pack_format 'keg' is correct for stock wording (you count kegs); if it doesn't persist for new import entries, kegs would read "bottles" in stock takes (minor, cost still correct) — see the Task 5 pack_format-persistence check.

### F9 — 🟠 Invoice image inline viewer shows "refused to connect" (works via open-in-new-tab)
- **Seen (Dan):** the original-invoice viewer beside the lines shows a big red "jerrycanspirits refused to connect" error; the "open in new tab" link DOES open the invoice.
- **Likely cause:** the PDF/serve route is blocked from being embedded in an iframe (X-Frame-Options / CSP `frame-ancestors`), so the inline embed fails while a direct navigation works. The invoice-beside-lines feature (Jelly-inspired) is broken inline.
- **Fix area:** allow same-origin framing for the invoice serve/pending routes (CSP frame-ancestors 'self' / drop X-Frame-Options for those routes), or render the PDF via a viewer that doesn't rely on cross-frame embedding.

### F10 — 🟡 Invoice detail "Applied lines" table needs horizontal scrolling (doesn't fit)
- **Seen (Dan):** the applied-lines section requires a lot of left/right scrolling; doesn't fit the page.
- **Fix area:** responsive layout for the applied-lines table on the invoice detail page (stack columns / reduce/wrap on narrow widths, like the invoice preview does).

### F8/F9/F10 vs current E1 work: no overlap — E1 touches the SERVE model + menu import, not invoice purchase-qty parsing, the invoice viewer, or the invoice detail table. Logged for a later invoice-polish pass.

## E2E RUN 2 (2026-07-09, from scratch)

### F11 — 🟠 Import: generic recipe terms can't resolve to branded entries — not even ones created in the SAME import
- **Seen (Dan):** one import had a spirits list (branded, "Gordon's") + cocktail pages (generic, "Gin"). Spirits committed fine. The cocktails' "Gin" lines forced a NEW "Gin" library entry: (a) the matcher has no brand↔generic awareness against the venue's own library ("Gordon's" ≠ "Gin" by tokens, though the catalogue KNOWS Gordon's rolls up to the gin generic); (b) cancelling create-new to pick from the library fails because Gordon's is a pending row in the same import, not yet committed — the picker only shows committed entries. Result: one physical bottle = two library entries; gin cocktails cost against a phantom "Gin".
- **Why it matters:** cocktail menus almost never name brands, so every whole-venue import hits this. Silently splits costing and pollutes the library. Major onboarding friction (time-to-value theme).
- **Workaround:** two-pass commit (spirits page first, then cocktails — the picker then sees the brands). Post-hoc repair: repoint cocktail lines to the brand, delete the orphan generic entry.
- **Fix design (two parts — likely its own design pass, sibling of E1):**
  1. **Same-import pick targets:** rows resolved as create-new should be offered in OTHER rows' pickers ("From this import: Gordon's — new"). The commit route's marker mechanism (newLibraryIdByMarker) already lets multiple lines share one new entry; the preview just never offers it across differently-named rows.
  2. **Generic→brand resolution ("house pour"):** a generic term ("gin") should suggest the venue's library entries whose catalogue generic matches. Longer-term this is the house-pour concept — venue-level "house gin = X" so generic recipe lines cost against the designated brand, and swapping the house pour re-costs every affected drink. A real feature, not just a matcher patch.
- **Relates to:** E1 (serve-aware import), E4 (catalogue lift on manual add), onboarding speed.

### F12 — 🟠 Import: "Create new ingredient" is undiscoverable (two real users concluded it doesn't exist)
- **Seen (Dan, twice in one run):** "Pouilly-Fumé Pierre Brevin" (wine, price extracted, no library/catalogue match) and "chocolate sauce" (Mudslide) — both times the row appeared to offer only search-library-or-skip; no visible way to create a new entry. Concluded the drink had to be skipped.
- **Actual behaviour (code):** create-new EXISTS but only as the LAST row inside the LibrarySearchSelect dropdown ("+ Create new ingredient"), beneath up to 20 library entries in a max-h-64 scroll box (`LibrarySearchSelect.tsx` — button rendered after `matches.map`). With an empty query the user sees 20 irrelevant entries and never scrolls to the bottom; nothing on the row itself says creation is possible.
- **Why it matters:** unmatched-but-priced lines are exactly the moment a new venue is building its library; if creation looks impossible they skip drinks and the menu imports incomplete. 2/2 discovery failure in live use.
- **Workaround:** click into the search box, type any non-matching text — the dropdown reduces to the "+ Create new ingredient" row; it seeds from what you typed.
- **Fix (small UI):** (1) an always-visible "Create '<extracted name>'" button on unresolved rows, calling the existing `startNewLibrary(extracted_name)` — no retyping; (2) pin the create row to the TOP of the dropdown (or make it sticky) so it's visible regardless of match count. No model change.
- **Relates to:** F11 (both are the unmatched-row resolution UX), onboarding speed.

### F13 — 🟠 Import: choice lines ("lemonade or soda") extracted as ONE compound ingredient
- **Seen (Dan):** a cocktail offering "lemonade or soda" was extracted as a single ingredient line named "lemonade or soda", staging a create-new entry with that literal name.
- **Why it matters:** a menu choice is a service option, not a costable ingredient; the literal entry pollutes the library and costs nothing correctly.
- **Workaround:** on that row, pick/create just "Lemonade" (cost against the first-listed default); the choice wording belongs in the drink description.
- **Fix:** extraction prompt rule — "X or Y" within an ingredient list = alternatives: emit the FIRST as the costed ingredient (house default) and keep the choice in the description; never emit "X or Y" as a name. (The compound splitter handles "&"; "or" is a different semantic — choose-one, not both.) Also ensure the create-new row's name field is obviously editable so users can rescue any weird extraction.
- **Relates to:** F1 (extraction typing), compound splitting, the import design pass.

### F14 — 🟠 Import: description-only drinks (mocktails) extract with zero ingredients and cannot be completed in the preview
- **Seen (Dan):** the mocktail section lists descriptions, not ingredients. "The Bank Sunrise" extracted correctly as a drink but with NO ingredient rows — and the preview offers no way to add one, while commit requires at least one ingredient per drink. Only option: skip and rebuild manually.
- **Why it matters:** whole menu sections (mocktails, simple serves) are written description-style; each becomes manual work, undercutting the import's time-to-value promise.
- **Workaround:** skip in import, then Add drink manually on the menu with ingredients from the description.
- **Fix (layered):** (1) an "Add ingredient" control per drink card in the preview so any drink can be completed in place; (2) extraction fallback — when a drink has no ingredient list, mine the DESCRIPTION for ingredients (mocktail descriptions usually name them: "orange juice, grenadine..."), flagging them as inferred for review.
- **Relates to:** F11/F12/F13 — the import resolution UX cluster; all four belong to one design pass.

### E6 — 🔵 Design question (Dan, undecided): does the standalone Serves section survive serve-aware menus?
- **Trigger:** post-E1, the menu itself now carries "Moretti (Half)" / "(Pint)" as clickable priced drinks sharing one keg — overlapping what Serves existed for. Dan wondering whether to fold serves into menus; deliberately deferring until the POS phase of this run.
- **What Serves actually is:** the bucket for till items no printed menu lists (hidden serves menu; unmatched mapper's "map to serve" path). Still needed for off-menu sales to have a costed home (variance correctness) — but likely as a FALLBACK inside the unmatched flow, not a peer nav section.
- **Evidence to gather in the POS phase:** (1) do till items now map cleanly to menu drinks? (2) does anything genuinely need the serves bucket? (3) DOUBLE REPRESENTATION: if a pint exists as both menu drink and serve, what does the mapper suggest and can sales split across both (movers/variance corruption)?
- **Early lean (held loosely):** demote, don't delete — "till items not on your menu" surfaced in the unmatched flow. End-state relates to the sellable-item model in [[project_pouriq_architecture_philosophy]].

## Phase 2/3 — Ingredient model & costing

### F3 — 🔴 "Items per pack" is a non-functional / misleading field for Count/each ingredients
- **Seen (Dan):** adding lemons, set Items per pack = 10; on save it reverted to 1, so per-item pricing was wrong. (Produce **uses** worked fantastically — this is purely the pack sizing.)
- **Root cause (confirmed in code, `IngredientForm.tsx`):**
  1. Save line ~352 `const pack_size = base_unit === 'each' ? 1 : pack_size_n` — pack_size is **forced to 1** for each, discarding the entered value (the revert-to-1).
  2. Cost readout line ~207 `eachP = price / purchase_qty` — per-item cost divides by **"Packs bought" (purchase_qty)**, and **ignores "Items per pack" (pack_size)** entirely.
  3. Deeper: stock/variance for count ingredients **assume pack_size = 1** (documented produce limitation — "par/reorder for pack_size>1 produce is dormant; library uses pack_size=1"). So honouring pack_size>1 would fix cost but break stock/variance.
- **Net:** for count ingredients only "Packs bought" affects cost; "Items per pack" is discarded AND ignored — a field that does nothing, which reads as a bug.
- **Workaround for the E2E run:** put the TOTAL item count in "Packs bought", leave Items per pack = 1 (case of 100 lemons £16.70 → Packs bought 100 → £0.167 each). Matches what cost + stock both expect.
- **Fix — interim (safe, do first):** for `each` mode, **hide "Items per pack"** and **relabel "Packs bought" → "Number of items"** (helper: "how many individual items this price covers"). Removes the broken field + the confusion, using the field that already works. No stock-model change needed.
- **Fix — full (later):** model pack_size>1 for count across cost readout, save, AND stock/variance/par/reorder together (bags of 6, cases). Belongs with the non-ml stock hardening. Ties to the ingredient-model thread (F2/E1/E2).

### F4 — 🔴 Made-in-house: components can't be added on create; user bounced to the list
- **Seen (Dan):** in Made-in-house there's no obvious Save; the "Add ingredient" button takes you back to the Ingredients page and there's no way to actually add the component ingredients (sugar).
- **Root cause (`IngredientForm.tsx`):**
  1. New prepared ingredient: `handleSubmit` → `commit` → `saveLibraryEntryAction` (creates a shell, price 0), then **`router.push('/trade/pouriq/library')`** (line ~394) — lands on the LIST.
  2. The **Components panel** ("Add a component", line ~942) renders **only in edit mode** (needs a saved `entry`). So on create you can never see it.
  3. Submit button is labelled **"Add ingredient"** (line ~1273) — in a recipe context that reads as "add a component", not "save the recipe". Double confusion.
- **Net:** building a prepared recipe requires save → hunt in list → re-open → edit → add components. Undiscoverable; effectively blocks Made-in-house for a first-time user.
- **Workaround for the run:** save the shell (name + yield), then Ingredients list → click the new item → Edit → the Components / "Add a component" panel is there.
- **Fix (safe, navigation-only, no data-model change):** for a NEW prepared ingredient, `commit` should redirect to **`/trade/pouriq/library/${savedId}/edit`** (straight into the Components panel), not the list. AND relabel the button for prepared-new to e.g. "Save and add components" / "Create recipe →" so the two-step is obvious. Consider showing the components panel inline once name+yield are valid, even pre-save, staging like the produce `pendingTemplate` pattern.

## Phase 3 — Fresh produce in cocktails

### F7 — 🔴 BLOCKER: saving a cocktail that uses a produce "use" fails a DB CHECK constraint
- **Seen (Dan, 3.4/3.5):** adding an orange/lemon to a cocktail via a **use** (Juice/Wheel) then saving → "An error occurred in the Server Components render" (prod masks it). Removing the produce component saves fine. Confirmed repro.
- **Actual error (via `wrangler tail`):** `D1_ERROR: CHECK constraint failed: pour_ml IS NOT NULL OR unit_count IS NOT NULL` on POST .../edit (the save).
- **Root cause:** a produce-use recipe line stores its quantity as `use_id` + `recipe_qty` and correctly leaves `pour_ml` and `unit_count` NULL. But the CHECK on `pouriq_ingredients` (migration **0016**) still only allows the two old measures; migration **0064** added the `use_id` column but never widened the CHECK. So every produce-in-cocktail save is rejected. Latent since the produce feature shipped — only surfaces when a cocktail actually uses a produce use (this E2E is the first time).
- **No workaround** — the feature is blocked until fixed.
- **Fix:** migration **0068** rebuilds `pouriq_ingredients` (SQLite can't ALTER a CHECK) with `CHECK (pour_ml IS NOT NULL OR unit_count IS NOT NULL OR use_id IS NOT NULL)`, preserving all columns + both indexes. Code-only paths already handle use_id lines; no app change needed. Same table-rebuild pattern as migration 0033. **STATUS: FIXED — PR #868 (migration 0068), verified locally. Merge + `wrangler d1 migrations apply --remote` to unblock prod testing.**

### F5 — 🟡 Barcode scanner: camera doesn't open on laptop (works on phone)
- **Seen (Dan, 2.12):** the barcode "Scan" camera didn't open on a laptop; tested on phone and it worked.
- **Assessment:** phone is the realistic scanning device in a venue (walk the shelves), so low severity — but the laptop path should either open the camera or clearly say "use a phone / no camera found" rather than silently doing nothing. Likely a getUserMedia permission/no-camera path with no user feedback.
- **Fix area:** BarcodeScanner — surface a clear message when no camera / permission denied; confirm desktop webcam support or gate it to mobile with guidance.

### F6 — 🟠 Mobile layout: delete control overlaps the type/category label on ingredient edit
- **Seen (Dan, 2.12, on phone):** the "delete an ingredient" checkbox/control sat **on top of** where it says the drink type (e.g. "spirit") — visual overlap.
- **Assessment:** responsive layout bug on the ingredient edit form on small screens; controls colliding. Polish but looks broken to a user.
- **Fix area:** IngredientForm mobile layout — stack/space the delete control vs the type/category field at small breakpoints.

### E4 — 🟠 Enhancement: catalogue name-autocomplete on the manual Add-ingredient form
- **Trigger (Dan, 2.13):** typing a name in Add ingredient shows no dropdown. **Not a bug** — the manual form has no name-vs-catalogue autocomplete by design; catalogue-by-name only runs in menu import + invoice extract, and on the manual form only via **barcode scan** (`by-barcode` route pre-fills name/type/size).
- **Gap:** a bar owner adding a spirit manually gets none of the catalogue's hundreds of entries unless they scan a barcode or use import. The catalogue's value is hidden from the most obvious "add one thing" path.
- **Do:** add adopt-from-catalogue **name autocomplete** to the Add-ingredient Name field (type "Everleaf" → suggestion → pre-fills type/size, you add price), matching the import matcher. Onboarding-speed win; same theme as E1.
- **Also:** TEST-SCRIPT FIX — 2.13 is mis-specified. Catalogue *content* is tested via the import/invoice matcher or a barcode scan, not the manual name field. Reword the step.

### E3 — 🟡 Enhancement: pre-seed a free "Water" catalogue item (+ Made-in-house guidance)
- **Trigger (Dan):** building simple syrup (sugar + water) — a bar naturally looks for a water ingredient, but the model absorbs free dilution into the **yield**, so water isn't entered.
- **Do:** pre-seed **Water** into the shared catalogue — base unit ml, price **£0.00**, so it's discoverable/adoptable in the Made-in-house component picker for anyone who wants it on the recipe explicitly.
- **Rationale on price:** water is NOT truly free (business water rates), but per-ml cost rounds to nothing and metered-supply modelling is disproportionate complexity. Deliberate simplification: model as £0. (Same logic would apply to ice if raised.)
- **Also (optional):** one-line helper on the Made-in-house form — "Only add ingredients you pay for. Water and other free dilution are captured by the yield." Removes the "where's the water field?" five-second confusion.
- **Scope:** catalogue seed migration + optional form helper. Small.

### E2 — 🟡 Enhancement: type-aware cost readout on the ingredient form
- **Seen (Dan):** editing **yield** on a keg, the cost readout shows price per **25ml / 50ml** — right for spirits, meaningless for draught.
- **Options weighed:** 100ml yardstick (weakest — arbitrary) < half+pint for draught (good) < **type-aware readout** (best): draught → half (284ml) + pint (568ml); wine → 125/175/250; spirit → 25/50.
- **Best form:** drive the readout off the ingredient's **defined serve units**, falling back to per-type defaults when none exist. Then the numbers on screen are always the measures that venue actually sells.
- **Why:** makes kegs and wine legible on the ingredient page; the numbers become ones an owner recognises. Ties into **E1** — serves defined at import immediately drive this readout. Same model change, two payoffs.
- **Scope:** IngredientForm cost readout (currently hardcodes 25/50ml). Low-risk, high-clarity.

### Not yet tested in Phase 1
- 1.3 truncation banner, 1.4 compound splitting, 1.6 brand→generic (Archers), 1.8 non-cocktail type-setting, 1.9 new-ingredient adopt/VAT.
