// Cloudflare Workers entry point — wraps OpenNext worker with edge caching
// and per-request CSP nonce generation.
// .open-next/worker.js is generated at build time by opennextjs-cloudflare
export * from './.open-next/worker.js';
import openNextWorker from './.open-next/worker.js';

const EDGE_CACHE_PATHS = new Set([
  '/',
  '/offline',
  '/field-manual',
  '/field-manual/cocktails',
  '/field-manual/equipment',
  '/field-manual/ingredients',
]);

const CACHE_TTL = 3600; // 1 hour

/**
 * Generate a per-request CSP nonce.
 * Returns a 22-character base64url string derived from 16 random bytes.
 */
function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Attach the nonce to a request as the x-nonce header so that
 * Next.js server components can read it via headers() in layout.tsx.
 */
function withNonce(request, nonce) {
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  return new Request(request, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only inject nonce for HTML document requests — skip static assets,
    // API routes, and Next.js internal paths.
    const isHtmlRequest =
      request.method === 'GET' &&
      !url.pathname.startsWith('/_next/') &&
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/cdn-cgi/');

    const nonce = isHtmlRequest ? generateNonce() : null;
    const proxiedRequest = nonce ? withNonce(request, nonce) : request;

    if (request.method === 'GET' && EDGE_CACHE_PATHS.has(url.pathname)) {
      const cache = caches.default;
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Edge-Cache', 'HIT');
        return new Response(cachedResponse.body, { status: cachedResponse.status, headers });
      }

      const response = await openNextWorker.fetch(proxiedRequest, env, ctx);

      if (response.status === 200) {
        const cloned = response.clone();
        const headers = new Headers(cloned.headers);
        headers.set('Cache-Control', `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`);
        ctx.waitUntil(
          cache.put(request, new Response(cloned.body, { status: cloned.status, headers }))
        );
      }

      return response;
    }

    return openNextWorker.fetch(proxiedRequest, env, ctx);
  },
};
