# Pour IQ — Finish the Menu Builder (reorder + logo/theme + photos)

Date: 2026-06-30
Status: Design agreed; ready for implementation plan.

## Goal

Complete the menu-builder studio so a venue can hand a designer a ~90%-done menu: (1) reorder drinks within a section, (2) brand it with a logo + a theme, (3) add dish photos. Three independently-shippable pieces.

## Migration 0060

```sql
ALTER TABLE pouriq_menus ADD COLUMN theme TEXT NOT NULL DEFAULT 'clean';
ALTER TABLE pouriq_menus ADD COLUMN logo_r2_key TEXT;
ALTER TABLE pouriq_menus ADD COLUMN logo_align TEXT NOT NULL DEFAULT 'center';
ALTER TABLE pouriq_cocktails ADD COLUMN photo_r2_key TEXT;
```
Additive; safe defaults. `MenuRow` gains `theme: MenuTheme`, `logo_r2_key: string | null`, `logo_align: LogoAlign`; `CocktailRow` gains `photo_r2_key: string | null` (the `SELECT *` / field-by-field cocktail mappers in `menus.ts` must carry `photo_r2_key` — tsc will flag the typed ones).

---

## Piece 1 — Drink reorder within a section

Today `moveDrinkTo` early-returns when a drink is already in the target section, drops always append (`position = count`), and `listCocktailsForMenu` orders by `name` — so drink order is alphabetical and not position-driven.

- **Order by position:** change cocktail reads used by the builder/menu to `ORDER BY position ASC, name COLLATE NOCASE ASC` (`menus.ts:159` and the join read ~479). `position` defaults to 0, so behaviour is unchanged until positions are set.
- **`MenuBuilder` Drink** gains `position: number`; `buildViewModel`'s `drinksFor(sectionId)` sorts by `position`.
- **Drag-to-position:** each drink row becomes a drop target (`onDragOver`/`onDrop`). On dropping drink X onto/near drink Y, insert X at Y's index within Y's section. Dropping on a section body (existing behaviour) appends. Same-section reorder is allowed (remove the early-return).
- **Persistence:** add `reorderDrinks(db, menuId, sectionId | null, orderedCocktailIds)` (data layer) + `reorderDrinksAction(menuId, sectionId, orderedCocktailIds)` (server action, tenant-scoped, `revalidatePath`) that sets, for each id in order, `section_id = sectionId` and `position = index`. On a drop, the component computes the target section's new ordered id list (with the dragged drink inserted at the drop index) and calls it. Optimistic local update + revert on failure, matching the existing pattern. Keep the temp-section guards.
- Pure helper `insertAt(orderedIds, movedId, index)` → new ordered array (unit-tested).

---

## Piece 2 — Logo + theme

### Theme presets (pure)
- `src/lib/pouriq/menu-theme.ts`: `MENU_THEMES = ['heritage','premium','clean','casual','bold','classic'] as const`; `MenuTheme` union; `menuTheme(theme): { page, title, sub, section, drinkName, price, desc }` → Tailwind class tokens per theme (font + colours + spacing bundled). Pure, unit-tested (each theme returns a token set).
- The built menu (`MenuBuilder` preview + print) and a theme `<select>` control apply `menuTheme(menu.theme)`. The theme is saved on the menu via a `setMenuThemeAction(menuId, theme)`.

### Logo
- **Upload + serve via the shared R2 image pattern (below).** Upload to `pouriq-menu-logos/${tradeAccountId}/${menuId}`; store the key in `pouriq_menus.logo_r2_key`. Serve route `GET /api/pouriq/menus/[menuId]/logo` (auth + tenant-scoped via `getMenu`; inline image; 404 when no key).
- **Alignment:** `logo_align: 'left' | 'center' | 'right'` (default center), a small control; applied to the logo container in the built menu.
- The builder shows an "Upload logo" control (and "Remove logo") + the alignment toggle, persisting via `setMenuLogoAlignAction` and the upload route (which sets `logo_r2_key`).

---

## Piece 3 — Dish photos

- A photo belongs to the **drink** (`pouriq_cocktails.photo_r2_key`), uploaded **on the cocktail editor** (`CocktailForm`) via the shared image upload (key `pouriq-drink-photos/${tradeAccountId}/${cocktailId}`), with "Remove photo". Serve route `GET /api/pouriq/cocktails/[cocktailId]/photo` (auth + tenant-scoped; inline image; 404 when none).
- **Shown on both** the built menu and the spec cards, each with its **own on/off toggle** (local `useState`, default on when any drink has a photo). The built menu renders a small thumbnail beside the drink; `SpecCard` renders the photo when the toggle is on.
- Photos toggle + the photo are `print`-aware (they print).

---

## Shared: R2 image upload + serve

- **Upload route** `POST /api/pouriq/images/upload` (or two focused routes) — nodejs runtime; auth via `checkPourIqAccess`; accepts a `multipart/form-data` image (`image/png`, `image/jpeg`, `image/webp`), size cap (e.g. 5 MB); validates the target (menu or cocktail) belongs to the tenant; `r2.put` to `TRADE_DOCS` at the computed key with the real `contentType`; sets the owning row's `*_r2_key`; returns ok. Reject non-image / oversize.
- **Serve routes** mirror the invoice pdf route: auth + tenant ownership + `r2.get(key)` + inline response with the stored `contentType`; 404 when missing. nodejs runtime (NOT edge — OpenNext).
- Display uses `<img src="/api/pouriq/menus/${menuId}/logo">` / `.../cocktails/${id}/photo` (a cache-busting query on the key/updated_at to refresh after re-upload).

---

## Scope

- **IN:** the three pieces + migration 0060 + the shared image upload/serve. Logo/photos are images; the invoice flow stays PDF-only (separate).
- **OUT (noted):** granular font/colour pickers; an accent-colour picker (themes carry colour); multiple logos; photo cropping/editing; per-section themes; reordering by anything other than drag/position.

## Testing

- **Unit (pure):** `insertAt` (reorder math); `menuTheme` (each theme → a token set, unknown → a safe default).
- **Migration 0060:** node:sqlite — columns added with defaults; existing rows get `theme='clean'`, `logo_align='center'`, null keys.
- **Routes:** the upload (auth + image-type + tenant + size) and serve (auth + tenant + inline) — reasoned + matched to the invoice pdf/pending routes; confirm nodejs runtime.
- **Set-point/flow-through:** `tsc` forces the new `MenuRow`/`CocktailRow` fields through the mappers; fix any test fixtures.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + **`npx opennextjs-cloudflare build`** green (the new routes); `package.json`/lock/configs unchanged; **no new npm dependencies**.

## Risks / notes

- **OpenNext:** all new routes nodejs runtime (no edge) — an edge route broke the build before.
- **Native DnD reorder:** dropping onto a drink row vs the section body needs care so both insert-at-position and append work; the keyboard up/down fallback should extend to drinks (not just sections) for accessibility — add per-drink up/down move buttons.
- **Image cache:** after re-upload the R2 key path is stable, so add a cache-buster (`?v=${updated_at}`) to the img src so the new image shows.
- Migration **0060** (0059 = cost confidence, in main). Apply to prod after merge.
- Reads ordering change (name → position,name) affects every `listCocktailsForMenu` consumer; position defaults to 0 so it stays name-ordered until a venue reorders — verify the menu detail + spec cards still read sensibly.
