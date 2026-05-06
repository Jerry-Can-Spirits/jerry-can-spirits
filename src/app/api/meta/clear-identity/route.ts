import { NextResponse } from 'next/server'
import { isAllowedOrigin } from '@/lib/kv'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Set-Cookie': 'jcs_em=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    }
  })
}