import { NextResponse } from 'next/server'
import { isAllowedOrigin } from '@/lib/kv'

export const runtime = 'edge'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })
  response.headers.append(
    'Set-Cookie',
    'jcs_em=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  )
  return response
}
