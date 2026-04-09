// src/app/api/expedition-log/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getBottleByLabel, isBottleLogged } from '@/lib/d1'
import { isRateLimited } from '@/lib/kv'
import type { LabelType } from '@/lib/d1'

const VALID_BOTTLE_TYPES = ['standard', 'premium', 'founder'] as const
type BottleType = typeof VALID_BOTTLE_TYPES[number]

const BATCH_ID_RE = /^[A-Za-z0-9][A-Za-z0-9\-]{0,49}$/
const EXPEDITION_RATE_LIMIT = 3

interface BottleEntry {
  type: BottleType
  number: number
}

interface RequestBody {
  name: string
  batch_id: string
  location?: string
  bottles: BottleEntry[]
  turnstileToken: string
  website?: string
}

export async function POST(request: Request) {
  try {
    let body: RequestBody
    try {
      body = (await request.json()) as RequestBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name: rawName, batch_id, location: rawLocation, bottles, turnstileToken, website } = body

    // Honeypot
    if (website && website.trim() !== '') {
      return NextResponse.json({ success: true })
    }

    // Validate inputs
    const name = rawName?.trim() ?? ''
    const location = rawLocation?.trim() ?? ''

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!batch_id?.trim()) return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 })
    if (!BATCH_ID_RE.test(batch_id.trim())) return NextResponse.json({ error: 'Batch ID is invalid.' }, { status: 400 })
    if (!turnstileToken?.trim()) return NextResponse.json({ error: 'Bot check token is required.' }, { status: 400 })
    if (name.length > 100) return NextResponse.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 })
    if (location.length > 100) return NextResponse.json({ error: 'Location must be 100 characters or fewer.' }, { status: 400 })

    if (!Array.isArray(bottles) || bottles.length === 0) {
      return NextResponse.json({ error: 'At least one bottle is required.' }, { status: 400 })
    }
    if (bottles.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 bottles per submission.' }, { status: 400 })
    }
    for (const bottle of bottles) {
      if (!VALID_BOTTLE_TYPES.includes(bottle.type)) {
        return NextResponse.json({ error: 'Invalid bottle type.' }, { status: 400 })
      }
      if (!Number.isInteger(bottle.number) || bottle.number < 1) {
        return NextResponse.json({ error: 'Bottle number must be a positive whole number.' }, { status: 400 })
      }
    }

    // Access Cloudflare env — needed for KV rate limiting and secrets
    const { env } = await getCloudflareContext()
    const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY
    const MAPBOX_SECRET_TOKEN = env.MAPBOX_SECRET_TOKEN

    // KV-backed rate limiting (works across all Cloudflare isolates)
    const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
    const kv = env.SITE_OPS as KVNamespace
    if (await isRateLimited(kv, 'expedition-log', ip, EXPEDITION_RATE_LIMIT, 60)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    if (!TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    // Verify Turnstile token
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: turnstileToken }),
    })
    const turnstileData = await turnstileRes.json() as { success: boolean }
    if (!turnstileData.success) {
      return NextResponse.json({ error: 'Bot check failed.' }, { status: 400 })
    }

    // Validate each bottle exists and hasn't already been logged
    const db = env.DB
    for (const bottle of bottles) {
      const bottleRecord = await getBottleByLabel(db, batch_id.trim(), bottle.type as LabelType, bottle.number)
      if (!bottleRecord) {
        return NextResponse.json(
          { error: `Bottle ${bottle.type} #${bottle.number} is not valid for this batch.` },
          { status: 400 },
        )
      }
      const alreadyLogged = await isBottleLogged(db, batch_id.trim(), bottle.type, bottle.number)
      if (alreadyLogged) {
        return NextResponse.json(
          { error: `Bottle ${bottle.type} #${bottle.number} has already been registered.` },
          { status: 409 },
        )
      }
    }

    // Geocode location once — shared across all bottle rows
    let location_lat: number | null = null
    let location_lng: number | null = null
    if (location && MAPBOX_SECRET_TOKEN) {
      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=gb&limit=1`,
          { headers: { Authorization: `Bearer ${MAPBOX_SECRET_TOKEN}` } }
        )
        const geoData = await geoRes.json() as { features?: Array<{ geometry: { coordinates: unknown[] } }> }
        const coords = geoData.features?.[0]?.geometry?.coordinates
        if (Array.isArray(coords) && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          location_lng = coords[0]
          location_lat = coords[1]
        }
      } catch (err) {
        console.error('Mapbox geocoding failed (non-blocking):', err)
      }
    }

    // Insert one row per bottle
    const stmt = db.prepare(
      `INSERT INTO expedition_log (id, batch_id, name, location, location_lat, location_lng, bottle_type, bottle_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )

    await db.batch(
      bottles.map((bottle) =>
        stmt.bind(
          crypto.randomUUID(),
          batch_id.trim(),
          name,
          location || null,
          location_lat,
          location_lng,
          bottle.type,
          bottle.number,
        )
      )
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Expedition log submission error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
