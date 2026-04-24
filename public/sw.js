const CACHE_NAME = 'keycontrol-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      '/',
      '/index.html'
    ]))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    clients.claim()
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});