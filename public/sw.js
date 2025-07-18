const CACHE_NAME = 'school-planner-v1';

// Install event - cache the main files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache the main HTML and any critical assets
        return cache.addAll([
          '/',
          '/index.html',
          '/public/school.svg'
        ]);
      })
      .then(() => {
        console.log('Initial cache files added successfully');
        // Force the service worker to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache addAll failed:', error);
      })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  console.log('Fetch event for:', event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('Not in cache, fetching from network:', event.request.url);
        
        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200) {
            console.log('Invalid response, not caching:', event.request.url);
            return response;
          }
          
          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              console.log('Caching new response:', event.request.url);
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.error('Failed to cache:', event.request.url, error);
            });
          
          return response;
        }).catch((error) => {
          console.error('Fetch failed:', event.request.url, error);
          // If fetch fails and we're offline, try to serve the main page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw error;
        });
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
}); 