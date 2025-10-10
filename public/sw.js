const CACHE_NAME = 'jerry-can-spirits-v3';
const OFFLINE_URL = '/offline';

// Install event - activate immediately
self.addEventListener('install', (event) => {
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

// Fetch event - only intercept navigation requests for offline fallback
self.addEventListener('fetch', (event) => {
  // Only handle HTML page navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Show offline page when network fails
        const offlineResponse = await caches.match(OFFLINE_URL);
        if (offlineResponse) {
          return offlineResponse;
        }

        // Inline fallback HTML if offline page isn't cached
        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Offline | Jerry Can Spirits</title>
              <style>
                body {
                  margin: 0;
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
                h1 { color: #f59e0b; margin-bottom: 1rem; }
                button {
                  background: #f59e0b;
                  color: #1a442e;
                  border: none;
                  padding: 12px 24px;
                  font-size: 16px;
                  font-weight: 600;
                  border-radius: 8px;
                  cursor: pointer;
                  margin-top: 1rem;
                }
              </style>
            </head>
            <body>
              <div>
                <h1>Off the Grid</h1>
                <p>You're currently offline. Check your connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
              </div>
            </body>
          </html>`,
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
      })
    );
  }
  // Let everything else (scripts, styles, images, API calls) pass through normally
});
