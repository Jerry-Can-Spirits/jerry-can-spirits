import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

const countryNames: Record<string, string> = {
  GB: 'the United Kingdom',
  US: 'the United States',
  IE: 'Ireland',
  DE: 'Germany',
  FR: 'France',
  AU: 'Australia',
  CA: 'Canada',
  NL: 'the Netherlands',
  ES: 'Spain',
  IT: 'Italy',
  NZ: 'New Zealand',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  BE: 'Belgium',
  AT: 'Austria',
  CH: 'Switzerland',
  PT: 'Portugal',
  PL: 'Poland',
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
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

    // Keys are order:recent:{timestamp} — sort descending to get most recent
    const sorted = list.keys.sort((a, b) => {
      const tsA = parseInt(a.name.split(':')[2])
      const tsB = parseInt(b.name.split(':')[2])
      return tsB - tsA
    })

    // Find the most recent order that contains a Jerry Can Spirits product
    for (const key of sorted) {
      const data = await kv.get<{ titles: string[]; country: string; timestamp: number }>(
        key.name,
        'json'
      )
      if (!data) continue

      const ourTitle = data.titles.find((t) =>
        t.toLowerCase().includes('jerry can') ||
        t.toLowerCase().includes('expedition')
      )
      if (!ourTitle) continue

      const region = countryNames[data.country] || 'somewhere nearby'
      const ago = timeAgo(data.timestamp)

      return NextResponse.json(
        { title: ourTitle, region, timeAgo: ago },
        { headers: { 'Cache-Control': 'public, max-age=60' } }
      )
    }

    return NextResponse.json(null, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  } catch (error) {
    console.error('Failed to fetch recent orders:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
