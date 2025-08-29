// Service Worker for School Planner
const CACHE_NAME = 'school-planner-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/schoolplanner.tsx',
  '/src/App.css',
  '/src/index.css',
  '/school.svg',
  '/terms.md',
  '/privacy.md',
  '/license.md',
  // Add other assets as needed
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline, update cache when online
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Cache-First strategy for font files
  const isFontRequest =
    req.destination === 'font' || /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname);

  if (isFontRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req)
            .then((resp) => {
              if (resp && resp.status === 200) {
                cache.put(req, resp.clone());
                console.log('Cached font:', req.url);
              }
              return resp;
            })
            .catch(() => cached || Response.error());
        })
      )
    );
    return; // Do not fall through to generic handler
  }

  // Generic: Stale-While-Revalidate for other requests backed by cache if present
  event.respondWith(
    caches.match(req).then((response) => {
      if (response) {
        // Update in background
        fetch(req)
          .then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, fetchResponse.clone());
                console.log('Updated cache for:', req.url);
              });
            }
          })
          .catch(() => {
            console.log('Failed to update cache for:', req.url);
          });
        return response;
      }
      return fetch(req);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Check for updates when the service worker starts
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
          await cache.put(url, response);
          console.log('Updated cache for:', url);
        }
      } catch (error) {
        console.log('Failed to update cache for:', url, error);
      }
    }
  } catch (error) {
    console.log('Cache update failed:', error);
  }
} 