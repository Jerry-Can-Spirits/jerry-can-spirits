// src/app/api/expedition-log/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const VALID_BOTTLE_TYPES = ['standard', 'premium', 'founder'] as const
type BottleType = typeof VALID_BOTTLE_TYPES[number]

const BOTTLE_MAX: Record<BottleType, number> = {
  founder: 40,
  premium: 100,
  standard: 700,
}

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

// Simple in-memory rate limit — best-effort secondary deterrent (Turnstile is primary)
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 3

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
    if (batch_id.trim().length > 50) return NextResponse.json({ error: 'Batch ID is invalid.' }, { status: 400 })
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
      if (bottle.number > BOTTLE_MAX[bottle.type]) {
        const label = bottle.type === 'standard' ? 'Batch 001' : bottle.type === 'premium' ? 'Premium' : 'Founder'
        return NextResponse.json(
          { error: `${label} bottles are numbered 1 to ${BOTTLE_MAX[bottle.type]}.` },
          { status: 400 }
        )
      }
    }

    // Check for duplicates within this submission
    const seen = new Set<string>()
    for (const bottle of bottles) {
      const key = `${bottle.type}:${bottle.number}`
      if (seen.has(key)) {
        return NextResponse.json({ error: 'Duplicate bottle in submission.' }, { status: 400 })
      }
      seen.add(key)
    }

    // Rate limiting (best-effort)
    const fwd = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
    const ip = fwd.split(',')[0].trim()
    const now = Date.now()
    const timestamps = submissionTimestamps.get(ip) || []
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
    if (recent.length >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    recent.push(now)
    submissionTimestamps.set(ip, recent)

    // Access Cloudflare env (DB + secrets in one call)
    const { env } = await getCloudflareContext()
    const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY
    const MAPBOX_SECRET_TOKEN = env.MAPBOX_SECRET_TOKEN

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

    // Check for existing registrations in the DB
    const db = env.DB
    for (const bottle of bottles) {
      const existing = await db
        .prepare(
          `SELECT id FROM expedition_log
           WHERE batch_id = ? AND bottle_type = ? AND bottle_number = ? AND removed_at IS NULL
           LIMIT 1`
        )
        .bind(batch_id.trim(), bottle.type, bottle.number)
        .first<{ id: string }>()

      if (existing) {
        const label = bottle.type === 'standard' ? 'Batch 001' : bottle.type === 'premium' ? 'Premium' : 'Founder'
        return NextResponse.json(
          { error: `${label} bottle #${bottle.number} is already on the log.` },
          { status: 409 }
        )
      }
    }

    // Geocode location once — shared across all bottle rows
    let location_lat: number | null = null
    let location_lng: number | null = null
    if (location && MAPBOX_SECRET_TOKEN) {
      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=gb&limit=1&access_token=${MAPBOX_SECRET_TOKEN}`
        )
        const geoData = await geoRes.json() as { features?: Array<{ geometry: { coordinates: [number, number] } }> }
        if (geoData.features?.[0]) {
          location_lng = geoData.features[0].geometry.coordinates[0]
          location_lat = geoData.features[0].geometry.coordinates[1]
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
