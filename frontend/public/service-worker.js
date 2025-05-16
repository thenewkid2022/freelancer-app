// Standard Service Worker für PWA-Erkennung und Offline-Fähigkeit
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Standard: Netzwerk bevorzugen, fallback auf Cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
}); 