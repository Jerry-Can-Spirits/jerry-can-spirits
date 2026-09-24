// Cloudflare Workers entry point — wraps OpenNext worker with edge caching
// and adds a scheduled handler for the weekly trade review digest cron.
// .open-next/worker.js is generated at build time by opennextjs-cloudflare
export * from './.open-next/worker.js';
import openNextWorker from './.open-next/worker.js';
import { runTradeReviewDigest } from './src/lib/scheduled-trade-review.ts';
import { runRatingsFetch } from './src/lib/scheduled-ratings.ts';
import { runCredentialSweep } from './src/lib/scheduled-credentials.ts';
import { runContactRetentionPurge } from './src/lib/scheduled-contact-retention.ts';
import { edgeCacheKeyUrl } from './src/lib/edge-cache.ts';

// The Cache API needs a Request; src/lib/edge-cache.ts decides what to key on
// and why.
function edgeCacheKey(request, url, env) {
  return new Request(edgeCacheKeyUrl(url, env), {
    method: 'GET',
    headers: request.headers,
  });
}

// Edge-cached paths, with the TTL each one can tolerate.
//
// The homepage is the only entry here that renders live Shopify prices, and it
// held a stale one after the 3 August RRP change: this cache sets its own
// Cache-Control, so it overrode the `max-age=0, must-revalidate` that
// next.config.ts sets for HTML, and the page kept advertising the old price
// while checkout charged the new one. Its TTL now matches the page's own
// `export const revalidate = 60`, so the edge can never serve a price staler
// than the origin would.
//
// The Field Manual hubs render Sanity content and no prices, so an hour is
// fine and the on-demand revalidation webhook covers publishes.
const EDGE_CACHE_TTL = new Map([
  ['/', 60],
  ['/offline', 3600],
  ['/field-manual', 3600],
  ['/field-manual/cocktails', 3600],
  ['/field-manual/equipment', 3600],
  ['/field-manual/ingredients', 3600],
]);

// stale-while-revalidate lets a response outlive its TTL while a fresh one is
// fetched. That is right for content and wrong for a price, so it scales with
// the TTL rather than being a flat day for everything.
function swrFor(ttl) {
  return ttl <= 60 ? 0 : 86400;
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && EDGE_CACHE_TTL.has(url.pathname)) {
      // The age gate is an overlay inside the page (decided client-side before
      // first paint, see src/lib/age-gate.ts), so the cached HTML is the same
      // for everyone and needs no gate ahead of the lookup.
      const cache = caches.default;
      const key = edgeCacheKey(request, url, env);
      const cachedResponse = await cache.match(key);

      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Edge-Cache', 'HIT');
        return new Response(cachedResponse.body, { status: cachedResponse.status, headers });
      }

      const response = await openNextWorker.fetch(request, env, ctx);

      if (response.status === 200) {
        const ttl = EDGE_CACHE_TTL.get(url.pathname);
        const swr = swrFor(ttl);
        const cloned = response.clone();
        const headers = new Headers(cloned.headers);
        headers.set(
          'Cache-Control',
          `public, max-age=${ttl}, s-maxage=${ttl}` + (swr ? `, stale-while-revalidate=${swr}` : '')
        );
        // Cloudflare's Cache API rejects cache.put() on a response carrying
        // Set-Cookie (middleware sets detectedCountry/isBot), which is why this
        // edge cache barely populated. Strip it from the CACHED copy only — the
        // original response returned below keeps its cookies, so the first
        // (uncached) visitor still gets them.
        headers.delete('set-cookie');
        ctx.waitUntil(
          cache.put(key, new Response(cloned.body, { status: cloned.status, headers }))
        );
      }

      return response;
    }

    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    if (event.cron === '0 * * * *') {
      ctx.waitUntil(runRatingsFetch(env));
      ctx.waitUntil(runCredentialSweep(env));
      return;
    }
    ctx.waitUntil(runTradeReviewDigest(env));
    ctx.waitUntil(runContactRetentionPurge(env));
  },
};

export default worker;
