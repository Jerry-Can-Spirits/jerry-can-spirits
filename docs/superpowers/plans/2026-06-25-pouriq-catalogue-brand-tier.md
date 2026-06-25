# Pour IQ Catalogue Brand Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Cover brand-level products in the catalogue so branded lines import/scan as distinct, correctly-named, correctly-typed products, and make the invoice flow use the catalogue.

**Architecture:** A brand tier in `pouriq_ingredient_catalogue` (new nullable `generic` column linking a brand to its generic), a matcher that prefers specific over generic and keeps a line's own name when it is more specific, the menu-import + invoice flows using that, and the invoice new-library UI brought onto the purchase model.

**Tech Stack:** Next.js 15, Cloudflare D1 (SQLite), TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-catalogue-brand-tier-design.md`

**Gates (each task):** `npm run test:unit` green + `npx tsc --noEmit` clean. Final: `npx opennextjs-cloudflare build`. Migration `0048` applied to prod by Dan after merge.

**Note on alias tidy-up:** the spec mentioned UPDATEing promoted brand names out of generics' aliases. The matcher change in Task 2 (exact name before alias) makes a brand entry win over a generic's alias regardless, so the alias tidy is unnecessary and is dropped to keep `0048` low-risk (ADD COLUMN + INSERT only).

---

### Task 1: Migration 0048 — `generic` column + brand seed

Authored as part of this task (data is curated like 0047). `migrations/0048_catalogue_brand_tier.sql`: `ALTER TABLE pouriq_ingredient_catalogue ADD COLUMN generic TEXT;` then INSERT ~70-90 UK on-trade brand rows. Each brand: `name`, `normalised_name` (lower/punct/accent-free), `ingredient_type` (= its generic's type), `base_unit`/`default_pack_size` (= its generic's), `aliases` (minimal), `generic` (= an existing generic's `normalised_name`, or NULL for standalone ales). Coverage: lagers (Carling, Foster's, Carlsberg, Stella Artois, Madrí, San Miguel, Peroni, Birra Moretti, Amstel, Heineken, Coors, Cruzcampo, Asahi, Estrella, Camden Hells), stout/ale (Guinness→stout; Neck Oil/Camden Pale→ipa; Doom Bar/Hobgoblin/Old Speckled Hen→null), cider (Thatchers, Strongbow, Aspall, Inch's, Kopparberg, Rekorderlig, Magners), vodka (Smirnoff, Absolut, Russian Standard, Grey Goose, Belvedere, Ciroc, Glen's), gin (Gordon's, Bombay Sapphire, Tanqueray, Beefeater, Hendrick's, Whitley Neill, Sipsmith, Brockmans), rum (Bacardi→white rum, Captain Morgan/Kraken/Sailor Jerry→spiced rum, Havana Club→aged rum, Lamb's→dark rum, Wray & Nephew→overproof rum, Malibu→coconut rum), whisky (Jack Daniel's/Famous Grouse/Bell's/Monkey Shoulder→whisky, Jim Beam/Maker's Mark/Woodford Reserve→bourbon, Jameson→irish whiskey, Glenfiddich/Glenmorangie→single malt scotch), tequila (Jose Cuervo, Olmeca, Patrón, El Jimador), cognac (Courvoisier, Hennessy, Rémy Martin), vermouth/aperitif (Martini Rosso→sweet vermouth, Martini Extra Dry/Noilly Prat→dry vermouth, Lillet→aperitif wine).

**Files:**
- Create: `migrations/0048_catalogue_brand_tier.sql` (authored in this task)
- Test: `tests/unit/lib/pouriq-brand-tier-migration.test.ts`

- [ ] **Step 1: Author the migration**, then validate in-memory (pre-create + apply 0047, then 0048): row count rises, `generic` column present, every brand's `generic` (when not null) matches an existing generic's `normalised_name`, no duplicate `normalised_name`.
- [ ] **Step 2: Write the test** — applies 0047 then 0048 in-memory; asserts `generic` column exists; a sample brand (`carling`) has `generic='lager'`, `ingredient_type='beer'`, `base_unit='ml'`; `smirnoff` has `generic='vodka'`; total rows > 180; no duplicate normalised_name; no brand's `generic` points at a missing generic.
- [ ] **Step 3: Run** `npm run test:unit -- pouriq-brand-tier-migration` (PASS).
- [ ] **Step 4: Commit** `feat(pouriq): catalogue brand tier — generic column + brand seed (migration 0048)`.

---

### Task 2: Matcher — specific beats generic (`src/lib/pouriq/ingredient-catalogue.ts`)

- [ ] **Step 1: Write failing tests** (extend `tests/unit/lib/pouriq-ingredient-catalogue.test.ts`). Add brand+generic entries (with `generic` field) and assert:
  - exact name beats a generic's alias: a Vodka generic with alias `smirnoff` + a Smirnoff brand entry → `matchCatalogue('smirnoff')` returns Smirnoff.
  - brand beats generic on a subset tie: a Lager generic + a Carling brand (`generic:'lager'`) → `matchCatalogue('Carling Lager')` returns Carling.
  - `adoptionName('Carling Lager', lagerEntry)` === 'Carling Lager'; `adoptionName('triple sec', tripleSecEntry)` === 'Triple Sec'; `adoptionName('Smirnoff Red Vodka', vodkaEntry)` === 'Smirnoff Red Vodka'.

- [ ] **Step 2: Implement.** Add `generic: string | null` to `CatalogueEntry` and `CatalogueRow`; add `generic` to the `listCatalogue` SELECT and row map. Change `matchCatalogue`:
  - Exact pass split in two: `entries.find(e => e.normalised_name === targetNorm)` first; then `entries.find(e => e.aliases.includes(targetNorm))`.
  - In the scored sort, tiebreak by brand: `scored.sort((a, b) => a.score - b.score || (a.entry.generic ? 0 : 1) - (b.entry.generic ? 0 : 1))`.
  Add and export:
  ```ts
  export function adoptionName(extractedName: string, entry: CatalogueEntry): string {
    const ext = significantTokens(extractedName)
    const cat = significantTokens(entry.name)
    const strictSuperset = cat.length > 0 && cat.every((t) => ext.includes(t)) && ext.length > cat.length
    return strictSuperset ? extractedName.trim() : entry.name
  }
  ```
  (Import `significantTokens` is already imported in this file.)

- [ ] **Step 3: Run** `npm run test:unit -- pouriq-ingredient-catalogue` (PASS) + `npx tsc --noEmit` (the catalogue test factory `c(...)` must add `generic: null`).
- [ ] **Step 4: Commit** `feat(pouriq): catalogue matcher prefers specific brand over generic`.

---

### Task 3: Menu-import collapse fix (`src/app/api/pouriq/import/extract/route.ts`)

- [ ] **Step 1:** Import `adoptionName` from `@/lib/pouriq/ingredient-catalogue`.
- [ ] **Step 2:** In the catalogue match construction, change `name: cat.name` to `name: adoptionName(i.name, cat)`. (`ImportPreview` already prefills `name: m.name`, so it inherits the fix.)
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `feat(pouriq): keep specific line names on menu-import catalogue adoption`.

---

### Task 4: Invoice new-library UI onto the purchase model

Bring `InvoiceLineRow`/`InvoicePreview` from `new_pricing_mode`/`new_pack_size` to the purchase model (`base_unit`/`pack_size`/`purchase_qty`), mirroring `IngredientMatchRow`. No catalogue yet (Task 5).

**Files:** `src/components/pouriq/InvoiceLineRow.tsx`, `src/components/pouriq/InvoicePreview.tsx`, `src/app/api/pouriq/invoices/commit/route.ts` (+ `insertLibraryEntry` if it lacks `purchase_qty`).

- [ ] **Step 1:** `LineState['match']` `new` arm becomes `{ kind: 'new'; new_name: string; new_type: IngredientType; base_unit: 'ml'|'g'|'each'; pack_size: number; purchase_qty: number }`.
- [ ] **Step 2:** `InvoiceLineRow` `new` UI: replace the bottle/unit `<select>` + pack-size input with the `IngredientMatchRow` pattern — a `base_unit` select (Liquid ml / Weight g / Count each), a `pack_size` input (hidden when `each`), and a `purchase_qty` input ("how many does that buy?"). Keep the name + type inputs.
- [ ] **Step 3:** `InvoicePreview`: `handleToggleCreateNew` seeds `{ kind:'new', new_name, new_type:'spirit', base_unit:'ml', pack_size:700, purchase_qty:1 }`. `handleSave` builds `new_library: { name, ingredient_type, base_unit, pack_size, purchase_qty, price_p }` (drop the `isUnit` mapping).
- [ ] **Step 4:** `invoices/commit`: add `purchase_qty` validation (positive integer) to `validateBody`, and pass `purchase_qty: line.new_library.purchase_qty` into `insertLibraryEntry`. If `insertLibraryEntry` (in `ingredient-library.ts`) does not accept `purchase_qty`, add it (the import commit already persists it — match that signature). `CommitLineNewLibrary` type gains `purchase_qty: number`.
- [ ] **Step 5:** Run `npm run test:unit` + `npx tsc --noEmit`. Manually reason through the invoice create-new flow.
- [ ] **Step 6: Commit** `feat(pouriq): bring invoice new-library UI onto the purchase model`.

---

### Task 5: Invoice catalogue fallback

`src/app/api/pouriq/invoices/extract/route.ts` + `InvoicePreview`/`InvoiceLineRow`.

- [ ] **Step 1:** `PreviewLine['match']` gains a `catalogue` arm: `{ kind:'catalogue'; catalogue_id: string; name: string; ingredient_type: IngredientType; base_unit:'ml'|'g'|'each'; default_pack_size: number | null }`.
- [ ] **Step 2:** In the extract route, `listCatalogue(db)` once; in the line loop, when `matchInvoiceLine` is not `auto`, try `matchCatalogue(line.extracted_name, catalogue)`; if hit, emit `kind:'catalogue'` with `name: adoptionName(line.extracted_name, cat)`, else fall through to suggestions/no-match as today.
- [ ] **Step 3:** `InvoicePreview` initial `LineState`: for `l.match.kind === 'catalogue'`, seed a `new` match from the catalogue (`new_name: l.match.name`, `new_type: l.match.ingredient_type`, `base_unit: l.match.base_unit`, `pack_size: l.match.default_pack_size ?? (l.match.base_unit==='each'?1:700)`, `purchase_qty: 1`), `applied: false`, `unit_price_p: l.extracted_unit_price_p`.
- [ ] **Step 4:** `InvoiceLineRow`: show a "from catalogue — set your price" badge when `line.match.kind === 'catalogue'` (cosmetic), reusing the new-model `new` UI from Task 4.
- [ ] **Step 5:** Tests: extract returns a `catalogue` prefill for a line matching only the catalogue (pure-ish test on the mapping if extracted, else a focused assertion). Run `npm run test:unit` + `npx tsc --noEmit`.
- [ ] **Step 6: Commit** `feat(pouriq): invoice scanning matches the shared catalogue`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body notes: apply migration `0048` after merge (additive ADD COLUMN + brand seed; low risk); invoice UI now on the purchase model; costing/variance/stock unchanged.
