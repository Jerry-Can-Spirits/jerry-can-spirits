// GET  /api/trade/sharepoint-check                 — report what Graph can see
// POST /api/trade/sharepoint-check {application_id} — push one venue, return the real error
//
// WHY THIS EXISTS. The first SharePoint push failed and left no way to find out
// why. The push is non-fatal by design, so a request that silently failed and
// one that silently succeeded looked identical from outside; Sentry's token had
// expired and the Cloudflare observability connector is authenticated to a
// different account. Three routes to the answer, all shut, and the only
// remaining diagnostic was "go and look at the site".
//
// An integration whose failures are invisible is an integration nobody can
// maintain. This surfaces the actual Graph response to an authenticated admin
// caller — the token, the site, the list, its columns, and what a push would do
// or did.
//
// GET is read-only. POST writes, and is the same call the application routes
// make, so a success here means a success there.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { GRAPH, getGraphToken, graphConfigured, graphFetch, type GraphEnv } from '@/lib/sharepoint/graph'
import { pushApplicationToSharePoint } from '@/lib/sharepoint/push'
import { ensureKeyColumn } from '@/lib/sharepoint/trade-list'

export const runtime = 'nodejs'

function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function authorised(request: Request, expected?: string): boolean {
  const presented = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(expected && presented && tokensMatch(expected, presented))
}

export async function GET(request: Request) {
  const { env } = await getCloudflareContext()
  const e = env as unknown as GraphEnv & { TRADE_ADMIN_TOKEN?: string }
  if (!authorised(request, e.TRADE_ADMIN_TOKEN)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const report: Record<string, unknown> = {
    configured: graphConfigured(e),
    secrets: {
      MS_TENANT_ID: Boolean(e.MS_TENANT_ID),
      MS_CLIENT_ID: Boolean(e.MS_CLIENT_ID),
      MS_CLIENT_SECRET: Boolean(e.MS_CLIENT_SECRET),
      SHAREPOINT_SITE_ID: Boolean(e.SHAREPOINT_SITE_ID),
    },
    list_setting: e.SHAREPOINT_LIST ?? 'CustomerRegister (default)',
  }

  if (!graphConfigured(e)) return NextResponse.json(report)

  const kv = env.SITE_OPS as KVNamespace
  try {
    // Always a fresh token here. A stale one is the single most confusing
    // failure this integration has, and a diagnostic that reproduces the
    // confusion it exists to resolve is worse than useless.
    const token = await getGraphToken(e, kv, true)
    report.token = 'acquired (fresh)'

    const site = await graphFetch(token, `${GRAPH}/sites/${e.SHAREPOINT_SITE_ID}?$select=displayName,webUrl`)
    report.site = site.ok ? await site.json() : { status: site.status, body: (await site.text()).slice(0, 400) }

    const lists = await graphFetch(token, `${GRAPH}/sites/${e.SHAREPOINT_SITE_ID}/lists?$select=id,name,displayName`)
    if (lists.ok) {
      const json = (await lists.json()) as { value?: Array<{ id: string; name: string; displayName: string }> }
      report.lists = (json.value ?? []).map((l) => ({ name: l.name, displayName: l.displayName }))

      const wanted = (e.SHAREPOINT_LIST || 'CustomerRegister').toLowerCase().replace(/\s+/g, '')
      const hit = (json.value ?? []).find(
        (l) =>
          l.name?.toLowerCase().replace(/\s+/g, '') === wanted ||
          l.displayName?.toLowerCase().replace(/\s+/g, '') === wanted,
      )
      if (hit) {
        const cols = await graphFetch(token, `${GRAPH}/sites/${e.SHAREPOINT_SITE_ID}/lists/${hit.id}/columns?$select=name,displayName`)
        report.target_list = hit.displayName
        report.columns = cols.ok
          ? ((await cols.json()) as { value?: Array<{ name: string }> }).value?.map((c) => c.name)
          : { status: cols.status }
      } else {
        report.target_list = `NOT FOUND (looking for "${e.SHAREPOINT_LIST || 'CustomerRegister'}")`
      }
    } else {
      report.lists = { status: lists.status, body: (await lists.text()).slice(0, 400) }
    }
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(report)
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext()
  const e = env as unknown as GraphEnv & { TRADE_ADMIN_TOKEN?: string; DB: D1Database }
  if (!authorised(request, e.TRADE_ADMIN_TOKEN)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { application_id?: string; action?: string }
  try {
    body = (await request.json()) as { application_id?: string; action?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action === 'add-key-column') {
    try {
      const result = await ensureKeyColumn(e, env.SITE_OPS as KVNamespace)
      return NextResponse.json({ ok: true, ...result })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      )
    }
  }

  const applicationId = body.application_id?.trim()
  if (!applicationId) {
    return NextResponse.json(
      { error: 'application_id, or action: "add-key-column", is required' },
      { status: 400 },
    )
  }

  // throwOnError so the caller sees the Graph message rather than the silent
  // swallow the production path uses.
  const result = await pushApplicationToSharePoint(
    e.DB,
    e,
    env.SITE_OPS as KVNamespace,
    applicationId,
    { throwOnError: true },
  ).then(
    (r) => ({ ok: true as const, ...r }),
    (err: unknown) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) }),
  )

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
