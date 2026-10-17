// Where every bottle went, aggregated: one point per UK postcode district, or
// per town or country abroad, with a position, a bottle count and its label.
// No order ids, no dates, no names. The edge cache in
// cloudflare-worker-entry.mjs holds it for an hour; the header below is for
// browsers and anything in between.
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getBottleMap } from '@/lib/bottle-map-d1'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { env } = await getCloudflareContext()
  try {
    const summary = await getBottleMap(env.DB)
    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('[bottle-map] aggregate query failed:', err)
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
}
