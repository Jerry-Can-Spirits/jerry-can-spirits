import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

interface OrderEntry {
  titles: string[]
  bottleCount?: number
  country: string
  timestamp: number
}

export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    const kv = env.SITE_OPS

    // Cap at 100 keys per call. With 24h TTL the working set is small,
    // but as order volume grows kv.list() defaults to 1000 and the
    // sequential fetch loop becomes a measurable latency drag on every
    // homepage social-proof toast.
    const list = await kv.list({ prefix: 'order:recent:', limit: 100 })

    if (list.keys.length === 0) {
      return NextResponse.json(null, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      })
    }

    // Fetch all entries in parallel and sum bottle counts across genuine orders
    const entries = await Promise.all(
      list.keys.map((key) => kv.get(key.name, 'json'))
    )

    let totalBottles = 0
    for (const raw of entries) {
      if (!raw || typeof raw !== 'object') continue
      const data = raw as Record<string, unknown>
      if (!Array.isArray(data.titles) || !data.titles.every((t) => typeof t === 'string')) continue

      const entry: OrderEntry = {
        titles: data.titles as string[],
        bottleCount: typeof data.bottleCount === 'number' ? data.bottleCount : undefined,
        country: typeof data.country === 'string' ? data.country : 'unknown',
        timestamp: typeof data.timestamp === 'number' ? data.timestamp : 0,
      }

      const allOurs = entry.titles.every((t) =>
        t.toLowerCase().includes('jerry can') ||
        t.toLowerCase().includes('expedition')
      )
      if (!allOurs) continue

      totalBottles += entry.bottleCount ?? entry.titles.length
    }

    if (totalBottles === 0) {
      return NextResponse.json(null, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      })
    }

    return NextResponse.json(
      { bottleCount: totalBottles },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    )
  } catch (error) {
    console.error('Failed to fetch recent orders:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
