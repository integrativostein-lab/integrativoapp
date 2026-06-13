const CACHE_NAME = 'integra-v3';
const CACHE_FILES = ['/css/estilo.css', '/js/app.js', '/js/config.js', '/js/i18n.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((cache) => {
        if (cache !== CACHE_NAME) return caches.delete(cache);
        return null;
      })))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const isHtml = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match(request).then((response) => response || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(caches.match(request).then((response) => response || fetch(request)));
});