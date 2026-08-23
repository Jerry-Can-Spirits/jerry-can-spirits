// Microsoft Graph access for the Worker, via client credentials.
//
// The app authenticates as itself rather than on behalf of anyone, which is why
// the registration has application permissions and no redirect URI. It holds
// Sites.Selected, granted against one site only, so a leaked secret reaches the
// Business Management site and nothing else in the tenant.
//
// TOKENS ARE CACHED IN KV. They last an hour and minting one costs a round trip
// to login.microsoftonline.com on a request path a venue is waiting on. Cached
// 55 minutes rather than 60: a token that expires between the check and the
// call fails in a way that looks like a permissions problem, and five minutes
// of slack is cheaper than diagnosing that.

const LOGIN = 'https://login.microsoftonline.com'
export const GRAPH = 'https://graph.microsoft.com/v1.0'

const TOKEN_KV_KEY = 'graph:token'
const TOKEN_TTL_SECONDS = 55 * 60

export interface GraphEnv {
  MS_TENANT_ID?: string
  MS_CLIENT_ID?: string
  MS_CLIENT_SECRET?: string
  SHAREPOINT_SITE_ID?: string
}

export function graphConfigured(env: GraphEnv): boolean {
  return Boolean(env.MS_TENANT_ID && env.MS_CLIENT_ID && env.MS_CLIENT_SECRET && env.SHAREPOINT_SITE_ID)
}

export async function getGraphToken(env: GraphEnv, kv: KVNamespace): Promise<string> {
  const cached = await kv.get(TOKEN_KV_KEY)
  if (cached) return cached

  const body = new URLSearchParams({
    client_id: env.MS_CLIENT_ID!,
    client_secret: env.MS_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })

  const res = await fetch(`${LOGIN}/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    // The overwhelmingly likely cause, and the one that will happen roughly two
    // years after setup with no other warning, is an expired client secret.
    // Saying so beats a bare 401.
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Graph token request failed (${res.status}). If this started suddenly, check whether the ` +
        `client secret has expired in Entra. ${detail.slice(0, 200)}`,
    )
  }

  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) throw new Error('Graph token response contained no access_token')

  await kv.put(TOKEN_KV_KEY, json.access_token, { expirationTtl: TOKEN_TTL_SECONDS })
  return json.access_token
}

export async function graphFetch(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(path.startsWith('http') ? path : `${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}
