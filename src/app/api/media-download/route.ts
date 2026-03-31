import { NextResponse } from 'next/server'

const ALLOWED_HOST = 'imagedelivery.net'
const ALLOWED_ACCOUNT = 'T4IfqPfa6E-8YtW8Lo02gQ'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  const filename = searchParams.get('filename') ?? 'expedition-spiced-rum'

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Only proxy images from our Cloudflare Images account
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (parsed.hostname !== ALLOWED_HOST || !parsed.pathname.startsWith(`/${ALLOWED_ACCOUNT}/`)) {
    return NextResponse.json({ error: 'URL not permitted' }, { status: 403 })
  }

  const upstream = await fetch(imageUrl)
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const body = await upstream.arrayBuffer()

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
