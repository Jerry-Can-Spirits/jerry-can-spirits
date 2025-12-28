const CACHE_NAME = 'jerry-can-spirits-v5';
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

// Helper to determine caching strategy
function shouldCacheOffline(url) {
  const pathname = new URL(url).pathname;
  return (
    pathname.startsWith('/field-manual/cocktails/') ||
    pathname.startsWith('/field-manual/equipment/') ||
    pathname.startsWith('/field-manual/ingredients/') ||
    pathname.startsWith('/_next/image') ||
    pathname.match(/\.(jpg|jpeg|png|webp|svg|woff2)$/i)
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

  // Strategy 1: Network-first for HTML navigation (but cache for offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
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
                  <h1>📡 Off the Grid</h1>
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

  // Strategy 2: Cache-first for images and static assets
  if (shouldCacheOffline(request.url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy 3: Network-only for everything else (API calls, etc.)
});
