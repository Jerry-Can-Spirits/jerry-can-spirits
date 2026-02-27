// Cloudflare Workers entry point — wraps OpenNext worker with edge caching
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && EDGE_CACHE_PATHS.has(url.pathname)) {
      const cache = caches.default;
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Edge-Cache', 'HIT');
        return new Response(cachedResponse.body, { status: cachedResponse.status, headers });
      }

      const response = await openNextWorker.fetch(request, env, ctx);

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

    return openNextWorker.fetch(request, env, ctx);
  },
};
