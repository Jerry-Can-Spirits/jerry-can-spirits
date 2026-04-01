import { NextResponse } from 'next/server'

const CF_BASE = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

// Explicit allowlist — only these image IDs can be proxied
const ALLOWED_IMAGE_IDS = new Set([
  // Bottle shots
  'beed84d3-c77d-4ecf-c85f-29719bdea000',
  'fffd5ce1-6411-4ab4-6c32-aacf2caa1700',
  '8ad4c4c5-6c38-4342-c42a-652af5529f00',
  // Logos
  'images-logo-webp',
  'images-logo-etch-webp',
  'images-british-veteran-owned-logo-standard-png',
  'images-british-veteran-owned-logo-white-png',
  'images-british-veteran-owned-logo-black-png',
  'images-afc_banner__png_-png',
  '4e7099a3-a0cb-48a5-d489-edd3d4bca100',
])

const ALLOWED_FORMATS = new Set(['png', 'jpeg', 'webp'])

const FORMAT_MIME: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const format = searchParams.get('format')
  const filename = searchParams.get('filename') ?? `expedition-spiced-rum.${format}`

  if (!id || !ALLOWED_IMAGE_IDS.has(id)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  if (!format || !ALLOWED_FORMATS.has(format)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  }

  // URL constructed entirely from server-side constants — no user input in the fetch call
  const imageUrl = `${CF_BASE}/${id}/f=${format}`

  const upstream = await fetch(imageUrl)
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }

  const body = await upstream.arrayBuffer()

  return new Response(body, {
    headers: {
      'Content-Type': FORMAT_MIME[format],
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
