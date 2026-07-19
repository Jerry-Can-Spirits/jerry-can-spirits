// Bumped v9 → v10: the activate handler deletes every cache except CACHE_NAME,
// so this bump evicts the v9 cache that Strategy 2 had poisoned (corrupted fonts
// + stale RSC documents) from every visitor who already has it — it is the fix
// for everyone already affected, not just a version detail.
const CACHE_NAME = 'jerry-can-spirits-v10';
const OFFLINE_URL = '/offline';

// URLs to cache for offline access (Field Manual)
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/field-manual',
  '/field-manual/cocktails',
  '/field-manual/equipment',
  '/field-manual/ingredients',
];

// Install event - precache essential pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS.map(url => new Request(url, {cache: 'reload'})));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Cache-first is for genuinely static, same-origin images only. Deliberately
// NOT:
//  - HTML/RSC documents (the field-manual slug prefixes were here): their
//    payloads reference deploy-specific /_next/static chunk URLs that 404 after
//    a deploy — the exact staleness Strategy 1 was written to avoid. Caching
//    them cache-first fought Strategy 1 and, on a failed fetch, produced the
//    uncaught "network error response" FetchEvent. They now fall through to
//    Strategy 3 (network-only); Next re-fetches RSC on demand.
//  - Fonts (.woff2): self-hosted next/font WOFF2 are immutable and served from
//    the browser's own HTTP cache. Caching them here re-served them corrupted
//    (a decoded body kept beside a Content-Encoding header, or a 206 partial),
//    causing the site-wide OTS font-parse failures and fallback CLS.
function shouldCacheOffline(url) {
  const pathname = new URL(url).pathname;
  return (
    pathname.startsWith('/_next/image') ||
    pathname.match(/\.(jpg|jpeg|png|webp|svg)$/i)
  );
}

// Fetch event - intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Strategy 1: Network-only for HTML navigation, with offline fallback.
  // We deliberately do NOT cache successful navigation responses on the fly
  // because each HTML payload references specific /_next/static/... chunk
  // URLs that 404 after a deploy. Offline support is satisfied by the
  // PRECACHE_URLS set above plus the inline fallback below.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          // Offline: try cache first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Try to match without query params (for dynamic routes)
          const urlWithoutParams = new URL(request.url);
          urlWithoutParams.search = '';
          const cachedWithoutParams = await caches.match(urlWithoutParams.toString());
          if (cachedWithoutParams) {
            return cachedWithoutParams;
          }

          // Try offline page
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          // Inline fallback HTML with better mobile support
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
                <title>Offline | Jerry Can Spirits</title>
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  body {
                    font-family: system-ui, -apple-system, sans-serif;
                    background: #1a442e;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                    padding: 20px;
                  }
                  h1 { color: #f59e0b; margin-bottom: 1rem; font-size: clamp(1.5rem, 5vw, 2.5rem); }
                  p { max-width: 400px; margin: 0 auto 1.5rem; line-height: 1.6; }
                  button {
                    background: #f59e0b;
                    color: #1a442e;
                    border: none;
                    padding: 12px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 0.5rem;
                    min-width: 140px;
                  }
                  button:active { transform: scale(0.95); }
                </style>
              </head>
              <body>
                <div>
                  <h1>Off the Grid</h1>
                  <p>You're currently offline. Some cached content may be available.</p>
                  <div>
                    <button onclick="window.location.href='/field-manual'">Field Manual</button>
                    <button onclick="window.location.reload()">Retry</button>
                  </div>
                </div>
              </body>
            </html>`,
            {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              }
            }
          );
        })
    );
    return;
  }

  // Strategy 2: Cache-first for same-origin images (see shouldCacheOffline).
  if (shouldCacheOffline(request.url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Only cache a complete 200 — a 206 partial would store a truncated
            // body and re-serve it corrupted.
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(async () => {
            // Network failed on a cache miss — never let the promise reject out
            // of the handler (that produces an uncaught rejection and a
            // network-error FetchEvent). Fall back to any cached copy, else a
            // controlled error response.
            const cached = await caches.match(request);
            return cached || Response.error();
          });
      })
    );
    return;
  }

  // Strategy 3: Network-only for everything else (API calls, etc.)
});
