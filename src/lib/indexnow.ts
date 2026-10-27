// Tell the IndexNow engines (Bing, Yandex and the rest) that a page changed,
// the moment the change arrives.
//
// scripts/submit-indexnow.ts submits the whole site after a deploy, which
// covers code changes. This covers content: the Sanity and Shopify webhooks
// already know exactly which pages they revalidated, and those are the URLs
// worth announcing. Fire-and-forget on the request's waitUntil, never throws,
// never delays the webhook response. The key is public by design: it sits in
// a text file at the site root, and only proves the submission came from a
// domain that hosts it (docs/runbooks/indexnow.md).
import { getCloudflareContext } from '@opennextjs/cloudflare'

const HOST = 'jerrycanspirits.co.uk'
const KEY = 'a7e2b5f9c3d1e6a8b4d2f0e5c9a3b7d1'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export function indexNowUrls(paths: string[]): string[] {
  // Concrete paths only: a dynamic route pattern such as /shop/[collection]
  // is a cache tag, not a URL.
  return [...new Set(paths.filter((p) => p.startsWith('/') && !p.includes('[')).map((p) => `https://${HOST}${p}`))]
}

export function submitToIndexNow(paths: string[]): void {
  const urlList = indexNowUrls(paths)
  if (urlList.length === 0 || process.env.SENTRY_ENVIRONMENT === 'local') return
  const send = fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  })
    .then((res) => {
      if (!res.ok && res.status !== 202) console.warn('[indexnow] HTTP %s for %s url(s)', res.status, urlList.length)
    })
    .catch((err) => console.warn('[indexnow] send failed:', err))
  try {
    getCloudflareContext().ctx?.waitUntil?.(send)
  } catch {
    // No Worker context (tests, local dev): the promise settles on its own.
  }
}
