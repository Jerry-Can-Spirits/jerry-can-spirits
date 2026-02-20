import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

interface SocialStats {
  facebook: number | null
  instagram: number | null
  lastUpdated: string
}

const CACHE_KEY = 'social:meta-stats'
const CACHE_TTL_SECONDS = 3600 // 1 hour

export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    const kv = env.COCKTAIL_RATINGS as KVNamespace | undefined

    // Try KV cache first
    if (kv) {
      const cached = await kv.get<SocialStats>(CACHE_KEY, 'json')
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, max-age=1800, s-maxage=3600',
          },
        })
      }
    }

    // Check if Meta token is configured
    const token = env.META_ACCESS_TOKEN
    const fbPageId = env.META_FB_PAGE_ID
    const igAccountId = env.META_IG_ACCOUNT_ID

    if (!token || !fbPageId || !igAccountId) {
      // Token not configured — return nulls gracefully
      return NextResponse.json(
        { facebook: null, instagram: null, lastUpdated: null },
        {
          headers: {
            'Cache-Control': 'public, max-age=1800, s-maxage=3600',
          },
        }
      )
    }

    // Fetch from Meta Graph API in parallel
    const [fbRes, igRes] = await Promise.allSettled([
      fetch(
        `https://graph.facebook.com/v19.0/${fbPageId}?fields=followers_count&access_token=${token}`
      ),
      fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}?fields=followers_count&access_token=${token}`
      ),
    ])

    const fbData =
      fbRes.status === 'fulfilled' && fbRes.value.ok
        ? await fbRes.value.json()
        : null
    const igData =
      igRes.status === 'fulfilled' && igRes.value.ok
        ? await igRes.value.json()
        : null

    const stats: SocialStats = {
      facebook: (fbData as Record<string, number> | null)?.followers_count ?? null,
      instagram: (igData as Record<string, number> | null)?.followers_count ?? null,
      lastUpdated: new Date().toISOString(),
    }

    // Write to KV cache
    if (kv) {
      await kv.put(CACHE_KEY, JSON.stringify(stats), {
        expirationTtl: CACHE_TTL_SECONDS,
      })
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Social stats fetch error:', error)
    // Graceful fallback — never error
    return NextResponse.json(
      { facebook: null, instagram: null, lastUpdated: null },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
      }
    )
  }
}
