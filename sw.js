/**
 * Service Worker for Math Quest
 * Caches core app shell for fast offline gameplay
 */

const CACHE_NAME = 'math-quest-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/audio.js',
  './js/storage.js',
  './js/confetti.js',
  './js/math-engine.js',
  './js/leaderboard.js',
  './js/arcade-games.js',
  './js/pvp-arena.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-cache warning during SW install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const reqUrl = new URL(event.request.url);
  if (reqUrl.pathname.startsWith('/api/')) {
    return;
  }
  const isSameOrigin = reqUrl.origin === self.location.origin;
  const isTailwindCdn = reqUrl.hostname === 'cdn.tailwindcss.com';
  if (!isSameOrigin && !isTailwindCdn) {
    return;
  }

  // Stale-while-revalidate for local assets and Tailwind runtime script
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
