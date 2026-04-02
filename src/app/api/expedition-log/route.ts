// src/app/api/expedition-log/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

interface RequestBody {
  name: string
  batch_id: string
  location?: string
  message?: string
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

    const { name: rawName, batch_id, location: rawLocation, message: rawMessage, turnstileToken, website } = body

    // Honeypot
    if (website && website.trim() !== '') {
      return NextResponse.json({ success: true })
    }

    // Validate inputs
    const name = rawName?.trim() ?? ''
    const location = rawLocation?.trim() ?? ''
    const message = rawMessage?.trim() ?? ''

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!batch_id?.trim()) return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 })
    if (batch_id.trim().length > 50) return NextResponse.json({ error: 'Batch ID is invalid.' }, { status: 400 })
    if (!turnstileToken?.trim()) return NextResponse.json({ error: 'Bot check token is required.' }, { status: 400 })
    if (name.length > 100) return NextResponse.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 })
    if (location.length > 100) return NextResponse.json({ error: 'Location must be 100 characters or fewer.' }, { status: 400 })
    if (message.length > 500) return NextResponse.json({ error: 'Message must be 500 characters or fewer.' }, { status: 400 })

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

    // Geocode location (non-blocking — failure does not reject the submission)
    let location_lat: number | null = null
    let location_lng: number | null = null
    if (location && MAPBOX_SECRET_TOKEN) {
      try {
        console.log('[expedition-log] geocoding location:', location, 'token present:', !!MAPBOX_SECRET_TOKEN)
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=gb&limit=1&access_token=${MAPBOX_SECRET_TOKEN}`
        )
        console.log('[expedition-log] geocode status:', geoRes.status)
        const geoData = await geoRes.json() as { features?: Array<{ geometry: { coordinates: [number, number] } }>, message?: string }
        console.log('[expedition-log] geocode features:', geoData.features?.length ?? 0, geoData.message ?? '')
        if (geoData.features?.[0]) {
          // Mapbox returns [longitude, latitude]
          location_lng = geoData.features[0].geometry.coordinates[0]
          location_lat = geoData.features[0].geometry.coordinates[1]
          console.log('[expedition-log] geocoded to:', location_lat, location_lng)
        }
      } catch (err) {
        console.error('Mapbox geocoding failed (non-blocking):', err)
      }
    } else {
      console.log('[expedition-log] skipping geocode — location:', !!location, 'token:', !!MAPBOX_SECRET_TOKEN)
    }

    // Insert
    const db = env.DB
    const id = crypto.randomUUID()
    await db
      .prepare(
        `INSERT INTO expedition_log (id, batch_id, name, location, location_lat, location_lng, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        batch_id.trim(),
        name,
        location || null,
        location_lat,
        location_lng,
        message || null,
      )
      .run()

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Expedition log submission error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
