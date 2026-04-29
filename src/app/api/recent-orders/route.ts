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

    const list = await kv.list({ prefix: 'order:recent:' })

    if (list.keys.length === 0) {
      return NextResponse.json(null, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      })
    }

    // Fetch all entries and sum bottle counts across genuine orders
    let totalBottles = 0

    for (const key of list.keys) {
      const raw = await kv.get(key.name, 'json')
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
