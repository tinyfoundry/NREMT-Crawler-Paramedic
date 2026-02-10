const CACHE = 'paramedic-rpg-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/src/main.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
