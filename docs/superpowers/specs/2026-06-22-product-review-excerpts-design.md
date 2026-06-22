# Product Review Excerpts — Design

**Date:** 2026-06-22
**Status:** Approved

## Problem

Trustpilot is now live (Starter tier — no API), and the brand has genuine product reviews. Shop product pages still show a "Reviews coming soon" placeholder in their Customer Reviews section. The homepage already surfaces *service* reviews via the consent-gated Trustpilot widget; product pages should surface *product* reviews.

## Solution

Curated, static review excerpts on product pages, populated from real Trustpilot reviews. Because Starter has no API, excerpts are hand-curated in a code data file (the brand pastes their reviews; the best are selected). Static content renders for everyone — good for AI/search and not subject to consent gating, since it is the brand's own copy, not Trustpilot's tracking script.

## Decisions (from brainstorming)

- **Storage:** a typed code data file keyed by product handle (no Sanity — keeps content out of the Studio bundle being slimmed next, and fits the paste-and-curate workflow).
- **Mapping:** strictly per-handle. Reviews show only on the exact product they were left for. Gift pack and 6-bottle pack keep the placeholder until they have their own.
- **No review JSON-LD** (`aggregateRating` / `review`): hand-curated excerpts on Starter would risk a Google review-markup penalty, and Trustpilot prefers its official integration. Visible, honest excerpts only.

## Architecture

### Data — `src/lib/product-reviews.ts`

```ts
export interface ProductReview {
  quote: string      // verbatim excerpt (trimmed with an ellipsis if shortened, never reworded)
  author: string     // reviewer display name as shown on Trustpilot
  rating: number     // 1–5, as left
  date?: string      // optional, e.g. "March 2026"
}

// Keyed by Shopify product handle. Only handles with reviews appear.
export const PRODUCT_REVIEWS: Record<string, ProductReview[]>

export function getProductReviews(handle: string): ProductReview[]
```
Populated during the build from the reviews the brand pastes (best 3–6 per product selected). Starts with the Expedition Spiced rum handle.

### Component — `src/components/ProductReviews.tsx`

Server component, props `{ reviews: ProductReview[] }`. Renders on-brand cards: the quote, reviewer name, a star rating (visual, gold), and the optional date. Below the cards, a short "Reviews from Trustpilot" attribution line linking to the brand's Trustpilot profile (`https://uk.trustpilot.com/review/jerrycanspirits.co.uk`). No tracking script, no consent gate.

### PDP wiring — `src/app/shop/product/[handle]/page.tsx`

In the existing "Customer Reviews" section: `const reviews = getProductReviews(handle)`. If `reviews.length > 0` → render `<ProductReviews reviews={reviews} />` in place of the placeholder; otherwise keep the current "Reviews coming soon" placeholder unchanged.

## Compliance / honesty guardrails

- Quotes are **verbatim** — curation may trim with an ellipsis but never rewords.
- Trustpilot **attribution + link** to the brand profile is always shown (expected practice for off-platform display).
- Only genuine, received reviews are used. No fabrication.

## Testing

Presentational. `npx tsc --noEmit`, `npx next lint`, `npm run build`. Manual: a handle with reviews renders the cards; a handle without (gift pack) still shows the placeholder. Optionally a tiny unit test on `getProductReviews` (returns `[]` for an unknown handle).

## Out of scope

- `aggregateRating` / review JSON-LD.
- The live Trustpilot product widget (curated static excerpts are the chosen surface).
- Self-serve editing in Sanity (deliberately code-resident for now).
- Changing the homepage service-review widget.

## No migration

Pure code + content. No schema or data migration.
