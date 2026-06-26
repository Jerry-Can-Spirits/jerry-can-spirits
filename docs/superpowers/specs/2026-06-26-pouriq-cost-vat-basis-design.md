# Pour IQ — Cost-side VAT basis (inc/ex VAT on purchase prices)

Date: 2026-06-26
Status: Approved (design)

## Problem

GP% in Pour IQ is computed as `(net_sale - pour_cost) / net_sale`. The **sale**
side is normalised to net of VAT (`netSalePrice` divides by 1.20 when a menu's
prices include VAT). The **cost** side is not: `pour_cost_p` uses the stored
`price_p` exactly as entered, and today's helper tells users to enter the price
"including VAT if applicable".

So GP compares a **net** sale price against a **gross** cost — an inconsistent
basis that distorts every margin. A bar that enters ex-VAT costs understates
cost the other way. Either way the basis is unmanaged.

## Goal

Let the user declare whether a purchase price is inc or ex VAT, and guarantee a
single consistent basis for cost so GP is accurate. Cover both entry surfaces:
the manual library form and the invoice import.

## Core principle — the invariant

**Stored `pouriq_ingredients_library.price_p` is always net of VAT.**

Conversion happens once, at the entry boundary. `calculations.ts` is unchanged:
because `price_p` is already net, every downstream consumer (cocktail GP, ripple
projection, spec cards, prepared-recipe components, import deltas) stays correct
with no edits. This is the central reason to normalise on input rather than
divide in the cost calc — the cost functions have many call sites and threading
a VAT flag through all of them is error-prone.

## Decisions (agreed with Dan, 2026-06-26)

- **Default basis (new library entry): Inc VAT.** Matches how most bars think
  about what they pay, and the prior helper's assumption.
- **Existing rows: left unchanged.** New flag defaults to 0 (ex/net), so stored
  `price_p` keeps being used as-is — identical to current behaviour. No backfill.
- **Scope: library form + invoice import**, both in this pass.
- **VAT rate: flat 20%** (`VAT_DIVISOR = 1.20`, already defined). Zero-rated
  items (some food) are entered as "Ex VAT" — their price carries no VAT — so a
  flat 20% on the Inc path is always correct. No per-item rates (YAGNI).
- **Penny-exact entered value:** the exact figure the user typed is stored in
  its own column (`price_entered_p`), so re-edit and any accountant-facing audit
  show the precise number entered, with no recompute drift. `price_p` (net)
  stays the costing source of truth.

## Components

### 1. Schema — migration `0054_library_price_vat_basis.sql`

```sql
ALTER TABLE pouriq_ingredients_library
  ADD COLUMN price_includes_vat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pouriq_ingredients_library
  ADD COLUMN price_entered_p INTEGER;
UPDATE pouriq_ingredients_library
  SET price_entered_p = price_p WHERE price_entered_p IS NULL;
```

Additive. The table's CHECK references only `base_unit`/`pack_size`/`price_p`,
so a plain `ADD COLUMN` is safe (no rebuild). Numbered `0054` because `0052`
(PR #826, auth_mode) and `0053` (PR #827, catalogue) are in-flight; this branch
should rebase onto main after those merge so the sequence stays 0051→0054.

- `price_includes_vat`: `0` = entered net/ex VAT; `1` = entered inc VAT (we
  stored net). Drives the form's basis toggle; does **not** feed the cost calc.
- `price_entered_p`: the exact pence the user typed on whatever basis (gross when
  inc, net when ex). Display/audit only; nullable, backfilled to `price_p` for
  existing rows. The app reads `price_entered_p ?? price_p` defensively.

### 2. Types (`src/lib/pouriq/types.ts`)

Add `price_includes_vat: number` and `price_entered_p: number` to
`IngredientLibraryRow` and the insert type, so both flow through
`LibraryEntryInput`. (Reads use `price_entered_p ?? price_p` for safety against
any row predating the backfill.)

### 3. Library save (`server-actions.ts`)

`saveLibraryEntryAction` / `insertLibraryEntry` / the update path accept and
persist `price_includes_vat`. The action receives an already-net `price_p` from
the form (the form does the conversion), so the server stores `price_p` (net), the flag,
and `price_entered_p` (exact). Prepared ingredients keep `price_includes_vat = 0`
and `price_entered_p = 0` (price is derived from components).

### 4. Library form (`IngredientForm.tsx`)

- A `[ Inc VAT | Ex VAT ]` segmented control beside "Price paid". Default **Inc**
  for a new entry; for an existing entry, derive from `entry.price_includes_vat`.
- Helper updated; flat-20% note added.
- Derived net: `priceNetP = incVat ? round(enteredPence / 1.20) : enteredPence`.
- On submit, `buildInput()` sets `price_p = priceNetP`, `price_entered_p =
  enteredPence`, and `price_includes_vat`.
- On edit-load, the displayed pounds value is `(price_entered_p ?? price_p)/100`
  (penny-exact), and the toggle is set from `price_includes_vat`.
- Live `costReadout` uses `priceNetP` (so it shows true net cost), and when Inc
  is selected shows a small "Stored net: £X.XX" line for transparency.

### 5. Invoice commit route (`api/pouriq/invoices/commit/route.ts`)

- `CommitBody` gains `prices_include_vat: boolean` (one basis for the whole
  invoice — invoices are uniformly net or gross).
- When true, every applied line's written price is converted to net (÷1.20)
  before the insert (new library row `price_p`) and the update
  (`UPDATE ... SET price_p = ...`); `price_entered_p` is set to the original
  (gross) line price and `price_includes_vat` to `1`. When false, prices are
  written as-is with `price_entered_p = price_p` and flag `0`. The update path
  sets all three columns.
- Bug fix in the same file: add `'cider'` and `'alcohol-free'` to the route's
  `INGREDIENT_TYPES` (currently missing, so a new cider/AF line is rejected).

### 6. Invoice import UI (`InvoiceScanFlow.tsx` / `InvoicePreview.tsx`)

- One inc/ex VAT toggle for the invoice, defaulting to **Ex VAT** (net) =
  current behaviour. The "net price" column label/help reflects the toggle.
- The toggle is threaded into the commit payload as `prices_include_vat`.
- The preview's "current vs new" delta compares on the net figure when Inc is
  selected, so the delta stays honest.

## Data flow

```
LIBRARY FORM                              INVOICE IMPORT
entered £ + basis                         invoice net/gross toggle
   |  round(/1.2) if Inc                      |  per-line price
   v                                          v  round(/1.2) if Inc
price_p (NET) + price_includes_vat   --> commit writes price_p (NET) + flag
  + price_entered_p (exact)                   + price_entered_p (exact)
   |
   v
calculations.ts (unchanged) — price_p is net, GP basis now consistent
```

## Edge cases / error handling

- **Zero / empty price:** unchanged validation (`price_p >= 0`); conversion of 0
  is 0.
- **Re-edit:** penny-exact via `price_entered_p`; no recompute, no drift.
- **Prepared ingredients:** flag stays 0, price derived from components (already
  net via their own rows).
- **Existing rows on first edit:** `price_entered_p` was backfilled to `price_p`,
  so they load as Ex (flag 0) showing the stored value exactly; the owner can
  flip to Inc if appropriate, which then re-derives net.

## Testing

- Unit: a small pure helper `netPriceP(enteredP, includesVat)` with cases
  (inc 1440 -> 1200; ex 1440 -> 1440; 0 -> 0; rounding 999 inc).
- Form round-trip: save Inc £14.40 -> `price_p` 1200, `price_entered_p` 1440,
  flag 1; reload shows exactly £14.40, toggle Inc. Save Inc £9.99 -> reload shows
  exactly £9.99 (penny-exact, no drift).
- Commit route: invoice inc-VAT toggle converts a £12.00 line to 1000 net on
  both insert and update paths; cider/AF new line is accepted.
- GP regression: a drink using an Inc-entered ingredient now yields the same GP
  as the equivalent Ex-entered net price.

## Out of scope

- Per-item VAT rates / reduced-rate handling.
- Recomputing GP for existing rows (their stored `price_p` is treated as net,
  unchanged; only the new `price_entered_p` backfill touches them).
