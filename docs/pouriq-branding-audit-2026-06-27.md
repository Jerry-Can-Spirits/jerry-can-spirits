# Pour IQ — Visual Branding Current State & Gaps

Date: 2026-06-27
Purpose: An accurate read of how the Pour IQ trade app looks today versus the Jerry Can Spirits consumer brand, to drive a design/branding pass before authoring the new full-menu E2E script. Audit-only; no code changed.

> **DIRECTION (Dan, 2026-06-27) — read this first; it overrides §4's original recommendation.**
> Pour IQ should be its **own** product brand, **not** an extension of the rum. B2C (JCS, bold/military/adventurous) and B2B (Pour IQ, bar operators wanting reliability/clarity/professionalism) are different markets. So: give Pour IQ a **distinct, lighter, software-feeling identity** — **blues / teals / emeralds** rather than the JCS bronze/olive/military green-and-gold, plenty of whitespace, dashboards that feel like software not packaging. **Keep only subtle family cues**: a related typeface and the plain-English, lightly-humorous voice; maybe one or two accent colours. **No prominent JCS logo in-app** — just a quiet line: **"Pour IQ — Built by Jerry Can Spirits."** Sections 1–3 below (current state) still stand; the recommendation in §4 has been rewritten to match this direction.

---

## 1. The consumer brand (the baseline to echo)

Defined in `src/app/layout.tsx` + `src/app/globals.css` (`@theme`).

**Palette (always dark, no light mode):**
- Greens: `jerry-green-900 #1a442e` (dominant bg), `-800 #1e5337` (cards), `-700 #236842` (borders), `-950 #0e2519` (footer), `-400 #5abb81` (hover accent).
- Gold (single pop accent, used sparingly): `gold-500 #f59e0b`, `-600 #d97706`, `-300 #fcd34d`, `-400 #fbbf24`.
- Parchment (warm off-white text): `-50 #fefdfb` → `-400 #e9d8b7`. Pure white only inside third-party badge cards.

**Type:** Playfair Display (700) for ALL headings; Inter for body/labels; JetBrains Mono for the cartographic coordinate labels (the "field equipment" cue).

**Signatures the trade app should carry:**
1. The green/gold/parchment palette, never a light theme.
2. Playfair Display headings.
3. Gold as a sparing single accent.
4. The **cartographic / expedition motif** (topographic contours, compass rose, coordinate grid in low-opacity gold on green) — the single most distinctive, differentiating system on the consumer site. Reads as field kit, not nightclub.
5. The rounded-full gold-bordered **overline pill** label on section headers.
6. Glassmorphic cards (parchment-gradient over green, gold hairline border).
7. Veteran credentials (AFC, ERS Bronze, British Veteran Owned) always on white cards.
8. The "etched/engraved" tactile quality (footer logo is a dedicated etch variant `/images/logo-etch.webp`).

Logo: primary wordmark via Cloudflare Images CDN (header `h-12`); footer "etch" variant; local copy `public/media-kit/logos/Jerry Can Spirits Logo.png`.

---

## 2. The Pour IQ trade app today

`src/components/pouriq/SiteChrome.tsx` strips the consumer Header/Footer/cartographic background for `/trade` Pour IQ routes — the authenticated app is a clean island.

**What carries the brand (working):**
- Full green/gold/parchment palette applied consistently across shell, tables, cards, forms.
- Serif headings, uppercase tracked-wide section labels, gold overline pills, glassmorphic cards — the consumer visual language is present.
- A disciplined 3-tier button system (`src/lib/pouriq/button-styles.ts`): primary `bg-gold-500 text-jerry-green-900`, secondary gold-outline, destructive red.
- Most polished pages: ingredient library, Today dashboard, invoices.

**What's absent or off (branding rough edges, by priority):**

1. **No Jerry Can attribution anywhere in the authenticated app.** `PourIqShell.tsx` header shows "Pour IQ™" + venue name, no logo/wordmark. `/trade/landing` and `/trade/login` show only a "Trade Portal" pill. A venue using Pour IQ daily has no visual connection to the brand that built it. **Biggest gap.**
2. **The expedition/cartographic motif is entirely stripped** from the app (SiteChrome removes it). Defensible for data density, but there's zero textural nod to the brand story — even a faint watermark/texture on chrome or the dashboard would reconnect it.
3. **Heading font mismatch.** Trade app headings use `font-serif` (→ Georgia per the `globals.css` token `--font-serif: Georgia,...`), NOT `font-display` (Playfair Display). So trade headings are Georgia while the consumer site is Playfair — subtly but genuinely off-brand. Files: every page H1 + `KpiCards.tsx`, `MenuListCard.tsx`, `IntegrationCard.tsx`, etc.
4. **The "Return to trade account" exit link is styled destructive** (red border/text) in `PourIqShell.tsx` — red = delete in this system; a nav exit shouldn't read as danger. (Note: this was the link reworded/recoloured red in PR #827 on request — worth revisiting the colour choice.)
5. **Login submit is a one-off gold gradient** (`from-gold-600 to-gold-500`) while every other primary button is flat `bg-gold-500`. High-visibility inconsistency.
6. **Empty states + status colours are neutral/generic SaaS** ("No invoices yet…"; default `emerald/amber/red/sky` for status) — not wrong, but carry no brand voice or bespoke palette.

---

## 3. Customer-facing outputs (spec cards, menus, reports)

These are artefacts a bar prints/hands out — a stated selling point ("replaces £300–500 agency menu spend"). Today none are white-labelable to the bar.

| Artefact | Brand shown | State |
|---|---|---|
| Spec cards | Pour IQ™ (print header) + a `jerrycanspirits.co.uk` Field Manual link on any cocktail with a slug | Functional; not the bar's brand |
| Customer menu builder | None at all (no header/footer/venue name) | Bare list: title + drink + price + description |
| Menu copy export | None (plain text/markdown — correctly a designer handoff) | Fine as-is |
| Menu report | Pour IQ™ (print header) | Operator-facing KPIs |
| Order report | None | **Bug: missing `print-region` → near-invisible text on white** |

**Gaps:**
- No venue logo upload / colour theming / font choice anywhere (`trade_accounts` has only `venue_name`; no `logo_url`/`brand_color`). Every bar's output looks identical and unbranded.
- Customer menu has no venue header/footer, no section grouping (Classics/Signatures), no photography slot — not a finished menu.
- No "suppress Pour IQ branding / white-label" option for bars pitching their own management.
- Print fidelity: order report missing `print-region`; `MenuMatrix` quadrant border colours flatten to grey in print (Winners/Promote/Fix/Review become indistinguishable); 2-col `columns` print is browser-unreliable; no `@page` size/orientation declared.

---

## 4. Recommended branding direction (REWRITTEN to Dan's 2026-06-27 direction)

Pour IQ = its own product brand, "Built by Jerry Can Spirits". The goal of the design pass is a **distinct, lighter, professional software identity**, not echoing the rum brand.

**Establish the Pour IQ identity (the core design work)**
- **Define a Pour IQ palette** in the cool family — blues / teals / emeralds as the primary, with one or two accents — replacing the jerry-green/gold/parchment carried over from the consumer site. Lighter surfaces and generous whitespace; dashboards that read as software, not packaging. (The recent redesign wireframes were already moving this way — continue.)
- **Attribution, subtle:** a quiet "Pour IQ — Built by Jerry Can Spirits" line (e.g. footer of the shell / login), **no prominent JCS logo** in the app.
- **Family cues to keep:** a related typeface (so there's a quiet resemblance) and the plain-English, lightly-humorous, no-jargon voice. Do **not** import the JCS cartographic/military motif.

**Straightforward edits that hold regardless of palette**
- Re-colour the "Return to trade account" exit link off destructive red to a neutral/muted treatment.
- Make the login submit use the standard flat primary button (drop the one-off gradient).
- Fix print bugs: add `print-region` to the order report; remap `MenuMatrix` quadrant borders for print; declare `@page` size.
- Brand-voice the empty states in the new (plain, professional) Pour IQ tone.

**Product decision (roadmap, not a quick edit)**
- White-label of customer outputs: venue `logo_url` + `brand_color` + font choice, a venue header/footer on the customer menu, and a Pour IQ-attribution toggle. Both a branding fix and a pricing/tier lever (ties to [[project_pouriq_pricing_positioning]] — the "replaces agency spend" claim).

**Note:** a palette change touches the shared token layer (`globals.css @theme`) + the `button-styles.ts` constants + every `jerry-green-*/gold-*/parchment-*` usage in `src/components/pouriq` and `src/app/trade`. It's a real design pass (brainstorm → spec → plan), not a one-PR tweak. See [[project_pouriq_brand_identity]].

---

## 5. Functional current-state map (for the new E2E script)

The **cocktail path is clean end-to-end**: import (paste/PDF/spreadsheet → AI extract → compound-split → match against library + shared catalogue → adopt/price → commit) → costing (net-of-VAT purchase model, prepared sub-recipes, serve units) → menu/GP (matrix, balance, movers) → POS volumes (Square live + webhook; SumUp/Zettle OAuth; others typed-but-inert) → variance v2 (timestamped rolling counts, reason codes, perpetual on-hand) → invoice scan → cost-change ripple. Migrations 0015–0054. Multi-tenant by `trade_account_id`; all licence tiers currently behave identically (no per-tier gating yet). AI is Claude `claude-sonnet-4-6` throughout.

**Gaps that block the WHOLE-menu E2E (the real blockers, prioritised):**
1. **BUG / blocker — menu import rejects `cider` + `alcohol-free`.** `src/app/api/pouriq/import/commit/route.ts` `INGREDIENT_TYPES` omits both (the invoice-commit twin was fixed in #828, but this import route was missed) → 400 on those types. A Bank menu with cider/AF can't import end-to-end. **Needs independent verification, then a one-line fix.**
2. **No menu sections / item types** — `pouriq_cocktails` has no `category`/`section`/`item_type`; beers, wines, spirits, soft drinks, food all collapse into "cocktails".
3. **Single `target_gp_pct` per menu** — food (~65%) and drinks (~75%) under one target makes matrix/balance/attention misleading.
4. **Cross-type threshold pollution** — matrix/movers/balance pool all items, so a high-volume beer inflates the popularity threshold and buries cocktails.
5. **Post-mix / bag-in-box not modelled** (no dispense costing, not in catalogue); **kegs not first-class** (keg-size chips not rendered in the form; pint relies on a manual serve unit).
6. **Unit-count ingredients excluded from variance** (`pour_ml IS NOT NULL`) and par/stock is ml-only — bottled beer/cans get no variance or reorder.
7. **No ABV, no allergens** anywhere; import drops `pack_format`/`subcategory` at commit; invoice VAT toggle is global (no mixed-rate); invoice commit not idempotent (retry duplicates).
8. Export is browser-print only; some dead code (`target_menu_id`, v1 variance loader).

**Implication:** the new E2E script can run the cocktail path now, but a true whole-menu pass needs (at minimum) the cider/AF import fix, then the structural pieces — menu sections + per-category GP targets + non-ml stock/variance. Those structural items are NEW capability (roadmap), not edits.
