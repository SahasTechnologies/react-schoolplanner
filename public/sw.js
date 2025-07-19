// Service Worker for School Planner
const CACHE_NAME = 'school-planner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/schoolplanner.tsx',
  '/src/App.css',
  '/src/index.css',
  '/school.svg',
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a cached version, return it immediately
        if (response) {
          // But also fetch the latest version in the background to update cache
          fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                console.log('Updated cache for:', event.request.url);
              });
            }
          }).catch(() => {
            // If fetch fails, we still have the cached version
            console.log('Failed to update cache for:', event.request.url);
          });
          
          return response;
        }
        
        // If no cached version, fetch from network
        return fetch(event.request);
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