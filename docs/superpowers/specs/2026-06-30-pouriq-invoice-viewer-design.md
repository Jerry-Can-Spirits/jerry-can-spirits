# Pour IQ — Invoice Image Viewer

Date: 2026-06-30
Status: Design agreed; ready for implementation plan.

## Goal

Show the original invoice PDF beside the extracted/committed lines — on the invoice **review** screen and the **committed detail** page — so a venue can verify the extraction and manually match weirdly-written lines against the real document. The manual match itself is the existing per-line library picker; the viewer just makes it reliable by showing the source.

## Key facts (verified)

- Invoice uploads are **PDF-only** (`upload/route.ts` rejects non-PDF; stored with `contentType: 'application/pdf'`). So the viewer is always a PDF in an `<iframe>` — the browser's native viewer provides zoom, page navigation, and scroll for free.
- R2 (`TRADE_DOCS`): pending file at `pouriq-invoices/_pending/${ticket}.pdf`; committed at `pouriq-invoices/${tradeAccountId}/${invoiceId}.pdf` (stored as `invoice.r2_key`).
- The committed route `src/app/api/pouriq/invoices/[id]/pdf/route.ts` **already returns the PDF inline** (`Content-Disposition: inline`, `application/pdf`, tenant-scoped via `checkPourIqAccess` + `getInvoice`). It can be embedded directly — **no change needed**.

## Architecture

### 1. Pending-file serve route (new)

`src/app/api/pouriq/invoices/pending/[ticket]/route.ts` — GET. **nodejs runtime (do NOT set `runtime = 'edge'`)** to satisfy the OpenNext deploy build. Logic:
- `checkPourIqAccess()`; if `no-session`/`no-licence`, return 401/403.
- `const obj = await (env.TRADE_DOCS as R2Bucket).get(`pouriq-invoices/_pending/${ticket}.pdf`)`; 404 if missing.
- Return `obj.body` with `content-type: application/pdf`, `content-disposition: inline`, `cache-control: private, no-store` (pending files are short-lived). Mirror the committed route's response shape.
- Security: the `ticket` is an unguessable id minted at upload; the gate is "a logged-in licensed Pour IQ session + knowledge of the ticket." Pending files are not tenant-tagged in R2, so we cannot tenant-scope further; this is acceptable for a short-lived pre-commit document. (Note this trade-off in the route comment.)

### 2. Viewer component (new)

`src/components/pouriq/InvoiceDocViewer.tsx` (`'use client'`). Props: `{ src: string | null; title?: string }`.
- `src` present → `<iframe src={src} title={title ?? 'Invoice document'} className="w-full h-full" />` inside a bordered, min-height container (e.g. `min-h-[60vh]`), plus a small "Open in new tab" link (`<a href={src} target="_blank" rel="noopener">`).
- `src` null → a slate "No document available" placeholder.
- Purely presentational; no data fetching.

### 3. Review integration

The invoice review surface (`InvoicePreview` and/or its page) becomes a two-pane layout:
- Left: `<InvoiceDocViewer src={`/api/pouriq/invoices/pending/${ticket}`} />` (`InvoicePreview` already has the `ticket`).
- Right: the existing extracted-lines review (unchanged).
- **Mobile:** a small `Document | Lines` tab toggle (local `useState`) that switches which pane shows, since side-by-side is too narrow. Desktop shows both (`lg:grid-cols-2`). The viewer + toggle are `no-print`.

### 4. Committed detail integration

the committed invoice detail page `src/app/trade/pouriq/invoices/[id]/page.tsx`:
- Two-pane: left `<InvoiceDocViewer src={invoice.r2_key ? `/api/pouriq/invoices/${id}/pdf` : null} />`, right the committed lines (unchanged).
- Same mobile `Document | Lines` toggle. When `r2_key` is null, the viewer shows its placeholder.

## Scope

- **IN:** the pending serve route; `InvoiceDocViewer`; the two two-pane integrations; the mobile Document/Lines toggle.
- **OUT:** image (photo) invoices — uploads are PDF-only, a separate feature; annotation/markup; OCR overlay; clicking a line to highlight its region on the PDF.

## Testing

- Light by nature (routes + an iframe). The new pending route's **auth gate** is the one thing to get right — confirm it calls `checkPourIqAccess` and 401/403s an unauthenticated request (reason through + match the existing pdf route's guard).
- No jsdom component tests (no new deps). `InvoiceDocViewer` is a thin presentational component; verify by reasoning + the build.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` (unchanged count, green); `npm run build` + **`npx opennextjs-cloudflare build`** green (the new route must build — nodejs runtime); `package.json`/lock/configs unchanged; **no new npm dependencies**, **no migration**.

## Risks / notes

- **OpenNext gate:** the new route must be nodejs runtime (no `export const runtime = 'edge'`) — an edge route broke the OpenNext build before. Verify with `opennextjs-cloudflare build`.
- The browser PDF viewer is the control surface; we add only "Open in new tab". No custom PDF rendering, so no library/dependency.
- Pending-file auth is session + unguessable ticket (documented trade-off); committed files are tenant-scoped by the existing route.
- Two-pane on the review screen increases width — keep the lines pane usable; the mobile toggle handles small screens.
