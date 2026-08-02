// Cloudflare Workers entry point — wraps OpenNext worker with edge caching
// and adds a scheduled handler for the weekly trade review digest cron.
// .open-next/worker.js is generated at build time by opennextjs-cloudflare
export * from './.open-next/worker.js';
import openNextWorker from './.open-next/worker.js';
import { runTradeReviewDigest } from './src/lib/scheduled-trade-review.ts';
import { runRatingsFetch } from './src/lib/scheduled-ratings.ts';
import { runCredentialSweep } from './src/lib/scheduled-credentials.ts';
import { runContactRetentionPurge } from './src/lib/scheduled-contact-retention.ts';
import {
  AGE_COOKIE,
  isAgeExcludedPath,
  isAgeVerified,
  isBot,
  isDocumentNavigation,
} from './src/lib/age-gate.ts';

// Read a cookie off a plain Request (the Worker has no NextRequest.cookies API).
function readCookie(request, name) {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
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
      // Enforce the age gate BEFORE the cache lookup. The edge cache is keyed by
      // URL only, so without this a warm-cached page would be served to an
      // unverified visitor — bypassing the src/middleware.ts redirect entirely.
      // Uses the SAME shared helpers as the middleware, so the two gates cannot
      // diverge. All six edge-cached paths are gated (none is age-excluded), so
      // after this only bots and age-verified visitors reach the cache below.
      if (
        isDocumentNavigation(request.headers) &&
        !isBot(request.headers.get('user-agent')) &&
        !isAgeExcludedPath(url.pathname) &&
        !isAgeVerified(readCookie(request, AGE_COOKIE))
      ) {
        const gate = new URL('/age-check/', request.url);
        gate.searchParams.set('return', url.pathname + url.search);
        return Response.redirect(gate.toString(), 307);
      }

      const cache = caches.default;
      const cachedResponse = await cache.match(request);

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
          cache.put(request, new Response(cloned.body, { status: cloned.status, headers }))
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
