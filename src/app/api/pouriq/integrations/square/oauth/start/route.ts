import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { createOAuthState } from '@/lib/pouriq/pos/connections'

export const runtime = 'nodejs'

// Square's OAuth authorize endpoint is unified: production and sandbox
// both use connect.squareup.com/oauth2/authorize. Square distinguishes
// environments by the client_id prefix ('sandbox-sq0idb-' vs 'sq0idp-'),
// not by host. The sandbox-specific host (connect.squareupsandbox.com)
// only serves the API endpoints — token exchange, orders, locations —
// not the consent UI. Hitting connect.squareupsandbox.com/oauth2/authorize
// 302s to a 400 page with broken assets.
const SQUARE_AUTHORIZE_URL = 'https://connect.squareup.com/oauth2/authorize'

export async function GET(request: Request) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.redirect(new URL('/trade/login', request.url))
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const state = await createOAuthState(db, access.tradeAccountId, 'square')

  const redirectUri = new URL('/api/pouriq/integrations/square/oauth/callback', request.url).toString()
  const params = new URLSearchParams({
    client_id: env.SQUARE_APP_ID,
    scope: 'ORDERS_READ ITEMS_READ MERCHANT_PROFILE_READ',
    session: 'false',
    state,
    redirect_uri: redirectUri,
  })
  return NextResponse.redirect(`${SQUARE_AUTHORIZE_URL}?${params.toString()}`)
}
