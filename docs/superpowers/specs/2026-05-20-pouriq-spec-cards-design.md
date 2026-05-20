# Pour IQ™ Spec Cards — Design Spec

**Date:** 2026-05-20
**Status:** Design approved; ready for implementation plan.

## Goal

Bar manager opens a Pour IQ™ menu, clicks "Spec cards," and gets a print-styled view of every drink as a one-page training reference. Each card shows what staff need: the ingredients with measures, the garnish, the manager's per-drink note, the brand-voiced description (so staff know how to talk about the drink), and a deep link to the Field Manual for full method and technique when the cocktail has a slug match.

Output mechanism is the browser's native print dialog. No new dependencies, no client interactivity, no schema changes.

## Why now

Pour IQ™ already holds every recipe and (when generated) every brand-voiced description. The "trivial dev" item from the backlog: re-render existing data into a different artefact. Hospo training churn is the single biggest operational pain for UK independents — staff turn over every fortnight and new starters need to come up to speed on the menu fast.

Shipping the spec card slice in time for the Thursday 21 May 2026 pilot meeting with The Bank Bar & Grill puts a concrete training artefact in front of Riccardo's team on day one of the 90-day pilot window.

## Scope

**In:**
- New route `/trade/pouriq/[menuId]/specs/` rendering every cocktail on the menu as a print-friendly card.
- New `SpecCard` component (presentational only).
- New "Spec cards" button on the menu detail page header, alongside the existing "Menu copy" button.
- Help guide section "Printing spec cards" drafted in Sanity-paste-ready form and committed alongside the code, per the help-guide style rule.

**Out (deferred to follow-on PRs):**
- Per-cocktail single-card routes (e.g. for QR-code-from-the-bar-back use).
- Flash-card quiz mode (interactive recall trainer).
- "New this week" briefing (changes-since-last-week view).
- New free-text fields on `pouriq_cocktails` for glassware, method, or build steps.
- Consolidating menu-page header buttons under an "Exports" grouping.

## Architecture

- **Pure re-render.** No new tables, no new server actions, no AI calls, no migrations.
- **Server component** at `src/app/trade/pouriq/[menuId]/specs/page.tsx`. Mirrors the file shape of the existing `/trade/pouriq/[menuId]/menu-copy/page.tsx`.
- **Access gate** via `checkPourIqAccess()` → `LicenceGate` on no-licence, redirect to `/trade/login` on no-session. Identical to other Pour IQ™ routes.
- **Data fetch** via existing `getMenu()` and `listCocktailsForMenu()` helpers in `@/lib/pouriq/menus`. Returns `CocktailWithIngredients[]` which already joins the library data, so the page does not run its own SQL.
- **Presentational** `SpecCard` component at `src/components/pouriq/SpecCard.tsx`. Server component (no `'use client'`).
- **Print behaviour** via Tailwind `print:` utilities plus a `break-before: page` rule on each card so the browser prints one card per page. The outer `<main>` element carries the existing `print-region` class (already defined in the menu page) so the surrounding layout chrome is suppressed in print exactly as it is on the menu report.

## Card content

Each card renders, in this order, with later sections conditionally omitted when their data is absent:

1. **Header.** Cocktail name (large, serif). Sale price (right-aligned, monospace numeric).
2. **Garnish line.** "Garnish: <comma-separated names>". Built by filtering `cocktail.ingredients` where `library.ingredient_type === 'garnish'` and joining the `library.name` values. Omitted if no garnish ingredients exist.
3. **Ingredients.** Bulleted list. Each line: `<measure>  <name>`. Measure formatting:
   - `pour_ml != null` → "{pour_ml}ml"
   - `unit_count != null && unit_count === 1` → "1 unit"
   - `unit_count != null && unit_count > 1` → "{unit_count} units"
   - Garnish ingredients are excluded from the ingredients list (they live on the garnish line above).
4. **Note.** Renders `cocktail.notes` as italic text. Omitted if `notes` is null or empty.
5. **Tell the customer.** H3 + `cocktail.description` rendered as a paragraph. Omitted if `description` is null or empty. Label uses brand-voice phrasing ("Tell the customer") rather than "Description" so staff understand the field's purpose.
6. **Full method & technique →.** Anchor link to `https://jerrycanspirits.co.uk/field-manual/cocktails/{field_manual_slug}/`. Omitted if `field_manual_slug` is null. Target `_blank` to preserve the staff's place on the spec sheet.

### Layout

Print-first. On-screen presentation is a single column of cards stacked vertically with generous spacing, matching the parchment-on-jerry-green palette used elsewhere in the trade portal. In print: each card uses `break-before: page` so a 20-drink menu prints as 20 pages. Print colours flip to black-on-white via `print:` utilities (same pattern as the existing menu page report and `TradeSheetShell`).

### Empty states

- **Menu has no cocktails.** Render a single message: "No drinks on this menu yet. Add or import drinks first." with a link to the menu detail page. No cards rendered, no print region.
- **Cocktail has no ingredients.** Card still renders. Ingredients section shows "No ingredients recorded yet." in italic muted text.
- **Cocktail has no garnish ingredients.** Garnish line omitted entirely (no "Garnish: —").
- **Cocktail has no notes.** Note section omitted entirely.
- **Cocktail has no description.** "Tell the customer" section omitted entirely.
- **Cocktail has no field_manual_slug.** "Full method & technique" link omitted entirely.

## UI entry point

One new button on the menu detail page (`src/app/trade/pouriq/[menuId]/page.tsx`), added inside the existing header action row, immediately after the "Menu copy" link:

```tsx
<Link href={`/trade/pouriq/${menuId}/specs`} className={SECONDARY_BUTTON}>Spec cards</Link>
```

Wrapped in the same `cocktails.length > 0` guard as the other action buttons. Uses the existing `SECONDARY_BUTTON` style for visual consistency.

## File changes

| File | Change |
|---|---|
| `src/app/trade/pouriq/[menuId]/specs/page.tsx` | New. Server component. Fetches menu + cocktails, renders title + SpecCard per drink. |
| `src/components/pouriq/SpecCard.tsx` | New. Presentational. Props: `CocktailWithIngredients` and `priceIncludesVat` (for the price label, matching menu-copy precedent). |
| `src/app/trade/pouriq/[menuId]/page.tsx` | One-line addition: "Spec cards" link in the header action row. |
| `docs/superpowers/specs/2026-05-20-pouriq-spec-cards-design.md` | This file. |

No filesystem artefact for the help guide section — content is drafted in this spec, ready for paste into Sanity Studio by the user. Matches the workflow established by the help guide infrastructure work (PR #681).

## Help guide section (drafted, ready for paste into Sanity Studio)

Per the help-guide style memory, every Pour IQ™ feature ships with a help guide section drafted in the same session. Voice rules from `feedback_pouriq_help_guide_style.md` apply: measured, direct, second-person, no em-dashes, no hype.

**Section title:** Printing spec cards

**Body (draft, ready for paste into Sanity Studio):**

> Spec cards turn the drinks on your Pour IQ™ menu into a one-page training reference for staff. Each card carries the ingredients, the measures, the garnish, any note you have added, the customer-facing description if you have generated one, and a link to the full Field Manual recipe when there is a slug match.
>
> **Where to find it.** Open the menu, look at the top-right action row, click "Spec cards."
>
> **What you get.** Every drink on the menu as its own card. On screen they stack down the page. In your browser's print dialog each card prints on its own page, so a twenty-drink menu prints as twenty cards. Print as many or as few as you need from the page-range selector.
>
> **Sections that are missing.** If a drink has no garnish, no note, no description, or no Field Manual link, the card leaves the section out rather than printing an empty placeholder. The card stays clean.
>
> **What to do next.** Print, laminate, hand to new starters. The card is the conversation, not the contract.

## Testing

Manual smoke tests on a local dev build:

1. **Happy path.** Open a menu with drinks that have ingredients, garnish, notes, descriptions, and field_manual_slug set. Confirm every section renders.
2. **Missing description.** Open a menu where some drinks lack descriptions. Confirm those cards omit the "Tell the customer" section cleanly.
3. **Missing field_manual_slug.** Confirm the link is omitted on those drinks.
4. **No ingredients.** Edit a drink to remove all ingredients. Confirm the card still renders with the fallback message.
5. **Empty menu.** Open a brand-new menu with no drinks. Confirm the empty-state copy.
6. **Print preview.** Open the browser print dialog. Confirm one card per page, no card splits across pages, colours flip to black-on-white, action buttons are hidden.
7. **Access gates.** Hit the route without a session (redirect to login) and without a licence (LicenceGate).
8. **Type check.** `npx tsc --noEmit` clean.

No automated test additions in this PR — matches the precedent set by `menu-copy` and `variance-lite`. Worth revisiting once Pour IQ™ has enough surface area to justify a testing harness.

## Demo path for the Thursday meeting

1. Log into the pilot's Pour IQ™ account at `/trade/login`.
2. Open The Bank Bar & Grill's menu from the Pour IQ™ dashboard.
3. Show the new "Spec cards" button on the header row.
4. Click through. Walk Riccardo's team through one card section by section.
5. Open browser print preview — one card per A4 page.
6. Discuss how the bar manager would use this for new-starter onboarding (print, laminate, hand over on day one).
7. Set expectations for the next iteration: build-method field, flash-card quiz mode, "new this week" briefing.

## Risks

- **Cards may feel thin for drinks where the manager has not added a note or description.** Acceptable for MVP — the card still carries genuine value (ingredients, measures, garnish, price, Field Manual link). Mitigation: in the demo, point to the note and description fields as "where to capture the venue-specific build for full classical-spec output," which positions the deferred "Build & serve" field as the natural next iteration.
- **Print output varies by browser.** Mitigation: test in Chrome (primary), Safari, and Firefox locally before merging. Page-break behaviour is well supported in all three.
- **Menu length.** A 50-drink menu prints 50 pages. Not actually a problem — managers will print the subset they need via the page-range selector. Worth a sentence in the help guide.

## Open questions

None at spec-approval time. If implementation surfaces ambiguity, the answer defaults to "match the menu-copy precedent."
