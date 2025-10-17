// Service Worker for School Planner
const CACHE_NAME = 'school-planner-v3';
const OFFLINE_FALLBACK_PAGE = '/index.html';

// Pre-cache the application shell (keep this minimal; Vite assets are cached at runtime)
const urlsToCache = [
  '/',
  '/index.html',
  '/school.svg',
  '/terms.md',
  '/privacy.md',
  '/license.md',
];

// Install: cache shell and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
      } catch (_) {}
      await self.skipWaiting();
    })()
  );
});

// Activate: cleanup old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      } catch (_) {}
      await self.clients.claim();
    })()
  );
});

// Fetch: network-first for same-origin GET requests with cache fallback; cache-first for fonts; offline fallback for navigations
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Navigation requests: always serve index.html for React Router to handle
  // This ensures /settings, /calendar, etc. all work properly
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Always fetch index.html for navigation requests
          const fresh = await fetch('/');
          // Cache the HTML for offline navigations
          const cache = await caches.open(CACHE_NAME);
          cache.put(OFFLINE_FALLBACK_PAGE, fresh.clone());
          return fresh;
        } catch (_) {
          // Offline: serve cached index.html
          const cached = await caches.match(OFFLINE_FALLBACK_PAGE);
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Cache-First for fonts
  const isFontRequest = req.destination === 'font' || /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname);
  if (isFontRequest) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp && resp.status === 200) {
            cache.put(req, resp.clone());
          }
          return resp;
        } catch (_) {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin GET: Network-first, cache fallback, and cache the successful response
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (_) {
          const cached = await caches.match(req);
          if (cached) return cached;
          // As a last resort, return offline page for HTML requests
          if (req.headers.get('accept')?.includes('text/html')) {
            const offline = await caches.match(OFFLINE_FALLBACK_PAGE);
            if (offline) return offline;
          }
          return Response.error();
        }
      })()
    );
    return;
  }

  // Cross-origin: just try the network
  event.respondWith(fetch(req));
});

// Messages from the client (e.g., force update)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(updateCache());
  }
});

// Background sync for cache updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(updateCache());
  }
});

// Function to update cache with latest versions
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const url of urlsToCache) {
      try {
        const response = await fetch(url);
        if (response.status === 200) {
          await cache.put(url, response.clone());
        }
      } catch (_) {}
    }
  } catch (_) {}
}