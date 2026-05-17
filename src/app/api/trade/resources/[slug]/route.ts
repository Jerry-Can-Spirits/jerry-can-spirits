// GET /api/trade/resources/[slug]
// Auth-gated PDF download from the TRADE_DOCS R2 bucket. Slug must match an
// entry in TRADE_RESOURCES so callers can't enumerate arbitrary R2 keys.

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeSessionCookieValue, readTradeSession } from '@/lib/trade-portal/session'
import { findResourceBySlug } from '@/lib/trade-portal/resources'

export const runtime = 'nodejs'

interface Params {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const sid = await getTradeSessionCookieValue()
  if (!sid) return new Response('Unauthorized', { status: 401 })

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const session = await readTradeSession(kv, sid)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { slug } = await params
  const resource = findResourceBySlug(slug)
  if (!resource || resource.kind !== 'pdf') return new Response('Not found', { status: 404 })

  const r2 = env.TRADE_DOCS as R2Bucket
  const object = await r2.get(resource.r2_key)
  if (!object) return new Response('File not available', { status: 404 })

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resource.filename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
