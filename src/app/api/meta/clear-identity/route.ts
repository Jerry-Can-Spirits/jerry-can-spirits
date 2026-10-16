import { NextResponse } from 'next/server'
import { isAllowedOrigin } from '@/lib/kv'
import { EXTERNAL_ID_COOKIE, FBC_COOKIE, FBP_COOKIE } from '@/lib/meta-capi'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const headers = new Headers()
  headers.append('Set-Cookie', 'jcs_em=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')
  for (const name of [EXTERNAL_ID_COOKIE, FBP_COOKIE, FBC_COOKIE]) {
    headers.append('Set-Cookie', `${name}=; Secure; SameSite=Lax; Path=/; Max-Age=0`)
  }
  return new NextResponse(null, { status: 204, headers })
}
