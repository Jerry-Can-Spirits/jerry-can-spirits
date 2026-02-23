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
      const data = await kv.get<OrderEntry>(key.name, 'json')
      if (!data) continue

      const allOurs = data.titles.every((t) =>
        t.toLowerCase().includes('jerry can') ||
        t.toLowerCase().includes('expedition')
      )
      if (!allOurs) continue

      // Use bottleCount if available (new format), otherwise count titles (old format)
      totalBottles += data.bottleCount ?? data.titles.length
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
