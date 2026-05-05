# Presentation Box Cart Upsell. Design

**Date:** 2026-05-05
**Branch:** chore/fix-build-warnings (work to be moved to a new feature branch)
**Status:** Ready for plan

## Context

The Expedition Spiced Rum presentation box has been added to Shopify as a standalone product (handle: `jerry-can-spirits-expedition-spiced-rum-presentation-box`). It is no longer bundled by default with the rum. We need a deliberate, image-led upsell in the cart drawer that surfaces only when the rum is in the cart, plus inclusion on a small set of collection pages where the box fits naturally.

## Goals

1. Offer the presentation box as a clear, image-led upsell in the cart drawer when the rum is present.
2. Allow the customer to choose how many boxes to add (one per rum bottle is the considerate cap).
3. Keep the upsell visible after adding so customers can add more without scrolling to the line item.
4. Surface the box on collection pages where it fits the merchandising theme.

## Non-goals

- Creating the bottle+box bundle product in Shopify. That is a separate Shopify task; once created, it will appear in the `bundles` collection automatically with no code changes.
- Modifying the rum product page or its "What's Included" content. If the rum copy currently implies a box is bundled, that is a separate edit.
- Adding new analytics events. The cart context already fires GA4/Meta tracking on `addToCart`.
- Adding the box to `spiced-rum`, `new-releases`, `cocktail-making-kits`, or any collection beyond the three identified below.

## Constants

- `BOX_HANDLE = 'jerry-can-spirits-expedition-spiced-rum-presentation-box'`
- `RUM_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'`

## Component: `PresentationBoxUpsell`

A new client component at `src/components/PresentationBoxUpsell.tsx`, rendered in `src/components/CartDrawer.tsx` immediately above the existing `<CartUpsell />` block in the footer.

### Data fetching

On mount, fetch the box product via `getProduct(BOX_HANDLE)`. Cache the first variant ID and the first product image. Match the pattern used by `CarbonOffsetToggle`.

### Render conditions

- If the variant ID has not loaded yet, return `null`.
- If no line in the cart has `merchandise.product.handle === RUM_HANDLE`, return `null`.
- Otherwise render the card. Visibility persists after a box is added.

### Quantity stepper

- Compute `rumQuantityInCart = sum of line.quantity for all cart lines where product.handle === RUM_HANDLE`.
- The stepper allows values from `1` to `rumQuantityInCart`.
- Default value is `1`.
- A `useEffect` watching `rumQuantityInCart` clamps the selected quantity down whenever the rum quantity drops below the current selection.
- If `rumQuantityInCart` is `0`, the card is not rendered (covered by render conditions above).

### Add behaviour

- Clicking Add calls `addToCart(variantId, selectedQuantity)`.
- Shopify's cart merge increments any existing line for the same variant. We rely on this; we do not manually look up the existing line and call `updateQuantity`.
- Button shows `Add £X` where `X` is `boxPrice × selectedQuantity`, formatted with the existing `formatPrice` helper.
- Button is disabled while a cart mutation is in flight (`isLoading` from `useCart()` or a local `isAdding` flag, mirroring `CarbonOffsetToggle`).

### Layout

Single horizontal card, distinct from the 2x2 accessories grid below it.

```
┌─────────────────────────────────────────────┐
│ ┌──────┐  Add the presentation box.         │
│ │ img  │  Built for gifting. Adds £X each.  │
│ │      │                                    │
│ │      │  [ − ] 1 [ + ]      [ Add £X ]    │
│ └──────┘                                    │
└─────────────────────────────────────────────┘
```

- Image: ~80px square, `object-contain` on a `bg-jerry-green-800/20` plate, sourced from `product.images?.[0]` with `altText` fallback.
- Headline: `text-gold-300`, weight semibold.
- Sub-copy: `text-parchment-400`, smaller.
- Stepper: visually consistent with the cart line-item stepper (same icons, same `min-w-[44px] min-h-[44px]` touch targets, same `bg-jerry-green-800/50` styling). Increment is disabled when at max; decrement is disabled when at min (1).
- Add button: `bg-gold-500 hover:bg-gold-400 text-jerry-green-900` matching the existing checkout button style, smaller padding to fit inline.
- Container: `bg-jerry-green-800/30 rounded-lg border border-gold-500/20 p-4` matching the `CartUpsell` card aesthetic.

### Copy

- Headline: `Add the presentation box.`
- Sub-copy: `Built for gifting. Adds £X each.` where `X` is the formatted box price using the existing `formatPrice` helper (which renders `£10.00` style with two decimals).
- Add button label: `Add £X` where `X` is `boxPrice × selectedQuantity`, formatted via `formatPrice`. (Sub-copy shows the per-unit price; the button shows the total being added.)

No em-dashes, no exclamation marks, no manufactured urgency. Brand voice: direct and grounded.

### Accessibility

- Stepper buttons: `aria-label="Decrease box quantity"` and `aria-label="Increase box quantity"`.
- Quantity: rendered as plain text (or `<span aria-live="polite">` if we want screen readers to announce changes).
- Add button: `aria-label` includes the total price (e.g. `Add 2 presentation boxes for £20.00`).

## Placement in `CartDrawer.tsx`

Insert `<PresentationBoxUpsell />` between the discount-codes block and `<CartUpsell />`. Specifically, place it directly above `<CartUpsell />` at the existing call site (line 619 in the current file). It does not depend on or interact with the gift toggle or carbon offset.

## Collection page changes

Edit `src/lib/categories.ts` only. No copy changes to `introBody`, `seoBody`, or `pillars`. Append `'jerry-can-spirits-expedition-spiced-rum-presentation-box'` to `productHandles` for:

- `rum-gifts`: append after `jerry-can-spirits-premium-gift-pack`.
- `gifts-for-him`: append at the end.
- `gifts-for-her`: append at the end.

No additions to `spiced-rum`, `new-releases`, `cocktail-making-kits`, `bar-accessories`, or `bundles` (the bundles collection is Shopify-driven and will pick up the bottle+box bundle product automatically once you create it).

## Edge cases

- **Multiple rum lines via different variants.** If the rum has multiple variants and the customer has added more than one variant, `rumQuantityInCart` sums across all of them. Correct behaviour.
- **Rum added via a future bundle/case product with a different handle.** Those bottles will not count toward the stepper max. Accepted limitation; revisit if bundle products land.
- **Box variant changes in Shopify.** The component takes the first variant. If the box gains multiple variants later, the design needs revisiting.
- **Cart mutation failure.** Existing `addToCart` error handling in the cart context applies. The local `isAdding` flag resets in a `finally` block.

## Testing

Manual checks:

- Empty cart: card hidden.
- Add rum (qty 1): card appears, stepper caps at 1.
- Increase rum to qty 3: stepper now caps at 3.
- Click Add at qty 2: box line appears with quantity 2. Card remains visible.
- Click Add again at qty 1: box line increments to 3. Card remains visible.
- Reduce rum to qty 1: stepper on the card clamps to 1 (already-added box line is unaffected).
- Remove all rum: card hidden. (Box line, if present, remains in cart as a normal product.)

Build/type checks: existing CI pipeline must pass.

## Files touched

- `src/components/PresentationBoxUpsell.tsx` (new)
- `src/components/CartDrawer.tsx` (one import + one render line)
- `src/lib/categories.ts` (three `productHandles` array additions)

## Out-of-scope follow-ups

- Bottle+box bundle product in Shopify (Shopify task, no code changes).
- Reviewing the rum product page for copy that may still imply a box is included (separate edit if needed).
