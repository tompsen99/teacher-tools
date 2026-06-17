/**
 * Service Worker - Teacher Tools Site
 * Caches static assets for offline use and faster repeat visits
 * Strategy: Cache-first for static assets, network-first for dynamic content
 */

const CACHE_NAME = 'teacher-tools-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/theme.css',
  '/assets/css/icons.css',
  '/assets/js/config.js',
  '/assets/js/member.js',
  '/tools.json',
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.json'
];

const TOOL_PAGES_CACHE = 'teacher-tools-pages-v1';

// Install: pre-cache static assets (resilient - skips missing files)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static assets');
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          fetch(url).then(response => {
            if (response.ok) return cache.put(url, response);
          }).catch(() => console.log('[SW] Skip (not found):', url))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== TOOL_PAGES_CACHE)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests except CDN assets
  if (url.origin !== location.origin && !url.hostname.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // Tool HTML pages: network-first (try fresh, fall back to cache)
  if (url.pathname.startsWith('/tools/') && url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request, TOOL_PAGES_CACHE));
    return;
  }

  // Static assets: cache-first (serve from cache, update in background)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(event.request, CACHE_NAME));
});

// Check if a path is a static asset
function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => {
    const normalized = asset === '/' ? '/index.html' : asset;
    return pathname === normalized || pathname === asset;
  }) ||
  pathname.endsWith('.css') ||
  pathname.endsWith('.js') ||
  pathname.endsWith('.svg') ||
  pathname.endsWith('.png') ||
  pathname.endsWith('.ico') ||
  pathname.endsWith('.woff2');
}

// Cache-first strategy: serve from cache, update cache in background
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background (stale-while-revalidate)
    fetch(request).then(response => {
      if (response && response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Network-first strategy: try network, fall back to cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
