// Service Worker for School Planner
const CACHE_NAME = 'school-planner-v7';
const OFFLINE_FALLBACK_PAGE = '/index.html';

// Pre-cache the application shell. The actual JS/CSS/font bundle has
// content-hashed filenames that change every build, so they can't be
// listed here -- discoverAndCacheAssets() below finds them by parsing
// index.html at runtime instead.
const urlsToCache = [
  '/',
  '/index.html',
  '/school.svg',
  '/terms.md',
  '/privacy.md',
  '/license.md',
];

// Parses the current index.html for every same-origin script/link/font
// reference (the real Vite output bundle) and caches each one. This is
// what makes "Update Cache" (and the initial install) actually leave the
// app usable offline -- previously that only re-primed the 5-file shell
// list above and never touched the real JS/CSS bundle, so unless a
// person happened to keep browsing online long enough for those to be
// cached opportunistically by the fetch handler below, going offline
// left the app with nothing to load.
async function discoverAndCacheAssets(cache) {
  try {
    const indexResp = await fetch('/index.html', { cache: 'no-store' });
    if (!indexResp || !indexResp.ok) return;
    const html = await indexResp.clone().text();
    cache.put('/index.html', indexResp);

    const urls = new Set();
    const attrRegex = /(?:src|href)=["']([^"']+)["']/g;
    let match;
    while ((match = attrRegex.exec(html)) !== null) {
      const url = match[1];
      // Only same-origin, real files (skip external links, anchors, data URIs)
      if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('data:')) {
        urls.add(url);
      }
    }

    await Promise.all(
      Array.from(urls).map(async (url) => {
        try {
          const resp = await fetch(url);
          if (resp && resp.status === 200) {
            await cache.put(url, resp);
          }
        } catch (_) {
          // ignore individual asset failures, best-effort
        }
      })
    );
  } catch (_) {
    // ignore, best-effort
  }

  // Belt-and-braces: also precache everything listed in the build-time
  // manifest (see vite.config.ts's assetManifestPlugin). index.html only
  // ever references the entry chunk, the manualChunks (vendor/router/
  // icons), and the stylesheet -- it never references route-level
  // code-split chunks (Settings, MarkbookPage, WeekViewPage), on-demand
  // heavy libraries (the jsPDF/html2canvas/DOMPurify chunk), or the font
  // files (only linked from inside the compiled CSS). Without this, going
  // offline before ever visiting those routes/features left them totally
  // broken because their JS had never been fetched, let alone cached.
  try {
    const manifestResp = await fetch('/asset-manifest.json', { cache: 'no-store' });
    if (manifestResp && manifestResp.ok) {
      const manifestUrls = await manifestResp.json();
      if (Array.isArray(manifestUrls)) {
        await Promise.all(
          manifestUrls.map(async (url) => {
            try {
              const resp = await fetch(url);
              if (resp && resp.status === 200) {
                await cache.put(url, resp);
              }
            } catch (_) {
              // ignore individual asset failures, best-effort
            }
          })
        );
      }
    }
  } catch (_) {
    // asset-manifest.json doesn't exist in dev (vite dev server) -- fine,
    // this is purely an enhancement over the index.html scan above.
  }
}

// Install: cache shell and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
        await discoverAndCacheAssets(cache);
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
          // Fetch the actual requested URL so any CDN-injected attributes/scripts remain consistent
          const fresh = await fetch(req);
          if (fresh && fresh.ok) {
            // Keep the offline copy in sync in the background. This has to
            // re-run the FULL asset discovery (not just re-fetch
            // index.html) -- otherwise, after a redeploy changes the
            // content-hashed JS/CSS filenames, this would overwrite the
            // cached index.html to reference the NEW hashes while the
            // cache still only contains the OLD build's files. The site
            // would then look perfectly cached (the entry still shows up
            // in Cache Storage) right up until an offline reload actually
            // needed one of those newly-referenced, never-cached files.
            try {
              const cache = await caches.open(CACHE_NAME);
              await discoverAndCacheAssets(cache);
            } catch (_) {}
            return fresh;
          }
          // Non-OK response: serve cached offline fallback if available
          const cached = await caches.match(OFFLINE_FALLBACK_PAGE);
          return cached || fresh;
        } catch (_) {
          // Offline: serve cached index.html
          const cached = await caches.match(OFFLINE_FALLBACK_PAGE);
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Cache-First for fonts and the hashed Vite build output (/assets/*).
  // These filenames are content-hashed by the build, so once one is
  // cached it can never go stale under that URL -- there's no reason to
  // wait on a network round-trip for it on every load, and serving
  // straight from cache means an offline reload doesn't depend on a
  // network attempt failing cleanly for every single chunk before falling
  // back (any one hanging or behaving oddly used to risk the reload
  // looking like it "didn't load").
  const isBuildAsset = url.origin === self.location.origin && url.pathname.startsWith('/assets/');
  const isFontRequest = req.destination === 'font' || /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname);
  if (isBuildAsset || isFontRequest) {
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
    const respond = (success) => {
      // Prefer a MessageChannel port if the client provided one (request/
      // response), otherwise fall back to posting straight back to the
      // client that sent the message. Previously nothing was ever sent
      // back, so the "Update Cache" button in Settings just assumed
      // success the instant the message was posted, regardless of whether
      // the service worker actually managed to refetch anything.
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ type: 'CACHE_UPDATED', success });
      } else if (event.source) {
        event.source.postMessage({ type: 'CACHE_UPDATED', success });
      }
    };
    event.waitUntil(
      updateCache()
        .then(() => respond(true))
        .catch(() => respond(false))
    );
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
  // Only swallow errors from individual URL fetches (best-effort, one bad
  // source shouldn't fail the whole update). A failure to even open the
  // cache is a real failure and should propagate so the caller (see the
  // 'message' handler above) can report it back to the UI instead of
  // silently claiming success.
  const cache = await caches.open(CACHE_NAME);
  for (const url of urlsToCache) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response.clone());
      }
    } catch (_) {}
  }
  await discoverAndCacheAssets(cache);
}