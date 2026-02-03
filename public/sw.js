/**
 * UltriumAI Service Worker
 * Provides offline support and caching for PWA functionality
 */

// IMPORTANT:
// Never cache the SPA shell ("/") or JS/CSS bundles with cache-first.
// Doing so can serve a mixture of old/new chunks after a deploy, causing
// runtime crashes like "Invalid hook call" / "dispatcher is null".
const CACHE_NAME = 'ultriumai-v3';

// Only cache truly static assets that rarely change.
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/vanguard-favicon.png',
  '/vanguard-icon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Take over immediately without waiting for old SW to finish
  self.skipWaiting();
});

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('ultriumai-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for CDN assets
  if (url.origin !== location.origin && !url.hostname.includes('supabase')) {
    return;
  }

  // Always network-first for navigations/documents so deploys update immediately
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Always network-first for JS/CSS/worker to prevent stale bundles
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker'
  ) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for safe static assets (images/fonts/etc)
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network-first with cache population for same-origin static resources
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}
