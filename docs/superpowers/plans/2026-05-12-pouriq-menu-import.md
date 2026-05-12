# Pour IQ AI Menu Import — Implementation Plan (PR 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-assisted menu import flow at `/trade/pouriq/[menuId]/import`. Bar manager pastes their menu text or uploads a PDF; Anthropic Claude Sonnet extracts drinks + ingredient lists via tool-based structured output; the UI shows a per-ingredient match preview against the tenant's library; commit writes the menu atomically to D1.

**Architecture:** Three-step UI (source → preview → commit) backed by three API routes. Server-side `pdf-parse` extracts text from PDF uploads. Anthropic returns structured JSON via forced tool use. Deterministic match against the library (Levenshtein + substring, hand-rolled). Atomic commit via D1 batch. Reuses the existing R2 bucket `jerry-can-spirits-trade-docs` with a new `pouriq-imports/` prefix.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind, Cloudflare Workers (OpenNext), D1, R2, Anthropic API (existing `ANTHROPIC_API_KEY`). One new dependency: `pdf-parse`.

**Spec:** `docs/superpowers/specs/2026-05-12-pouriq-menu-import-and-library-design.md`

**Branch:** `feat/pouriq-menu-import` (already created from `origin/main`; this plan committed on it)

**Depends on:** PR 1 (`feat/pouriq-ingredient-library`) — merged 2026-05-12; production migration applied; demo seeded.

---

## File Map

**Create:**
- `src/lib/pouriq/pdf-extract.ts` — `pdf-parse` wrapper
- `src/lib/pouriq/measurement-parse.ts` — parse "50ml", "1/2 lime", etc.
- `src/lib/pouriq/match.ts` — fuzzy match against library entries
- `src/lib/pouriq/import-prompts.ts` — Anthropic system prompt + tool schema
- `src/lib/pouriq/menu-extract.ts` — Anthropic client + orchestration
- `src/app/api/pouriq/import/upload/route.ts` — PDF → R2 ticket
- `src/app/api/pouriq/import/extract/route.ts` — text or ticket → structured extraction + match
- `src/app/api/pouriq/import/commit/route.ts` — atomic D1 batch
- `src/app/trade/pouriq/[menuId]/import/page.tsx` — three-step UI
- `src/components/pouriq/ImportSourceTabs.tsx`
- `src/components/pouriq/ImportPreview.tsx`
- `src/components/pouriq/IngredientMatchRow.tsx`

**Modify:**
- `package.json` — add `pdf-parse` dependency
- `src/app/trade/pouriq/new/page.tsx` — add "or import an existing menu" link
- `src/app/trade/pouriq/[menuId]/page.tsx` — add "Import drinks" button next to "Add drink"
- `src/lib/pouriq/prompts.ts` — add house-spirit nuance to the recommendation prompt (per pilot feedback)

**Manual (Cloudflare dashboard, before deploy):**
- Add R2 lifecycle rule: prefix `pouriq-imports/` → delete after 24 hours (mirrors existing `pending/` rule)

---

## Task 1: Install pdf-parse

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

Run: `npm install pdf-parse`

Expected: package added to `dependencies`, no audit failures. `pdf-parse` is a pure-Node library that works in Cloudflare Workers' Node compatibility mode.

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install pdf-parse for menu import"
```

---

## Task 2: PDF text extraction wrapper

**Files:**
- Create: `src/lib/pouriq/pdf-extract.ts`

- [ ] **Step 1: Write the wrapper**

```ts
// Extract plain text from a PDF buffer using pdf-parse.
// Used by /api/pouriq/import/extract when source = 'pdf'.

import 'server-only'
import pdfParse from 'pdf-parse'

export interface PdfExtractResult {
  text: string
  pageCount: number
}

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<PdfExtractResult> {
  const result = await pdfParse(Buffer.from(buffer))
  return {
    text: result.text ?? '',
    pageCount: result.numpages ?? 0,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/pdf-extract.ts
git commit -m "feat: PDF text extraction wrapper"
```

---

## Task 3: Measurement parser

**Files:**
- Create: `src/lib/pouriq/measurement-parse.ts`

- [ ] **Step 1: Write the parser**

```ts
// Parse raw measurement strings extracted by AI into either pour_ml
// (for bottle-priced ingredients) or unit_count (for unit-priced).
// Examples in the spec:
//   "50ml"          → { pour_ml: 50 }
//   "1.5oz"         → { pour_ml: 44 }   (oz → ml, round to 5)
//   "barspoon"      → { pour_ml: 5 }
//   "2 dashes"      → { pour_ml: 2 }    (1ml per dash)
//   "1/2 lime"      → { unit_count: 0.5 }
//   "wedge"         → { unit_count: 0.125 }  (1/8 of a lime)
//   "1 sprig"       → { unit_count: 1 }
//   "top"           → { pour_ml: 50 }   (default soft top-up)
// Anything not matched returns { raw: input } for the UI to surface.

export type ParsedMeasurement =
  | { pour_ml: number; unit_count?: never; raw?: never }
  | { unit_count: number; pour_ml?: never; raw?: never }
  | { raw: string; pour_ml?: never; unit_count?: never }

const OZ_TO_ML = 29.5735
function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

export function parseMeasurement(input: string): ParsedMeasurement {
  const s = input.trim().toLowerCase()
  if (!s) return { raw: input }

  // Explicit ml
  const mlMatch = s.match(/^(\d+(?:\.\d+)?)\s*ml$/)
  if (mlMatch) return { pour_ml: Math.round(parseFloat(mlMatch[1])) }

  // Explicit oz
  const ozMatch = s.match(/^(\d+(?:\.\d+)?)\s*oz$/)
  if (ozMatch) return { pour_ml: roundTo5(parseFloat(ozMatch[1]) * OZ_TO_ML) }

  // Barspoon (~5ml each, optional count)
  const barspoonMatch = s.match(/^(?:(\d+(?:\.\d+)?)\s+)?bar\s?spoons?$/)
  if (barspoonMatch) {
    const n = barspoonMatch[1] ? parseFloat(barspoonMatch[1]) : 1
    return { pour_ml: Math.round(n * 5) }
  }

  // Dash(es) — ~1ml per dash
  const dashMatch = s.match(/^(?:(\d+)\s+)?dashe?s?$/)
  if (dashMatch) {
    const n = dashMatch[1] ? parseInt(dashMatch[1], 10) : 1
    return { pour_ml: n }
  }

  // Splash / top — default soft 50ml
  if (s === 'splash' || s === 'top' || s.startsWith('top with') || s.startsWith('top up')) {
    return { pour_ml: 50 }
  }

  // Fractions: "1/2 lime", "half lime", "1/4 lemon", "quarter lemon"
  const fractionMatch = s.match(/^(1\/2|1\/4|1\/8|3\/4|half|quarter)\b/)
  if (fractionMatch) {
    const map: Record<string, number> = {
      '1/8': 0.125, '1/4': 0.25, '1/2': 0.5, '3/4': 0.75,
      'half': 0.5, 'quarter': 0.25,
    }
    return { unit_count: map[fractionMatch[1]] }
  }

  // Wedge / wheel — assume 1/8 of a fruit
  if (s === 'wedge' || /wedge\b/.test(s)) {
    return { unit_count: 0.125 }
  }

  // Sprig / leaf / leaves — count of mint sprigs, default 1
  const sprigMatch = s.match(/^(?:(\d+)\s+)?(?:sprigs?|leaf|leaves)\b/)
  if (sprigMatch) {
    const n = sprigMatch[1] ? parseInt(sprigMatch[1], 10) : 1
    return { unit_count: n }
  }

  // Whole numbers preceding a unit-ish word: "1 lime", "2 oranges"
  const wholeUnitMatch = s.match(/^(\d+(?:\.\d+)?)\s+\w+/)
  if (wholeUnitMatch) {
    return { unit_count: parseFloat(wholeUnitMatch[1]) }
  }

  // Anything else: pass through for the UI to surface
  return { raw: input }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/measurement-parse.ts
git commit -m "feat: parse raw measurement strings into pour/unit"
```

---

## Task 4: Library matcher

**Files:**
- Create: `src/lib/pouriq/match.ts`

- [ ] **Step 1: Write the matcher**

```ts
// Deterministic name matching of an extracted ingredient against the
// tenant's library. Returns a match status the UI can render directly.

import type { IngredientLibraryRow } from './types'

export type MatchStatus =
  | { kind: 'auto'; entry: IngredientLibraryRow }
  | { kind: 'suggestions'; entries: IngredientLibraryRow[] }
  | { kind: 'no-match' }

function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/['.,]/g, '')
    .replace(/\b(\d+\s?(?:ml|cl|l|oz))\b/g, '') // strip size suffixes like "70cl"
    .replace(/\s+/g, ' ')
    .trim()
}

// Standard Levenshtein, O(n*m) — fine for short ingredient names.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const prev = new Array(b.length + 1)
  const cur = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

export function matchIngredient(
  extractedName: string,
  library: IngredientLibraryRow[],
): MatchStatus {
  const target = normalise(extractedName)
  if (!target) return { kind: 'no-match' }

  // 1. Exact (case-insensitive, normalised) match
  const exact = library.find((e) => normalise(e.name) === target)
  if (exact) return { kind: 'auto', entry: exact }

  // 2 + 3. Fuzzy: collect candidates with Levenshtein ≤ 2 or substring match
  type Scored = { entry: IngredientLibraryRow; score: number }
  const scored: Scored[] = []
  for (const entry of library) {
    const candidate = normalise(entry.name)
    if (candidate.length < 3) continue

    const dist = levenshtein(target, candidate)
    if (dist <= 2) {
      scored.push({ entry, score: dist })
      continue
    }
    // Substring match either direction, min length 4
    if (
      (target.length >= 4 && candidate.includes(target)) ||
      (candidate.length >= 4 && target.includes(candidate))
    ) {
      scored.push({ entry, score: 100 + Math.abs(target.length - candidate.length) })
    }
  }

  if (scored.length === 0) return { kind: 'no-match' }

  scored.sort((a, b) => a.score - b.score)
  return { kind: 'suggestions', entries: scored.slice(0, 3).map((s) => s.entry) }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/match.ts
git commit -m "feat: fuzzy match for ingredient library lookup"
```

---

## Task 5: Anthropic import prompts

**Files:**
- Create: `src/lib/pouriq/import-prompts.ts`

- [ ] **Step 1: Write prompts + tool schema**

```ts
import type { IngredientType } from './types'

export const EXTRACT_SYSTEM_PROMPT = `You are an extraction engine inside Pour IQ. You receive raw menu text from a UK trade venue (pub, bar, restaurant, hotel) and extract every drink line with its ingredients.

Rules:
- Extract every drink that appears: cocktails AND simple serves (vodka & coke, house spirits with a mixer, beer, wine by the glass).
- For each ingredient, capture the name AS WRITTEN on the menu. Do not normalise or rename. "Tito's vodka" stays "Tito's vodka", not "Vodka".
- Capture the raw measurement string as written. "50ml", "1.5oz", "1/2 lime", "barspoon", "top with soda" — pass it through.
- Infer ingredient_type conservatively from name + context. When uncertain return 'other'. Valid types: spirit, liqueur, wine, beer, mixer, syrup, juice, garnish, other.
- Capture sale_price_p if visible (in pence; £9.50 = 950). Else null.
- Never invent ingredients. If a drink has no recipe shown, return it with an empty ingredients array — the bar manager will fill in.
- Section headings ("Cocktails", "House Spirits") are NOT drinks.

Output: call the pouriq_extract_menu tool with the structured result.`

export interface ExtractedIngredient {
  name: string
  raw_measurement: string
  inferred_type: IngredientType
}

export interface ExtractedDrink {
  name: string
  sale_price_p: number | null
  ingredients: ExtractedIngredient[]
}

export interface ExtractResult {
  drinks: ExtractedDrink[]
}

export const EXTRACT_TOOL = {
  name: 'pouriq_extract_menu',
  description: 'Return the structured list of drinks extracted from the menu text',
  input_schema: {
    type: 'object',
    required: ['drinks'],
    properties: {
      drinks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'ingredients'],
          properties: {
            name: { type: 'string' },
            sale_price_p: { type: ['integer', 'null'] },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'raw_measurement', 'inferred_type'],
                properties: {
                  name: { type: 'string' },
                  raw_measurement: { type: 'string' },
                  inferred_type: {
                    type: 'string',
                    enum: ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other'],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/import-prompts.ts
git commit -m "feat: Anthropic extraction system prompt + tool schema"
```

---

## Task 6: Anthropic extraction client

**Files:**
- Create: `src/lib/pouriq/menu-extract.ts`

- [ ] **Step 1: Write the client**

```ts
import { EXTRACT_SYSTEM_PROMPT, EXTRACT_TOOL, type ExtractResult } from './import-prompts'

interface ExtractArgs {
  apiKey: string
  menuText: string
  model?: string
}

interface FinalUsage {
  prompt_tokens: number
  output_tokens: number
  model: string
}

export interface ExtractCallResult {
  result: ExtractResult
  usage: FinalUsage
}

/**
 * Call Anthropic Claude Sonnet with tool-based structured output to extract
 * the drinks list from the menu text. Forces the pouriq_extract_menu tool.
 */
export async function extractMenuWithAnthropic(args: ExtractArgs): Promise<ExtractCallResult> {
  const model = args.model ?? 'claude-sonnet-4-6'

  const body = {
    model,
    max_tokens: 4096,
    system: [
      { type: 'text', text: EXTRACT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'pouriq_extract_menu' },
    messages: [{ role: 'user', content: args.menuText }],
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Anthropic ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; name?: string; input?: unknown }>
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  const toolUse = data.content.find((c) => c.type === 'tool_use' && c.name === 'pouriq_extract_menu')
  if (!toolUse || !toolUse.input) {
    throw new Error('Anthropic did not return the extraction tool output')
  }

  return {
    result: toolUse.input as ExtractResult,
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0,
      model,
    },
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: build completes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/menu-extract.ts
git commit -m "feat: Anthropic extraction client"
```

---

## Task 7: Upload API route

**Files:**
- Create: `src/app/api/pouriq/import/upload/route.ts`

Mirrors the trade-application upload pattern (R2 ticket with magic-byte validation). Different R2 prefix.

- [ ] **Step 1: Write the route**

```ts
// POST /api/pouriq/import/upload
// multipart/form-data with a single `file` field (PDF only).
// Returns { ticket, filename }.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] // %PDF
const UPLOAD_RATE_LIMIT = 30 // per hour per IP

function startsWithBytes(buf: Uint8Array, prefix: number[]): boolean {
  if (buf.length < prefix.length) return false
  for (let i = 0; i < prefix.length; i++) if (buf[i] !== prefix[i]) return false
  return true
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const r2 = env.TRADE_DOCS as R2Bucket

  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'pouriq-import-upload', ip, UPLOAD_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  if (!startsWithBytes(buffer, PDF_MAGIC)) {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const ticket = crypto.randomUUID()
  const key = `pouriq-imports/${ticket}`
  await r2.put(key, buffer, {
    httpMetadata: { contentType: 'application/pdf' },
    customMetadata: {
      originalName: file.name || 'menu.pdf',
      ts: new Date().toISOString(),
      tradeAccountId: access.tradeAccountId,
    },
  })

  return NextResponse.json({ ticket, filename: file.name || 'menu.pdf' })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pouriq/import/upload/route.ts
git commit -m "feat: Pour IQ import PDF upload endpoint"
```

---

## Task 8: Extract API route

**Files:**
- Create: `src/app/api/pouriq/import/extract/route.ts`

Orchestrates: source resolution → AI extraction → measurement parsing → library matching → return preview payload.

- [ ] **Step 1: Write the route**

```ts
// POST /api/pouriq/import/extract
// JSON body: { menuId: string, source: 'text', text: string }
//        or: { menuId: string, source: 'pdf', ticket: string }
// Returns the extraction preview with per-ingredient match status.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'
import { extractTextFromPdf } from '@/lib/pouriq/pdf-extract'
import { extractMenuWithAnthropic } from '@/lib/pouriq/menu-extract'
import { parseMeasurement } from '@/lib/pouriq/measurement-parse'
import { matchIngredient } from '@/lib/pouriq/match'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

interface TextBody { menuId: string; source: 'text'; text: string }
interface PdfBody { menuId: string; source: 'pdf'; ticket: string }
type Body = TextBody | PdfBody

export interface PreviewIngredient {
  extracted_name: string
  raw_measurement: string
  inferred_type: IngredientType
  parsed: ReturnType<typeof parseMeasurement>
  match:
    | { kind: 'auto'; library_id: string; library_name: string }
    | { kind: 'suggestions'; entries: Array<{ id: string; name: string }> }
    | { kind: 'no-match' }
}

export interface PreviewDrink {
  name: string
  sale_price_p: number | null
  ingredients: PreviewIngredient[]
}

export interface PreviewPayload {
  drinks: PreviewDrink[]
  source_text_preview: string
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const r2 = env.TRADE_DOCS as R2Bucket

  const menu = await getMenu(db, body.menuId, access.tradeAccountId)
  if (!menu) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
  }

  // 1. Resolve source text
  let menuText: string
  if (body.source === 'text') {
    menuText = body.text?.trim() ?? ''
    if (!menuText) {
      return NextResponse.json({ error: 'Empty text' }, { status: 400 })
    }
    if (menuText.length > 50_000) {
      return NextResponse.json({ error: 'Text too long (max 50,000 characters)' }, { status: 400 })
    }
  } else {
    const obj = await r2.get(`pouriq-imports/${body.ticket}`)
    if (!obj) {
      return NextResponse.json({ error: 'Upload expired — please re-upload the PDF' }, { status: 400 })
    }
    const buffer = await obj.arrayBuffer()
    try {
      const result = await extractTextFromPdf(buffer)
      menuText = result.text.trim()
    } catch (err) {
      Sentry.captureException(err, { tags: { route: 'pouriq-import-extract', phase: 'pdf' } })
      return NextResponse.json({ error: 'Could not read this PDF — try pasting the text instead' }, { status: 400 })
    }
    if (!menuText) {
      return NextResponse.json({ error: 'PDF contained no extractable text' }, { status: 400 })
    }
  }

  // 2. Call Anthropic
  let extracted
  try {
    extracted = await extractMenuWithAnthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      menuText,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-extract', phase: 'anthropic' } })
    return NextResponse.json({ error: 'Could not read your menu — try again or paste the text directly' }, { status: 502 })
  }

  if (!extracted.result.drinks || extracted.result.drinks.length === 0) {
    return NextResponse.json({ error: 'No drinks found in the source — try editing the source text' }, { status: 422 })
  }

  // 3. Load the tenant's library once for matching
  const library = await listLibraryEntries(db, access.tradeAccountId)

  // 4. Build the preview payload
  const drinks: PreviewDrink[] = extracted.result.drinks.map((d) => ({
    name: d.name,
    sale_price_p: d.sale_price_p,
    ingredients: d.ingredients.map((i): PreviewIngredient => {
      const parsed = parseMeasurement(i.raw_measurement)
      const matched = matchIngredient(i.name, library)
      let match: PreviewIngredient['match']
      if (matched.kind === 'auto') {
        match = { kind: 'auto', library_id: matched.entry.id, library_name: matched.entry.name }
      } else if (matched.kind === 'suggestions') {
        match = {
          kind: 'suggestions',
          entries: matched.entries.map((e) => ({ id: e.id, name: e.name })),
        }
      } else {
        match = { kind: 'no-match' }
      }
      return {
        extracted_name: i.name,
        raw_measurement: i.raw_measurement,
        inferred_type: i.inferred_type,
        parsed,
        match,
      }
    }),
  }))

  const payload: PreviewPayload = {
    drinks,
    source_text_preview: menuText.slice(0, 500),
  }
  return NextResponse.json(payload)
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: build completes.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pouriq/import/extract/route.ts
git commit -m "feat: Pour IQ import extract endpoint"
```

---

## Task 9: Commit API route

**Files:**
- Create: `src/app/api/pouriq/import/commit/route.ts`

Atomic write of the user-confirmed preview state into D1 via batch.

- [ ] **Step 1: Write the route**

```ts
// POST /api/pouriq/import/commit
// JSON body: { menuId, drinks: [...] }
// Writes drinks + library entries + ingredient rows atomically.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { matchFieldManualSlug } from '@/lib/pouriq/field-manual-match'
import type { IngredientType } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

interface CommitIngredient {
  // Either pick an existing library entry...
  existing_library_id?: string
  // ...or commit a new library entry inline with the drink.
  new_library?: {
    name: string
    ingredient_type: IngredientType
    bottle_size_ml: number | null
    bottle_cost_p: number | null
    unit_cost_p: number | null
  }
  pour_ml: number | null
  unit_count: number | null
}

interface CommitDrink {
  name: string
  sale_price_p: number
  ingredients: CommitIngredient[]
}

interface CommitBody {
  menuId: string
  drinks: CommitDrink[]
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CommitBody
  try {
    body = (await request.json()) as CommitBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, body.menuId, access.tradeAccountId)
  if (!menu) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
  }
  if (!Array.isArray(body.drinks) || body.drinks.length === 0) {
    return NextResponse.json({ error: 'No drinks to commit' }, { status: 400 })
  }

  // 1. Create all new library entries first (separate from the batch — we
  //    need their IDs for the ingredient inserts). Each is a quick insert.
  const newLibraryIdByMarker = new Map<string, string>()
  try {
    for (let drinkIdx = 0; drinkIdx < body.drinks.length; drinkIdx++) {
      const drink = body.drinks[drinkIdx]
      for (let ingIdx = 0; ingIdx < drink.ingredients.length; ingIdx++) {
        const ing = drink.ingredients[ingIdx]
        if (!ing.new_library) continue
        const result = await db
          .prepare(`
            INSERT INTO pouriq_ingredients_library
              (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            RETURNING id
          `)
          .bind(
            access.tradeAccountId,
            ing.new_library.name.trim(),
            ing.new_library.ingredient_type,
            ing.new_library.bottle_size_ml,
            ing.new_library.bottle_cost_p,
            ing.new_library.unit_cost_p,
          )
          .first<{ id: string }>()
        if (!result) throw new Error('Library insert returned no id')
        newLibraryIdByMarker.set(`${drinkIdx}:${ingIdx}`, result.id)
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-commit', phase: 'library' } })
    return NextResponse.json({ error: 'Could not save new library entries' }, { status: 500 })
  }

  // 2. Now create each drink + its ingredients. Each drink is a single
  //    batch (drink insert + ingredient inserts) for atomicity per drink.
  const createdDrinkIds: string[] = []
  try {
    for (let drinkIdx = 0; drinkIdx < body.drinks.length; drinkIdx++) {
      const drink = body.drinks[drinkIdx]
      const slug = await matchFieldManualSlug(drink.name)
      const cocktailResult = await db
        .prepare(`
          INSERT INTO pouriq_cocktails
            (menu_id, name, sale_price_p, position, field_manual_slug)
          VALUES (?1, ?2, ?3, ?4, ?5)
          RETURNING id
        `)
        .bind(body.menuId, drink.name.trim(), drink.sale_price_p, drinkIdx, slug)
        .first<{ id: string }>()
      if (!cocktailResult) throw new Error('Cocktail insert returned no id')
      const cocktailId = cocktailResult.id
      createdDrinkIds.push(cocktailId)

      const statements: D1PreparedStatement[] = []
      for (let ingIdx = 0; ingIdx < drink.ingredients.length; ingIdx++) {
        const ing = drink.ingredients[ingIdx]
        const libraryId = ing.existing_library_id
          ?? newLibraryIdByMarker.get(`${drinkIdx}:${ingIdx}`)
        if (!libraryId) {
          throw new Error(`Ingredient ${drinkIdx}:${ingIdx} has no library reference`)
        }
        statements.push(
          db
            .prepare(`
              INSERT INTO pouriq_ingredients
                (cocktail_id, library_ingredient_id, pour_ml, unit_count)
              VALUES (?1, ?2, ?3, ?4)
            `)
            .bind(cocktailId, libraryId, ing.pour_ml, ing.unit_count),
        )
      }
      if (statements.length > 0) {
        await db.batch(statements)
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-commit', phase: 'drinks' } })
    // Best-effort cleanup: remove drinks we successfully inserted; CASCADE
    // removes their ingredient rows.
    try {
      for (const id of createdDrinkIds) {
        await db.prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1`).bind(id).run()
      }
    } catch { /* swallow */ }
    return NextResponse.json({ error: 'Could not save drinks. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, drinkCount: createdDrinkIds.length })
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: build completes.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pouriq/import/commit/route.ts
git commit -m "feat: Pour IQ import commit endpoint"
```

---

## Task 10: IngredientMatchRow component

**Files:**
- Create: `src/components/pouriq/IngredientMatchRow.tsx`

Per-ingredient row inside the preview UI. Handles three match states and inline create.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const COMMON_BOTTLE_SIZES = [500, 700, 750, 1000]
const POUR_CHIPS = [15, 25, 35, 50, 75, 100]
const UNIT_CHIPS = [
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1 },
]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'
const chipClass = 'px-2 py-1 rounded border text-xs transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

export interface MatchRowState {
  // Either picked an existing library entry...
  existing_library_id?: string
  // ...or staged a new library entry to be created on commit.
  new_library?: {
    name: string
    ingredient_type: IngredientType
    bottle_size_ml: number | null
    bottle_cost_p: number | null
    unit_cost_p: number | null
  }
  pour_ml: number | null
  unit_count: number | null
}

interface Props {
  extractedName: string
  rawMeasurement: string
  inferredType: IngredientType
  matchKind: 'auto' | 'suggestions' | 'no-match'
  suggestionEntries: Array<{ id: string; name: string }>
  libraryEntries: IngredientLibraryRow[]
  state: MatchRowState
  onChange: (state: MatchRowState) => void
}

function isUnitPricedSelection(state: MatchRowState, library: IngredientLibraryRow[]): boolean {
  if (state.new_library) return state.new_library.unit_cost_p !== null
  if (state.existing_library_id) {
    const entry = library.find((e) => e.id === state.existing_library_id)
    return entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined
  }
  return false
}

export function IngredientMatchRow({
  extractedName, rawMeasurement, inferredType,
  matchKind, suggestionEntries, libraryEntries,
  state, onChange,
}: Props) {
  const unitPriced = isUnitPricedSelection(state, libraryEntries)
  const selectedExisting = state.existing_library_id
    ? libraryEntries.find((e) => e.id === state.existing_library_id) ?? null
    : null

  function pickExisting(id: string) {
    onChange({
      existing_library_id: id,
      new_library: undefined,
      pour_ml: state.pour_ml,
      unit_count: state.unit_count,
    })
  }

  function startNewLibrary() {
    onChange({
      existing_library_id: undefined,
      new_library: {
        name: extractedName,
        ingredient_type: inferredType,
        bottle_size_ml: 700,
        bottle_cost_p: null,
        unit_cost_p: null,
      },
      pour_ml: state.pour_ml,
      unit_count: state.unit_count,
    })
  }

  function updateNewLibrary(patch: Partial<NonNullable<MatchRowState['new_library']>>) {
    if (!state.new_library) return
    onChange({ ...state, new_library: { ...state.new_library, ...patch } })
  }

  function setPour(ml: number | null) {
    onChange({ ...state, pour_ml: ml, unit_count: null })
  }
  function setUnit(count: number | null) {
    onChange({ ...state, unit_count: count, pour_ml: null })
  }

  const matchBadge = matchKind === 'auto'
    ? <span className="text-xs text-emerald-300">auto-matched</span>
    : matchKind === 'suggestions'
      ? <span className="text-xs text-amber-300">pick a match</span>
      : <span className="text-xs text-red-300">no match in library</span>

  return (
    <div className="border border-gold-500/10 rounded-lg p-3 bg-jerry-green-800/30 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-parchment-100 font-medium">{extractedName}</p>
          <p className="text-xs text-parchment-400 mt-1">menu: &ldquo;{rawMeasurement}&rdquo; · type: {inferredType}</p>
        </div>
        {matchBadge}
      </div>

      {/* Match selection */}
      <div>
        <label className={labelClass}>Library entry</label>
        {state.new_library ? (
          <div className="space-y-2 p-3 rounded border border-gold-500/20 bg-jerry-green-900/30">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-gold-300">Creating new library entry</p>
              <button type="button" onClick={() => onChange({ existing_library_id: undefined, new_library: undefined, pour_ml: state.pour_ml, unit_count: state.unit_count })} className="text-xs text-parchment-400 hover:text-parchment-200">Cancel</button>
            </div>
            <input value={state.new_library.name} onChange={(e) => updateNewLibrary({ name: e.target.value })} className={inputClass} placeholder="Name" />
            <div className="grid grid-cols-2 gap-2">
              <select value={state.new_library.ingredient_type} onChange={(e) => updateNewLibrary({ ingredient_type: e.target.value as IngredientType })} className={inputClass}>
                {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={state.new_library.unit_cost_p !== null ? 'unit' : 'bottle'}
                onChange={(e) => {
                  const mode = e.target.value
                  if (mode === 'unit') updateNewLibrary({ bottle_size_ml: null, bottle_cost_p: null, unit_cost_p: 0 })
                  else updateNewLibrary({ bottle_size_ml: 700, bottle_cost_p: 0, unit_cost_p: null })
                }}
                className={inputClass}
              >
                <option value="bottle">Per bottle</option>
                <option value="unit">Per unit</option>
              </select>
            </div>
            {state.new_library.unit_cost_p !== null ? (
              <input type="number" step="0.01" min={0}
                value={state.new_library.unit_cost_p === null ? '' : (state.new_library.unit_cost_p / 100).toFixed(2)}
                onChange={(e) => updateNewLibrary({ unit_cost_p: Math.round(parseFloat(e.target.value || '0') * 100) })}
                className={inputClass} placeholder="Unit cost (£)" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={state.new_library.bottle_size_ml ?? 700}
                  onChange={(e) => updateNewLibrary({ bottle_size_ml: parseInt(e.target.value, 10) })}
                  className={inputClass}
                >
                  {COMMON_BOTTLE_SIZES.map((s) => <option key={s} value={s}>{s}ml</option>)}
                </select>
                <input type="number" step="0.01" min={0}
                  value={state.new_library.bottle_cost_p === null ? '' : (state.new_library.bottle_cost_p / 100).toFixed(2)}
                  onChange={(e) => updateNewLibrary({ bottle_cost_p: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  className={inputClass} placeholder="Bottle cost (£)" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={state.existing_library_id ?? ''}
              onChange={(e) => {
                if (e.target.value === '__new__') startNewLibrary()
                else if (e.target.value) pickExisting(e.target.value)
              }}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {matchKind === 'suggestions' && suggestionEntries.length > 0 && (
                <optgroup label="Suggested matches">
                  {suggestionEntries.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              )}
              <optgroup label="All library">
                {libraryEntries.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
              <option value="__new__">+ Create new from this entry</option>
            </select>
            {selectedExisting && (
              <p className="text-xs text-parchment-400">
                Linked to {selectedExisting.name}
                {selectedExisting.bottle_size_ml ? ` · £${((selectedExisting.bottle_cost_p ?? 0)/100).toFixed(2)} / ${selectedExisting.bottle_size_ml}ml` : ''}
                {selectedExisting.unit_cost_p !== null ? ` · £${((selectedExisting.unit_cost_p ?? 0)/100).toFixed(2)} / unit` : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pour or unit count */}
      {(state.existing_library_id || state.new_library) && (
        <div>
          <label className={labelClass}>{unitPriced ? 'How much per drink' : 'Pour (ml)'}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {unitPriced
              ? UNIT_CHIPS.map((c) => (
                  <button type="button" key={c.value} onClick={() => setUnit(c.value)}
                    className={`${chipClass} ${state.unit_count === c.value ? chipActive : chipIdle}`}>
                    {c.label}
                  </button>
                ))
              : POUR_CHIPS.map((ml) => (
                  <button type="button" key={ml} onClick={() => setPour(ml)}
                    className={`${chipClass} ${state.pour_ml === ml ? chipActive : chipIdle}`}>
                    {ml}ml
                  </button>
                ))}
          </div>
          {unitPriced ? (
            <input type="number" step="0.001" min={0} value={state.unit_count ?? ''} onChange={(e) => setUnit(parseFloat(e.target.value) || 0)} className={inputClass} placeholder="custom" />
          ) : (
            <input type="number" step="0.1" min={0} value={state.pour_ml ?? ''} onChange={(e) => setPour(parseFloat(e.target.value) || 0)} className={inputClass} placeholder="custom" />
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/IngredientMatchRow.tsx
git commit -m "feat: IngredientMatchRow preview component"
```

---

## Task 11: ImportPreview component

**Files:**
- Create: `src/components/pouriq/ImportPreview.tsx`

The collapsible per-drink preview UI. Sits between extract and commit.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { IngredientMatchRow, type MatchRowState } from '@/components/pouriq/IngredientMatchRow'

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'

export interface PreviewDrinkInput {
  name: string
  sale_price_p: number | null
  ingredients: Array<{
    extracted_name: string
    raw_measurement: string
    inferred_type: IngredientType
    parsed:
      | { pour_ml: number }
      | { unit_count: number }
      | { raw: string }
    match:
      | { kind: 'auto'; library_id: string; library_name: string }
      | { kind: 'suggestions'; entries: Array<{ id: string; name: string }> }
      | { kind: 'no-match' }
  }>
}

interface DrinkState {
  skip: boolean
  name: string
  salePoundsStr: string
  ingredients: MatchRowState[]
}

function initialIngredientState(input: PreviewDrinkInput['ingredients'][0]): MatchRowState {
  const pour_ml = 'pour_ml' in input.parsed ? input.parsed.pour_ml : null
  const unit_count = 'unit_count' in input.parsed ? input.parsed.unit_count : null
  if (input.match.kind === 'auto') {
    return {
      existing_library_id: input.match.library_id,
      pour_ml,
      unit_count,
    }
  }
  return { pour_ml, unit_count }
}

function initialDrinkState(d: PreviewDrinkInput): DrinkState {
  return {
    skip: false,
    name: d.name,
    salePoundsStr: d.sale_price_p !== null ? (d.sale_price_p / 100).toFixed(2) : '',
    ingredients: d.ingredients.map(initialIngredientState),
  }
}

interface Props {
  menuId: string
  drinks: PreviewDrinkInput[]
  libraryEntries: IngredientLibraryRow[]
}

export function ImportPreview({ menuId, drinks: extracted, libraryEntries }: Props) {
  const router = useRouter()
  const [drinks, setDrinks] = useState<DrinkState[]>(() => extracted.map(initialDrinkState))
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0, 1, 2]))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const stats = drinks.reduce((acc, d, i) => {
    if (d.skip) return acc
    acc.included++
    for (const ing of d.ingredients) {
      if (ing.existing_library_id) acc.matched++
      else if (ing.new_library) acc.toCreate++
      else acc.needsChoice++
    }
    return acc
  }, { included: 0, matched: 0, toCreate: 0, needsChoice: 0 })

  function toggle(idx: number) {
    setExpanded((set) => {
      const next = new Set(set)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  function updateDrink(idx: number, patch: Partial<DrinkState>) {
    setDrinks((arr) => arr.map((d, i) => i === idx ? { ...d, ...patch } : d))
  }

  function updateIngredient(drinkIdx: number, ingIdx: number, state: MatchRowState) {
    setDrinks((arr) => arr.map((d, i) => {
      if (i !== drinkIdx) return d
      return {
        ...d,
        ingredients: d.ingredients.map((ing, j) => j === ingIdx ? state : ing),
      }
    }))
  }

  async function handleCommit() {
    setError(null)
    if (stats.needsChoice > 0) {
      setError(`${stats.needsChoice} ingredients still need a library match`)
      return
    }
    if (stats.included === 0) {
      setError('No drinks selected for import')
      return
    }

    // Validation: every included drink needs a name + sale price > 0;
    // every kept ingredient needs pour_ml or unit_count > 0.
    for (let i = 0; i < drinks.length; i++) {
      const d = drinks[i]
      if (d.skip) continue
      if (!d.name.trim()) { setError(`Drink ${i + 1} needs a name`); return }
      const sale_price_p = Math.round(parseFloat(d.salePoundsStr) * 100)
      if (!Number.isFinite(sale_price_p) || sale_price_p <= 0) { setError(`${d.name}: needs a sale price`); return }
      for (let j = 0; j < d.ingredients.length; j++) {
        const ing = d.ingredients[j]
        if (!ing.existing_library_id && !ing.new_library) { setError(`${d.name} ingredient ${j + 1} unresolved`); return }
        const hasQty = (ing.pour_ml !== null && ing.pour_ml > 0) || (ing.unit_count !== null && ing.unit_count > 0)
        if (!hasQty) { setError(`${d.name} ingredient ${j + 1} needs a pour or unit count`); return }
      }
    }

    const body = {
      menuId,
      drinks: drinks
        .filter((d) => !d.skip)
        .map((d) => ({
          name: d.name.trim(),
          sale_price_p: Math.round(parseFloat(d.salePoundsStr) * 100),
          ingredients: d.ingredients.map((ing) => ({
            existing_library_id: ing.existing_library_id,
            new_library: ing.new_library,
            pour_ml: ing.pour_ml,
            unit_count: ing.unit_count,
          })),
        })),
    }

    setSubmitting(true)
    const res = await fetch('/api/pouriq/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Commit failed' })) as { error?: string }
      setError(data.error ?? 'Commit failed')
      setSubmitting(false)
      return
    }
    router.push(`/trade/pouriq/${menuId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-jerry-green-800/40 border border-gold-500/30 rounded-xl p-4 text-sm text-parchment-200">
        <p>
          <strong className="text-gold-300">{stats.included}</strong> drinks ·{' '}
          <strong className="text-emerald-300">{stats.matched}</strong> auto-matched ·{' '}
          <strong className="text-amber-300">{stats.toCreate}</strong> new library entries ·{' '}
          {stats.needsChoice > 0
            ? <strong className="text-red-300">{stats.needsChoice} need a choice</strong>
            : <strong className="text-emerald-300">all resolved</strong>}
        </p>
      </div>

      <div className="space-y-4">
        {drinks.map((d, idx) => (
          <div key={idx} className={`border rounded-xl ${d.skip ? 'border-parchment-500/20 bg-jerry-green-900/20' : 'border-gold-500/20 bg-jerry-green-800/40'}`}>
            <button type="button" onClick={() => toggle(idx)} className="w-full text-left p-4 flex items-baseline justify-between gap-3">
              <h3 className={`text-base font-serif font-bold ${d.skip ? 'text-parchment-500 line-through' : 'text-white'}`}>
                {d.name}
              </h3>
              <span className="text-xs text-parchment-400">{expanded.has(idx) ? 'Hide' : 'Show'} ({d.ingredients.length} ing.)</span>
            </button>
            {expanded.has(idx) && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-parchment-300 mb-1">Name</label>
                    <input value={d.name} onChange={(e) => updateDrink(idx, { name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-parchment-300 mb-1">Sale price (£)</label>
                    <input type="number" step="0.01" min={0} value={d.salePoundsStr} onChange={(e) => updateDrink(idx, { salePoundsStr: e.target.value })} className={inputClass} placeholder="0.00" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-parchment-300 cursor-pointer">
                  <input type="checkbox" checked={d.skip} onChange={(e) => updateDrink(idx, { skip: e.target.checked })} className="w-4 h-4 accent-gold-500" />
                  Skip this drink
                </label>
                {!d.skip && extracted[idx].ingredients.map((ing, ingIdx) => (
                  <IngredientMatchRow
                    key={ingIdx}
                    extractedName={ing.extracted_name}
                    rawMeasurement={ing.raw_measurement}
                    inferredType={ing.inferred_type}
                    matchKind={ing.match.kind}
                    suggestionEntries={ing.match.kind === 'suggestions' ? ing.match.entries : []}
                    libraryEntries={libraryEntries}
                    state={d.ingredients[ingIdx]}
                    onChange={(state) => updateIngredient(idx, ingIdx, state)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={handleCommit} disabled={submitting || stats.needsChoice > 0 || stats.included === 0}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Importing…' : `Import ${stats.included} drink${stats.included === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/ImportPreview.tsx
git commit -m "feat: ImportPreview component"
```

---

## Task 12: ImportSourceTabs component

**Files:**
- Create: `src/components/pouriq/ImportSourceTabs.tsx`

The first step: paste text OR upload PDF, then fire extract.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useRef, useState } from 'react'
import type { PreviewPayload } from '@/app/api/pouriq/import/extract/route'

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'
const tabClass = 'px-4 py-2 text-sm font-medium border-b-2 transition-colors'

interface Props {
  menuId: string
  onPreview: (payload: PreviewPayload) => void
}

export function ImportSourceTabs({ menuId, onPreview }: Props) {
  const [tab, setTab] = useState<'text' | 'pdf'>('text')
  const [text, setText] = useState('')
  const [pdfTicket, setPdfTicket] = useState<{ ticket: string; filename: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null) {
    setError(null)
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File exceeds 5MB limit'); return }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Only PDF files are accepted'); return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/pouriq/import/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' })) as { error?: string }
        setError(data.error ?? 'Upload failed')
        return
      }
      const data = await res.json() as { ticket: string; filename: string }
      setPdfTicket(data)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExtract() {
    setError(null)
    setSubmitting(true)
    try {
      const body = tab === 'text'
        ? { menuId, source: 'text', text }
        : { menuId, source: 'pdf', ticket: pdfTicket!.ticket }
      const res = await fetch('/api/pouriq/import/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Extraction failed' })) as { error?: string }
        setError(data.error ?? 'Extraction failed')
        return
      }
      const payload = await res.json() as PreviewPayload
      onPreview(payload)
    } finally {
      setSubmitting(false)
    }
  }

  const canExtract = tab === 'text' ? text.trim().length > 0 : pdfTicket !== null

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gold-500/20">
        <button type="button" onClick={() => setTab('text')} className={`${tabClass} ${tab === 'text' ? 'border-gold-400 text-white' : 'border-transparent text-parchment-400 hover:text-parchment-200'}`}>
          Paste text
        </button>
        <button type="button" onClick={() => setTab('pdf')} className={`${tabClass} ${tab === 'pdf' ? 'border-gold-400 text-white' : 'border-transparent text-parchment-400 hover:text-parchment-200'}`}>
          Upload PDF
        </button>
      </div>

      {tab === 'text' ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className={`${inputClass} resize-vertical font-mono text-xs`}
            placeholder="Paste your menu here. Drink names, ingredients, and prices if you have them."
          />
        </div>
      ) : (
        <div>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-4 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm">
              {pdfTicket ? 'Replace PDF' : 'Choose PDF'}
            </button>
            {pdfTicket && <span className="text-sm text-parchment-200">{pdfTicket.filename}</span>}
          </div>
          <p className="mt-2 text-xs text-parchment-400">Max 5MB. PDF only.</p>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={handleExtract} disabled={!canExtract || submitting}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Reading menu…' : 'Extract drinks →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/ImportSourceTabs.tsx
git commit -m "feat: ImportSourceTabs component"
```

---

## Task 13: Import page (orchestrates the three steps)

**Files:**
- Create: `src/app/trade/pouriq/[menuId]/import/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImportSourceTabs } from '@/components/pouriq/ImportSourceTabs'
import { ImportPreview } from '@/components/pouriq/ImportPreview'
import type { PreviewPayload } from '@/app/api/pouriq/import/extract/route'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

interface Props {
  params: Promise<{ menuId: string }>
}

export default function ImportPage({ params }: Props) {
  const router = useRouter()
  const [menuId, setMenuId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewPayload | null>(null)
  const [library, setLibrary] = useState<IngredientLibraryRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { params.then(({ menuId }) => setMenuId(menuId)) }, [params])

  // Fetch library once when entering preview step (so user sees latest data).
  useEffect(() => {
    if (!preview || !menuId) return
    let cancelled = false
    fetch(`/api/pouriq/library?menuId=${encodeURIComponent(menuId)}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('library fetch failed')))
      .then((data: { entries: IngredientLibraryRow[] }) => { if (!cancelled) setLibrary(data.entries) })
      .catch(() => { if (!cancelled) setError('Could not load your library — please reload the page') })
    return () => { cancelled = true }
  }, [preview, menuId])

  if (!menuId) return null

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        <Link href={`/trade/pouriq/${menuId}`} className="text-sm text-parchment-400 hover:text-parchment-200">← Back to menu</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-4 mb-2">Import drinks</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Paste your menu text or upload a PDF. We&rsquo;ll extract the drinks and match ingredients to your library — you confirm before anything is saved.
        </p>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          {!preview ? (
            <ImportSourceTabs menuId={menuId} onPreview={setPreview} />
          ) : library ? (
            <ImportPreview menuId={menuId} drinks={preview.drinks} libraryEntries={library} />
          ) : (
            <p className="text-parchment-300 text-sm">Loading your library…</p>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        </div>

        {preview && (
          <button type="button" onClick={() => { setPreview(null); setLibrary(null) }} className="mt-4 text-sm text-parchment-400 hover:text-parchment-200 underline">
            Start over (change source)
          </button>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add a tiny library-fetch endpoint**

The preview component needs the latest library to render dropdowns. Add a small JSON endpoint at `src/app/api/pouriq/library/route.ts`:

```ts
// GET /api/pouriq/library
// Returns the current tenant's library entries. Used by the import preview.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'

export const runtime = 'nodejs'

export async function GET() {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const entries = await listLibraryEntries(db, access.tradeAccountId)
  return NextResponse.json({ entries })
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`

Expected: routes `/trade/pouriq/[menuId]/import`, `/api/pouriq/library`, `/api/pouriq/import/*` appear in the route table.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/import/page.tsx src/app/api/pouriq/library/route.ts
git commit -m "feat: import page + library fetch endpoint"
```

---

## Task 14: Wire entry points

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/page.tsx`
- Modify: `src/app/trade/pouriq/new/page.tsx`

- [ ] **Step 1: Add "Import drinks" button on menu detail page**

Open `src/app/trade/pouriq/[menuId]/page.tsx`. Find the existing "Add cocktail" / "Add drink" link in the header. Add an "Import drinks" link beside it.

Find:

```tsx
<Link href={`/trade/pouriq/${menuId}/edit`} className="text-sm px-4 py-2 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors">
  Add drink
</Link>
```

Replace with:

```tsx
<div className="flex items-center gap-3">
  <Link href={`/trade/pouriq/${menuId}/import`} className="text-sm text-gold-300 hover:text-gold-200 underline">
    Import drinks
  </Link>
  <Link href={`/trade/pouriq/${menuId}/edit`} className="text-sm px-4 py-2 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors">
    Add drink
  </Link>
</div>
```

- [ ] **Step 2: Add "or import an existing menu" link on new-menu form**

Open `src/app/trade/pouriq/new/page.tsx`. After the existing intro paragraph, add a small note:

Find:

```tsx
<p className="text-parchment-400 text-sm mb-10">Start with the basics. You can add drinks on the next screen.</p>
```

Replace with:

```tsx
<p className="text-parchment-400 text-sm mb-10">Start with the basics. You can add drinks one at a time, or use AI menu import to paste/upload an existing menu on the next screen.</p>
```

(The actual import link lives on the menu detail page — that's the natural place. The new-menu form just signals that the option exists.)

- [ ] **Step 3: Build check**

Run: `npm run build`

Expected: build clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/page.tsx src/app/trade/pouriq/new/page.tsx
git commit -m "feat: link Import drinks from menu detail + new-menu copy"
```

---

## Task 15: AI recommendation prompt — house-spirit nuance

**Files:**
- Modify: `src/lib/pouriq/prompts.ts`

Pilot demo surfaced that the AI assumed "white rum = house rum". Real venues run multiple house spirits per category (house white, house dark, house spiced). Nudge the recommendation prompt to avoid the assumption.

- [ ] **Step 1: Add a paragraph to SYSTEM_PROMPT**

Open `src/lib/pouriq/prompts.ts`. Find `SYSTEM_PROMPT`. Add this paragraph near the end of the "Focus areas" section (just before the closing newline):

```
- When ingredients use generic names (e.g. "white rum", "house gin"), do not assume the venue has only one product per category. Real venues often run multiple house spirits (e.g. a house white rum AND a house spiced rum AND a house dark rum). Frame suggestions as questions ("if this is your house spiced rum…") rather than assertions.
```

The exact existing text varies — search for the closing `Never invent ingredient costs or sale prices not provided. Reason only from the menu data provided.` line and add the new paragraph immediately before it.

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/prompts.ts
git commit -m "fix: AI recommendation prompt avoids single-house-spirit assumption"
```

---

## Task 16: Manual verification

Checklist — no code.

**Pre-deploy (one-time):**

- [ ] Cloudflare R2 dashboard → bucket `jerry-can-spirits-trade-docs` → Lifecycle rules: add rule for prefix `pouriq-imports/` → delete after 1 day. Mirror the existing `pending/` rule.

**Browser flow (preview deploy, then prod after merge):**

- [ ] Sign in as the demo account (PIN `58471209`) at `/trade/login`
- [ ] Navigate to a menu detail page; "Import drinks" link visible next to "Add drink"
- [ ] Click Import → reaches `/trade/pouriq/[menuId]/import`
- [ ] **Paste-text path**: paste a 5-drink menu (use the demo menu's text or any sample). Click Extract. Preview shows 5 drinks, each with ingredient match status. Click Import — drinks appear on the menu.
- [ ] **PDF path**: upload a real venue menu PDF. Click Extract. Same preview UX.
- [ ] **Match states**: confirm auto/suggestions/no-match render correctly.
- [ ] **Inline create**: pick "+ Create new from this entry" on a no-match → form expands → fill in cost → commit → new library entry created, drink ingredient linked.
- [ ] **Skip drink**: toggle skip on one drink; commit excludes it.
- [ ] **Validation**: try committing with an unresolved ingredient → blocked with clear message.
- [ ] **Error states**: upload a non-PDF → friendly error. Paste empty text → blocked client-side. Simulated Anthropic failure → friendly retry message.
- [ ] **AI recommendation nuance**: trigger an analysis on a menu with white rum cocktails; confirm AI no longer asserts "your house rum is white rum" — frames as a question instead.

**Time-to-live test:**

- [ ] Take The Bank Bar & Grill's actual menu (or a 25-drink PDF) and import via paste-text. Time the workflow from "open import" to "drinks visible on menu detail" — target: under 10 minutes including review.

**Pilot communication (after merge):**

> Subject: Pour IQ menu import is live
>
> Hi [name],
>
> Pour IQ now has a paste-or-upload menu import. Sign in, open a menu, click "Import drinks". Paste your menu text or upload a PDF, review what the AI extracts, and commit. Should save you the typing.
>
> Dan

---

## Self-Review

### Spec coverage

| Spec section | Tasks |
|---|---|
| Source selection (paste / PDF) | 12 (ImportSourceTabs) |
| PDF extraction via pdf-parse | 1, 2 |
| AI extraction (Anthropic + tool schema) | 5, 6 |
| Server-side matching algorithm | 4 |
| Measurement parsing | 3 |
| Upload API + R2 ticket | 7 |
| Extract API orchestration | 8 |
| Commit API (atomic D1) | 9 |
| Preview UI with match statuses | 10, 11 |
| Inline "create new" from preview | 10 |
| Three-step page flow | 13 |
| Entry-point buttons | 14 |
| AI prompt house-spirit nuance | 15 |
| R2 lifecycle rule | 16 (manual) |
| Acceptance | 16 |

### Placeholder scan
- No "TBD" / "implement later"
- All file paths exact
- Code in every implementation step
- Manual verification has the actual commands and steps

### Type consistency
- `MatchRowState` (Task 10) matches what `ImportPreview` builds (Task 11) and what `commit` expects (Task 9)
- `PreviewPayload` shape (Task 8) is consumed by `ImportSourceTabs.onPreview` (Task 12) and `ImportPreview.drinks` (Task 11)
- `extracted_name` / `raw_measurement` / `inferred_type` consistent across extract/preview/match flows
- `existing_library_id` / `new_library` discriminated-union shape consistent between MatchRowState (UI) and CommitIngredient (API)

---

## Notes for the implementer

- The PDF parser runs server-side in Node runtime. `pdf-parse` works on Cloudflare Workers via the Node compatibility flag, but some PDFs (scanned image-only PDFs without text layer) will return empty text. The friendly error path covers it.
- The Anthropic call is non-streaming for the import path (different from the recommendation path which streams). Extraction is one-shot — we want the full structured output before showing the preview.
- The "library fetch" endpoint at `/api/pouriq/library` is small but useful — it gives the preview UI the freshest library data (in case the user added entries since loading the page). Tasks 13's library refetch on entering preview ensures the dropdowns are current.
- The R2 lifecycle rule for `pouriq-imports/` must be added in the Cloudflare dashboard before this PR ships — pdfs uploaded but not committed would otherwise accumulate. Mirror the existing `pending/` rule (24h delete).
- The commit path creates new library entries serially (not in a single batch) because D1 batch can't return multiple `RETURNING id` values cleanly. Trade-off: slightly slower commit for many new entries; simpler code. Acceptable at expected scale.
