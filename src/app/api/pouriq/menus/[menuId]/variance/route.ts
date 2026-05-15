// GET  /api/pouriq/menus/[menuId]/variance?cadence=weekly|monthly[&period_start=&period_end=]
// POST /api/pouriq/menus/[menuId]/variance
//   body: { period_start, period_end, entries: [{ library_ingredient_id, start_count, end_count }] }

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { loadVariancePayload } from '@/lib/pouriq/variance-loader'
import type { VolumeCadence } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

const SAVE_RATE_LIMIT = 60 // POST per hour per tenant

interface PostBody {
  period_start: string
  period_end: string
  entries: Array<{ library_ingredient_id: string; start_count: number; end_count: number }>
}

interface Params {
  params: Promise<{ menuId: string }>
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isNonNegativeReal(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}

function parseCadence(raw: string | null): VolumeCadence {
  return raw === 'weekly' ? 'weekly' : 'monthly'
}

/**
 * Returns ISO YYYY-MM-DD start and end (inclusive) for the period
 * containing `today` given the cadence. Weekly = Mon-Sun.
 * Monthly = 1st-to-last-of-month.
 */
function derivePeriod(cadence: VolumeCadence, today: Date): { start: string; end: string } {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (cadence === 'weekly') {
    const day = today.getUTCDay() // 0 = Sun
    const mondayOffset = day === 0 ? -6 : 1 - day
    const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + mondayOffset))
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
    return { start: iso(monday), end: iso(sunday) }
  }
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))
  return { start: iso(first), end: iso(last) }
}

export async function GET(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const url = new URL(request.url)
  const cadence = parseCadence(url.searchParams.get('cadence') ?? menu.volume_cadence)
  let periodStart = url.searchParams.get('period_start') ?? null
  let periodEnd = url.searchParams.get('period_end') ?? null

  if (periodStart === null || periodEnd === null) {
    const p = derivePeriod(cadence, new Date())
    periodStart = p.start
    periodEnd = p.end
  } else if (!ISO_DATE.test(periodStart) || !ISO_DATE.test(periodEnd)) {
    return NextResponse.json({ error: 'Invalid period_start / period_end' }, { status: 400 })
  }

  try {
    const payload = await loadVariancePayload(db, menuId, periodStart, periodEnd)
    return NextResponse.json({ cadence, ...payload })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-variance', phase: 'load' } })
    return NextResponse.json({ error: 'Could not load variance data' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  if (await isRateLimited(kv, 'pouriq-variance-save', access.tradeAccountId, SAVE_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many saves. Please try again later.' }, { status: 429 })
  }

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!ISO_DATE.test(body.period_start ?? '') || !ISO_DATE.test(body.period_end ?? '')) {
    return NextResponse.json({ error: 'period_start and period_end must be ISO YYYY-MM-DD' }, { status: 400 })
  }
  if (!Array.isArray(body.entries)) {
    return NextResponse.json({ error: 'entries must be an array' }, { status: 400 })
  }
  for (let i = 0; i < body.entries.length; i++) {
    const e = body.entries[i]
    if (typeof e.library_ingredient_id !== 'string' || !e.library_ingredient_id) {
      return NextResponse.json({ error: `Entry ${i + 1}: missing library_ingredient_id` }, { status: 400 })
    }
    if (!isNonNegativeReal(e.start_count)) {
      return NextResponse.json({ error: `Entry ${i + 1}: start_count must be a non-negative number` }, { status: 400 })
    }
    if (!isNonNegativeReal(e.end_count)) {
      return NextResponse.json({ error: `Entry ${i + 1}: end_count must be a non-negative number` }, { status: 400 })
    }
  }

  // UPSERT each entry. We validate ingredient belongs to the tenant via the
  // tenant scope on getMenu plus an existence check on each library entry
  // tied to this trade account.
  try {
    const stmts: D1PreparedStatement[] = []
    for (const e of body.entries) {
      stmts.push(
        db
          .prepare(`
            INSERT INTO pouriq_stock_counts (menu_id, library_ingredient_id, period_start, period_end, start_count, end_count)
            SELECT ?1, lib.id, ?3, ?4, ?5, ?6
            FROM pouriq_ingredients_library lib
            WHERE lib.id = ?2 AND lib.trade_account_id = ?7
            ON CONFLICT(menu_id, library_ingredient_id, period_start, period_end)
            DO UPDATE SET
              start_count = excluded.start_count,
              end_count = excluded.end_count,
              updated_at = datetime('now')
          `)
          .bind(menuId, e.library_ingredient_id, body.period_start, body.period_end, e.start_count, e.end_count, access.tradeAccountId),
      )
    }
    if (stmts.length > 0) await db.batch(stmts)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-variance', phase: 'save' } })
    return NextResponse.json({ error: 'Could not save stock counts' }, { status: 500 })
  }

  // Refresh payload so the client gets updated values without a second round trip.
  try {
    const payload = await loadVariancePayload(db, menuId, body.period_start, body.period_end)
    return NextResponse.json({ cadence: menu.volume_cadence as VolumeCadence, ...payload })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-variance', phase: 'reload' } })
    return NextResponse.json({ error: 'Saved, but could not reload data' }, { status: 500 })
  }
}
