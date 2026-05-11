// POST /api/trade-application/upload
// multipart/form-data with a single `file` field. Returns { ticket, filename }.
//
// Env vars used:
//   TRADE_DOCS (R2 binding)
//   SITE_OPS (KV binding for rate limit)

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { detectAllowedMime, extensionForMime } from '@/lib/validators/file-magic-bytes'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024
const UPLOAD_RATE_LIMIT = 30 // per hour per IP

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const r2 = env.TRADE_DOCS as R2Bucket

  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'trade-upload', ip, UPLOAD_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const detectedMime = detectAllowedMime(buffer)
  if (!detectedMime) {
    return NextResponse.json({ error: 'Unsupported file type. PDF, JPG, or PNG only.' }, { status: 400 })
  }

  const ticket = crypto.randomUUID()
  const key = `pending/${ticket}`
  const ext = extensionForMime(detectedMime)
  const originalName = file.name || `upload.${ext}`

  await r2.put(key, buffer, {
    httpMetadata: { contentType: detectedMime },
    customMetadata: {
      originalName,
      detectedMime,
      ts: new Date().toISOString(),
    },
  })

  return NextResponse.json({ ticket, filename: originalName, detectedMime })
}
