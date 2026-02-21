import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const geoHeaders: Record<string, string | null> = {
    'x-open-next-country': request.headers.get('x-open-next-country'),
    'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
    'cf-ipcountry': request.headers.get('cf-ipcountry'),
    'x-visitor-country': request.headers.get('x-visitor-country'),
  }

  // List all headers for debugging
  const allHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (key.includes('country') || key.includes('geo') || key.includes('cf-') || key.includes('open-next') || key.includes('vercel-ip')) {
      allHeaders[key] = value
    }
  })

  return NextResponse.json({ geoHeaders, allHeaders })
}
