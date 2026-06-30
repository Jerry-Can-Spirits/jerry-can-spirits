# Pour IQ Invoice Image Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the original invoice PDF beside the extracted lines (review) and the committed lines (detail), so venues verify + manually match against the real document.

**Architecture:** Reuse R2 storage. PDF-only → an `<iframe>` (native browser controls). Committed `[id]/pdf` route already serves inline (reuse). Add a pending-file serve route, a thin `InvoiceDocViewer`, and two two-pane integrations with a mobile toggle.

**Tech Stack:** Next.js 15 App Router (route handlers + RSC + client components), Cloudflare R2, TypeScript. **No new dependencies, no migration.**

**Spec:** `docs/superpowers/specs/2026-06-30-pouriq-invoice-viewer-design.md`
**Branch:** `feat/pouriq-invoice-viewer` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + **`npx opennextjs-cloudflare build`** (the new route must build). Keep package.json/lock/configs untouched. Light theme; no em-dashes.

**Verified facts:**
- Committed serve route `src/app/api/pouriq/invoices/[id]/pdf/route.ts` already returns `application/pdf` with `content-disposition: inline`, tenant-scoped via `checkPourIqAccess` + `getInvoice`. Embed `/api/pouriq/invoices/${id}/pdf` directly — no change.
- Pending file key: `pouriq-invoices/_pending/${ticket}.pdf` in `env.TRADE_DOCS`.
- `InvoiceScanFlow` (`src/components/pouriq/InvoiceScanFlow.tsx`) holds the `ticket` and renders `<InvoicePreview initial={...} library={...} />`. The detail page is `src/app/trade/pouriq/invoices/[id]/page.tsx` (server component, `max-w-4xl`, already has an `invoice.r2_key &&` Download link).

---

## Task 1: Pending-file serve route

**Files:** Create: `src/app/api/pouriq/invoices/pending/[ticket]/route.ts`

- [ ] **Step 1: Implement**

Mirror the committed route's structure. **Do NOT set `export const runtime = 'edge'`** (nodejs runtime — required for the OpenNext build).

```ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'

export async function GET(_request: Request, { params }: { params: Promise<{ ticket: string }> }) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') return new Response('Unauthorized', { status: 401 })
  if (access.kind === 'no-licence') return new Response('Forbidden', { status: 403 })
  const { ticket } = await params
  // Pending files are not tenant-tagged in R2; the gate is a licensed session +
  // the unguessable upload ticket. Acceptable for a short-lived pre-commit doc.
  const { env } = await getCloudflareContext()
  const r2 = env.TRADE_DOCS as R2Bucket
  const obj = await r2.get(`pouriq-invoices/_pending/${ticket}.pdf`)
  if (!obj) return new Response('Not found', { status: 404 })
  return new Response(obj.body, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="invoice.pdf"',
      'cache-control': 'private, no-store',
    },
  })
}
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`, `npm run build`.
```bash
git add "src/app/api/pouriq/invoices/pending/[ticket]/route.ts"
git commit -m "feat(pouriq): serve pending invoice PDF inline (auth-gated)"
```

---

## Task 2: InvoiceDocViewer component

**Files:** Create: `src/components/pouriq/InvoiceDocViewer.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'

export function InvoiceDocViewer({ src, title }: { src: string | null; title?: string }) {
  if (!src) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        No document available.
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-500">{title ?? 'Original invoice'}</span>
        <a href={src} target="_blank" rel="noopener" className="text-xs text-emerald-700 hover:text-emerald-600 underline">Open in new tab</a>
      </div>
      <iframe src={src} title={title ?? 'Invoice document'} className="w-full min-h-[60vh]" />
    </div>
  )
}
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`, `npm run build`.
```bash
git add src/components/pouriq/InvoiceDocViewer.tsx
git commit -m "feat(pouriq): InvoiceDocViewer (inline PDF iframe + open)"
```

---

## Task 3: Review screen two-pane + mobile toggle

**Files:** Modify: `src/components/pouriq/InvoicePreview.tsx` (+ confirm the `ticket` reaches it from `InvoiceScanFlow`).

- [ ] **Step 1: Thread the ticket**

Confirm where the upload `ticket` lives. `InvoiceScanFlow` has it (passed to extract/commit). Ensure `InvoicePreview` receives the `ticket` (it already needs it for commit — read `InvoicePreview` to find the prop/payload field; if it is on `initial.ticket`, use that; otherwise add a `ticket: string` prop and pass it from `InvoiceScanFlow`).

- [ ] **Step 2: Two-pane layout + toggle**

Wrap the existing review content so that, on `lg:` screens, the document and the lines sit side by side (`lg:grid lg:grid-cols-2 lg:gap-6`), and on small screens a `Document | Lines` tab toggle (`const [pane, setPane] = useState<'lines' | 'doc'>('lines')`) switches which is shown. The document pane is `<InvoiceDocViewer src={`/api/pouriq/invoices/pending/${ticket}`} />`. The lines pane is the existing review UI, unchanged. The toggle + viewer are `no-print`. On `lg:` both panes always render (ignore `pane`); below `lg:` show only the selected pane.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/InvoicePreview.tsx src/components/pouriq/InvoiceScanFlow.tsx
git commit -m "feat(pouriq): original invoice beside the review lines (+ mobile toggle)"
```

---

## Task 4: Committed detail two-pane + mobile toggle

**Files:** Modify: `src/app/trade/pouriq/invoices/[id]/page.tsx` (+ a small client wrapper for the toggle, since the page is a server component).

- [ ] **Step 1: Toggle wrapper**

The detail page is a server component, but the mobile toggle needs client state. Create a thin client component `src/components/pouriq/InvoiceDetailPanes.tsx` (`'use client'`) that takes `{ docSrc: string | null; children: ReactNode }` (children = the server-rendered lines markup) and renders the same `lg:grid-cols-2` + `Document | Lines` toggle pattern as Task 3, with `<InvoiceDocViewer src={docSrc} />` as the document pane. (Reuse the toggle pattern; consider extracting it if trivial, otherwise duplicate the few lines.)

- [ ] **Step 2: Use it in the page**

In `[id]/page.tsx`, wrap the lines section in `<InvoiceDetailPanes docSrc={invoice.r2_key ? `/api/pouriq/invoices/${id}/pdf` : null}>...lines...</InvoiceDetailPanes>`. Keep the header + delete + GP-impact + Download link as they are. Widen the page container if needed for the two-pane (e.g. `max-w-4xl` → `max-w-6xl`) so the lines stay readable beside the doc.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/InvoiceDetailPanes.tsx "src/app/trade/pouriq/invoices/[id]/page.tsx"
git commit -m "feat(pouriq): original invoice beside the committed lines on the detail page"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; **`npx opennextjs-cloudflare build` green** (the new route); package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: notes the new pending serve route (auth-gated, nodejs), the viewer, both integrations + mobile toggle, no migration, no deps.
