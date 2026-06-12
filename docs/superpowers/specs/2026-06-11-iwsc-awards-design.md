# IWSC 2026 Awards on Product Pages — Design

**Date:** 2026-06-11
**Status:** Approved pending user review

## Background

Jerry Can Spirits took two medals at the IWSC 2026 Spirits Awards:

- **Bronze** — Expedition Spiced
- **Silver** — Expedition Spiced and cola (add-on entry, judged in partnership with Franklin & Sons)

Official medal artwork is licensed and already uploaded to Cloudflare Images:

| Medal | Variant | Image ID |
|---|---|---|
| Bronze | Large PNG | `863f3ff8-7252-477f-9627-a805f6c6a100` |
| Bronze | Small PNG | `66191572-4bf8-4de0-ba4d-01aab5c20700` |
| Silver (Rum & Cola) | Large PNG | `2f7661db-3571-44d1-ee15-8bbd3c3cfd00` |
| Silver (Rum & Cola) | Small PNG | `2558fe93-bdf0-458c-85d6-5de6097ed300` |

Delivery URL pattern: `https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/<image-id>/public`. Both Large PNG URLs verified returning 200. The custom image loader (`src/lib/cloudflareImageLoader.ts`) already rewrites `imagedelivery.net` URLs to flexible variants (`w=`, `q=`), and the hostname is whitelisted in `next.config.ts` remotePatterns and CSP `img-src`.

## Scope (user-confirmed)

1. Medal badges on all three Expedition Spiced product pages: rum bottle, premium gift pack, 6-bottle trade pack.
2. Both medals added to the homepage `PressAwards` Accreditations list.
3. schema.org `award` property added to Product JSON-LD on the same three product pages.

Placement on product pages: beside title and price, between the price block and the description (user-selected over a dedicated section).

## Approach

Hardcoded component keyed by product handle — matches the existing `PressAwards` pattern. No Sanity schema changes, no Shopify metafields. Awards change at most yearly; a code edit is the cheapest maintenance path.

## Components

### New: `src/components/ProductAwards.tsx`

Server component. Exports:

- `PRODUCT_AWARDS`: award data array — medal image URL (Large PNG), title, citation, plain-text string for JSON-LD.
- `AWARDED_HANDLES`: the three product handles that display awards:
  - `jerry-can-spirits-expedition-spiced-rum`
  - `jerry-can-spirits-premium-gift-pack`
  - `jerry-can-spirits-expedition-pack-spiced-rum-6-bottles`
  (same trio as `getIngredientsSlug` in the product page)
- Default export: renders the two medals side by side at ~80px via `next/image`, each with a one-line caption in parchment text. Styling follows existing product-info column conventions (gold/parchment palette, no new design tokens).

Caption copy (brand voice — no em-dashes, no hype):

- **IWSC 2026 Bronze.** Expedition Spiced.
- **IWSC 2026 Silver.** Expedition Spiced and cola, judged with Franklin and Sons.

Alt text mirrors the captions.

### Changed: `src/app/shop/product/[handle]/page.tsx`

- Render `<ProductAwards />` between the price block and the description when `AWARDED_HANDLES.includes(handle)`.
- Add to `productSchema` for the same handles:
  ```
  award: [
    'IWSC 2026 Bronze Medal - Expedition Spiced',
    'IWSC 2026 Silver Medal - Expedition Spiced and Cola',
  ]
  ```

### Changed: `src/components/PressAwards.tsx`

- Add optional `image` (URL) field to `AwardItem`.
- Add two entries with `year: '2026'` using the Small PNG variants as thumbnails (~48px), rendered in place of the gold dot when present.
- Copy (title / body fields):
  - title: **IWSC 2026 Bronze Medal**, body: Expedition Spiced. International Wine and Spirit Competition.
  - title: **IWSC 2026 Silver Medal**, body: Expedition Spiced and cola, judged with Franklin and Sons.

## Error handling

None beyond existing behaviour. Images are static CDN assets; if one fails to load, alt text renders. No new failure modes introduced.

## Testing

- `npm run build` and type checks (CI gate).
- Manual: rum product page shows both medals between price and description; gift pack and trade pack pages show the same; other product pages (barware, clothing) unchanged; homepage Accreditations list shows four items, two with medal thumbnails.
- Validate Product JSON-LD on the rum page includes the `award` array (view source or Rich Results test).

## Out of scope

- Awards on shop listing cards or collection pages.
- Sanity or Shopify data modelling for awards.
- The PDF certificates (print assets, not used on the site).
