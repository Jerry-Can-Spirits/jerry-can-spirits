# Cart Drawer Redesign — Design & Stage 1 Plan

Status: design agreed 2026-07-20. Stage 1 planned, not yet implemented.
Scope: `src/components/CartDrawer.tsx`, `CartUpsell.tsx`, `PresentationBoxUpsell.tsx`.

---

## Corrected diagnosis

The founder brief described a six-product horizontal-scroll upsell and a missing
free-delivery nudge. Reading the code, neither was true:

- **The nudge exists and is pinned** above the scroll (`CartDrawer.tsx:259-285`).
  It's a 1.5px bar + `text-sm`, drowned by the blocks below it. A prominence
  problem, not an absence.
- **The upsell is a 2×2 grid of 4** with a "Show more" reroll
  (`CartUpsell.tsx:190`), not a horizontal scroll.
- **The real fault is two stacked `overflow-y-auto` regions:** the line items
  (`flex-1 overflow-y-auto`, line 288) and the footer
  (`overflow-y-auto max-h-[60vh]`, line 482). Checkout sits at the **bottom of
  the second one**, under: discount → gift → **PresentationBoxUpsell → CartUpsell
  → CarbonOffsetToggle** → total → payment badges → checkout.
- **Two full upsell blocks are stacked in the footer** (`PresentationBoxUpsell`
  at 625, `CartUpsell` at 628) — a large part of the crowding.

So the drawer's two jobs — (1) let a decided customer check out without friction,
(2) let an undecided customer add a second item easily — are both undermined by
one structural fault. Fixing the structure serves both.

---

## Principles (from the brief, agreed)

1. Checkout must always be reachable — pinned, not hunted for.
2. One scroll region. No nested scrolling.
3. The nudge earns its place; everything else must too.
4. Progressive disclosure over permanent presence.
5. Fewer, better upsell options (2–3, threshold-clearing one leads).

---

## Target structure — pinned footer, one scroll region

```
┌─────────────────────────────────────┐
│ Your Cart                        [×] │  shrink-0 header
├─────────────────────────────────────┤
│ £30.00 to go for free UK delivery    │  shrink-0 nudge (elevated, aria-live)
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░                   │
├─────────────────────────────────────┤
│ line items                           │  ┐
│ accessory upsell (2–3, hero-first)   │  │ flex-1 overflow-y-auto
│ presentation box (compact, gift)     │  │  — THE ONLY SCROLL REGION
│ ▸ Have a code?   ▸ Gift message       │  │
│ ☐ Plant a UK tree (+£1)              │  │
│ payment badges                       │  ┘
├─────────────────────────────────────┤
│ Total                       £35.00   │  ┐ shrink-0 footer (pinned)
│ [        Proceed to Checkout       ] │  │
│ ⚡ Shop Pay available                 │  ┘
└─────────────────────────────────────┘
```

Flexbox: header / nudge / footer are `shrink-0`; the middle is a single
`flex-1 overflow-y-auto`. Checkout lives in the pinned footer, so it is reachable
at 390px with any number of items. 480px desktop is the same structure with more
room (hero upsell + two alternates in a row rather than hero + one).

---

## Taste calls (decided by founder, 2026-07-20)

- **Nudge:** pinned top, elevated (thicker bar). The upsell carries the
  "Clears free delivery ✓" line to connect why→how without moving the nudge.
- **Upsell once unlocked:** keep selling, drop the threshold line ("clears free
  delivery" is slightly insulting once cleared) → replace with "Goes well with
  this."
- **Tree opt-in (+£1):** keep visible as one compact line. A brand value; one
  line costs almost nothing.
- **Empty state:** merchandise. Copy is **"Start with Expedition Spiced"** — the
  product carrying 96% of sales; "Start Shopping" is the generic phrase this
  brand exists not to use. (Stage 4.)

## PresentationBoxUpsell decision (founder question, decided)

**Keep it, but as a distinct compact one-line offer bound to the gift context —
not folded into the accessory pool, not a second full block.**

Reasoning: it's a per-bottle packaging upgrade (qty capped to bottles in cart),
explicitly "built for gifting" — a different offer type from an accessory that
completes the serve. Folding it into the shortfall-aware accessory grid would
break its per-bottle semantics and mix two intents. Its natural home is the gift
context. Stage 1 demotes it from a full bordered block to a compact one-liner in
the scroll region, adjacent to the gift toggle; Stage 2 can reveal it under the
gift disclosure. Exposure trade-off to watch: binding it to "This is a gift"
narrows impressions to gift-intent shoppers (correct targeting, fewer views) —
default for Stage 1 is compact-but-always-visible-when-rum-in-cart to preserve
current exposure; the gift-binding is a Stage 2 option.

Dropping it to the product page was rejected: the cart is the strongest
gift-decision moment.

---

## Staging (revised — a11y pulled into Stage 1)

- **Stage 1 — structure + a11y (this plan).** Pinned footer, single scroll
  region, consolidate the two stacked upsells, plus `inert`-when-closed, 44px tap
  targets on the footer/upsell buttons, and `aria-live` on the nudge. One review,
  and the live Chrome-blocked `inert` bug stops sitting.
- **Stage 2 — collapsing.** Discount behind "Have a code?", gift behind its
  toggle row, presentation box under the gift disclosure.
- **Stage 3 — shortfall-aware upsell.** Curated accessory pool in Sanity +
  shortfall-aware selection, hero-first. The AOV lever.
- **Stage 4 — empty-state merchandising** ("Start with Expedition Spiced").

Order rationale: Stage 1 serves job one (frictionless checkout for the decided
customer) and is low-risk structural work; Stage 3 serves job two (AOV) and is
higher-effort. Protect conversion first, then grow basket.

---

## Stage 1 — concrete implementation plan

**Goal:** one scroll region, pinned checkout, consolidated upsells, a11y fixes.
No behavioural regressions. Pure restructure of the existing return tree plus
small edits to the two upsell components.

### 1. `CartDrawer.tsx` — restructure the return tree

Current: `flex flex-col h-full` → header, nudge, `flex-1 overflow-y-auto` (items
only), footer `overflow-y-auto max-h-[60vh]` (everything else + checkout).

Target: header, nudge, **one** `flex-1 overflow-y-auto` (items + all middle
content), **`shrink-0` footer** (total + checkout + Shop Pay only).

- **Single scroll region** wraps, in order: line items → `CartUpsell` →
  `PresentationBoxUpsell` (compact) → discount field → gift toggle →
  `CarbonOffsetToggle` → payment badges. Remove the `max-h-[60vh]` +
  `overflow-y-auto` from the old footer block; its contents move into the scroll
  region except the pinned items below.
- **Pinned footer** (`shrink-0 border-t border-gold-500/20 p-4 space-y-3`,
  NOT overflow): the Total row, the checkout `<a>` (keep the full Meta/GA4/gift-
  flush onClick verbatim), and the Shop Pay notice. Nothing else — keep it to ~3
  short rows so checkout is always visible at 390px.
- **Payment badges** move to the bottom of the scroll region (trust content, not
  action) so the footer stays lean.
- **"Continue Shopping"** link moves into the scroll region (below badges) or is
  dropped — low value next to a pinned checkout.
- Load-failure (#945) and empty states stay in the scroll region unchanged; the
  nudge and footer remain gated on `cart && cart.lines.length > 0`.

### 2. Consolidate the stacked upsells

- `CartUpsell` stays the single accessory surface (Stage 3 makes it
  shortfall-aware and hero-first; Stage 1 only relocates it).
- `PresentationBoxUpsell` → demote to a compact one-line offer (drop the full
  bordered card + 80px image; a single row: label + qty stepper + Add). Keep the
  rum-in-cart gate and qty-capped logic. Positioned adjacent to the gift toggle.

### 3. Accessibility (in Stage 1)

- **`inert` when closed:** add `inert={!isCartOpen || undefined}` to the drawer
  `div` (React 19 supports the prop). Keep the focus-trap/Escape/restore effects.
  This removes the off-screen drawer's controls from the tab order and the a11y
  tree — the current `aria-hidden` alone leaves them focusable.
- **Tap targets → 44px:** discount **Apply** (`CartDrawer.tsx:499`, add
  `min-h-[44px]`), `CartUpsell` **Add** (`CartUpsell.tsx:269`, `px-2 py-1` →
  44px), `PresentationBoxUpsell` **Add** (`:135`, add `min-h-[44px]`). Quantity
  steppers are already 44px.
- **Nudge `aria-live`:** wrap the shortfall text in `aria-live="polite"` so the
  "£X to go" → "Free UK delivery unlocked" transition is announced. **Copy is
  fixed and must not change.**
- **Nudge elevation:** bar `h-1.5` → `h-2`; keep tokens. Visual only.

### 4. Regression checklist (must still hold)

- Free-delivery nudge renders and updates (copy unchanged).
- Action-failure toast (CartContext-level) unaffected.
- Load-failure "Try again" state intact.
- Pair-defaulting variants (CartUpsell / CompleteTheServe) unaffected.
- Gift attribute debounce + flush-before-checkout intact.
- Discount/referral apply + not-applicable messaging intact.
- Checkout `onClick` Meta CAPI + GA4 `begin_checkout` + gift flush + affiliate
  `dt_id` + UTM all preserved verbatim.
- Focus trap, Escape-to-close, focus restore to trigger intact.

### 5. Verification

- `pnpm typecheck && pnpm lint && pnpm build` at root.
- Manual at 390px: checkout visible with 1 and 3 items; only one scroll region;
  nudge visible on open; tab order skips the drawer when closed.

### Open sub-decisions for Stage 1 (small)

- Payment badges: compact single row in the footer, or moved into the scroll
  (plan assumes the latter to keep the footer lean).
- PresentationBox: always-visible-when-rum-in-cart (default) vs revealed by the
  gift toggle (Stage 2 option).
