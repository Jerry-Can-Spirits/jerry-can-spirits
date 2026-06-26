# Pour IQ — Invoice delete + serve-measure presets (testing items B + C)

**Date:** 2026-06-26
**Status:** Approved (Dan): B and C in one PR, then D (catalogue) next.
**Origin:** Real onboarding/testing feedback.

## B — Delete an invoice (and remove from R2)
**Why:** a test account already has an invoice (onboarding step ticked), and there is no way to remove it to re-onboard from scratch.

**Data:** `pouriq_invoices` stores `r2_key`. Cascade: `pouriq_invoice_lines` is `ON DELETE CASCADE`; `pouriq_cost_changes` invoice refs are `ON DELETE SET NULL`. **Gotcha:** `pouriq_stock_receipts.invoice_line_id` is a plain column (no FK), so its rows would orphan and keep counting toward perpetual stock. They must be deleted explicitly, before the invoice cascade removes the lines.

**Decision:** deleting an invoice does NOT revert the ingredient `price_p` it already applied (the price-history `pouriq_cost_changes` rows survive with NULLed invoice refs). Acceptable: this is a delete-the-record action, not a financial reversal. The confirm dialog says so.

**Pieces:**
- `deleteInvoice(db, invoiceId, tradeAccountId): Promise<{ r2_key: string | null } | null>` in `invoices.ts`: select+verify ownership (return null if not found); delete `pouriq_stock_receipts` for the invoice's lines; delete the invoice (cascades lines); return `r2_key`.
- `deleteInvoiceAction(invoiceId)` in `server-actions.ts`: `requireDb`; call `deleteInvoice`; best-effort `env.TRADE_DOCS.delete(r2_key)`; `revalidatePath('/trade/pouriq/invoices')` and `revalidatePath('/trade/pouriq')` (invoice existence drives the onboarding setup panel); `redirect('/trade/pouriq/invoices')`.
- `DeleteInvoiceButton.tsx` (client, mirrors `DeleteMenuButton`): confirm dialog, `DESTRUCTIVE_BUTTON`.
- `invoices/[id]/page.tsx`: button in the header actions row.

## C — Serve-measure presets + keg pack sizes
**Why:** amount-per-serve and draught pack size are free text; common measures should be one click/select.

- **Serve units** (added to `STANDARD_SERVE_UNITS.ml` in `measures.ts`, so they appear in the `ServeUnitPicker` dropdown for any ml ingredient): half pint (284ml), pint (568ml), small glass (125ml), medium glass (175ml), large glass (250ml). A user enters `1` and picks `pint`. `formatServeMeasure`/`pluralise` already handle plurals (`glass → glasses`). **Decision:** global (dropdown options), not type-scoped — the dropdown is unobtrusive and scoping would thread `ingredient_type` through the picker for little gain. Flagged for Dan.
- **Keg pack sizes** (`KEG_SIZES_ML = [20000, 30000, 50000]` in `measures.ts`): appended to the "Size of each" chips in `IngredientMatchRow` only when `ingredient_type === 'beer'` (chips are prominent, so keep them off spirits). Free text still covers casks/firkins. (After D adds a `cider` type, include it in this condition.)

## Out of scope
- Reverting applied prices on invoice delete (by decision).
- Type-scoping the serve dropdown.
- Multi-page PDF upload; catalogue gaps (D).

## Tests
- `formatServeMeasure` / `serveUnitsFor` for the new units (pint singular, "large glasses" plural, picker includes pint). `deleteInvoice` SQL ordering validated ad hoc against SQLite (stock receipts cleared, invoice+lines gone). Gates: `tsc`, `test:unit`, `opennextjs-cloudflare build`.

## Success
A manager can delete an invoice (file gone from R2, onboarding step un-ticks, no orphaned stock receipts) and can pick pint/half-pint/wine-glass serves and keg pack sizes without free text.
