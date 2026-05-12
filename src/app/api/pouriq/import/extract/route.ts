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
