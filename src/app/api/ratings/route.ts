// app/api/ratings/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

interface RatingData {
  count: number
  sum: number
  average: number
  lastUpdated: string
}

interface RatingBody {
  slug: string
  rating: number
}

// Generate a simple fingerprint from request headers for duplicate prevention
function getFingerprint(request: Request): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Create a simple hash from IP and user-agent
  const data = `${ip}:${userAgent}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// GET - Retrieve rating for a cocktail or all cocktails
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext()
    const kv = env.COCKTAIL_RATINGS as KVNamespace | undefined

    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')
    const all = url.searchParams.get('all')

    // Bulk fetch all ratings
    if (all === 'true') {
      if (!kv) {
        return NextResponse.json({ ratings: {} })
      }

      // List all cocktail rating keys
      const list = await kv.list({ prefix: 'cocktail:' })
      const ratings: Record<string, { count: number; average: number }> = {}

      // Fetch all rating data in parallel
      const fetchPromises = list.keys.map(async (key) => {
        const data = await kv.get<RatingData>(key.name, 'json')
        if (data) {
          const cocktailSlug = key.name.replace('cocktail:', '')
          ratings[cocktailSlug] = {
            count: data.count,
            average: data.average
          }
        }
      })

      await Promise.all(fetchPromises)

      return NextResponse.json({ ratings })
    }

    // Single cocktail rating fetch
    if (!slug) {
      return NextResponse.json({ error: 'Cocktail slug is required' }, { status: 400 })
    }

    if (!kv) {
      // KV not configured - return default values
      return NextResponse.json({
        count: 0,
        average: 0,
        hasVoted: false
      })
    }

    const fingerprint = getFingerprint(request)
    const ratingKey = `cocktail:${slug}`
    const voteKey = `vote:${slug}:${fingerprint}`

    // Get aggregated rating data
    const ratingData = await kv.get<RatingData>(ratingKey, 'json')

    // Check if this user has already voted
    const hasVoted = await kv.get(voteKey) !== null

    return NextResponse.json({
      count: ratingData?.count || 0,
      average: ratingData?.average || 0,
      hasVoted
    })
  } catch (error) {
    console.error('Rating fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 })
  }
}

// POST - Submit a rating
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext()
    const kv = env.COCKTAIL_RATINGS as KVNamespace | undefined

    if (!kv) {
      return NextResponse.json({ error: 'Rating service not configured' }, { status: 503 })
    }

    let body: RatingBody
    try {
      body = await request.json() as RatingBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { slug, rating } = body

    if (!slug) {
      return NextResponse.json({ error: 'Cocktail slug is required' }, { status: 400 })
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    const fingerprint = getFingerprint(request)
    const ratingKey = `cocktail:${slug}`
    const voteKey = `vote:${slug}:${fingerprint}`

    // Check if user has already voted
    const existingVote = await kv.get(voteKey)
    if (existingVote !== null) {
      return NextResponse.json({ error: 'You have already rated this cocktail' }, { status: 409 })
    }

    // Get current rating data
    const currentData = await kv.get<RatingData>(ratingKey, 'json') || {
      count: 0,
      sum: 0,
      average: 0,
      lastUpdated: ''
    }

    // Update rating data
    const newCount = currentData.count + 1
    const newSum = currentData.sum + rating
    const newAverage = Math.round((newSum / newCount) * 10) / 10 // Round to 1 decimal

    const newData: RatingData = {
      count: newCount,
      sum: newSum,
      average: newAverage,
      lastUpdated: new Date().toISOString()
    }

    // Store updated rating data and mark user as voted
    // Vote key expires after 365 days
    await Promise.all([
      kv.put(ratingKey, JSON.stringify(newData)),
      kv.put(voteKey, rating.toString(), { expirationTtl: 365 * 24 * 60 * 60 })
    ])

    return NextResponse.json({
      success: true,
      count: newCount,
      average: newAverage
    })
  } catch (error) {
    console.error('Rating submission error:', error)
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
  }
}
