const CACHE_NAME = 'integrativo-pwa-v2';
const CACHE_FILES = [
  '/index2.html',
  '/css/estilo.css',
  '/css/home.css',
  '/css/pwa-install.css',
  '/js/config.js',
  '/js/catalogo-terapeutico.js',
  '/js/nav-publico.js',
  '/js/i18n.js',
  '/js/pwa-install.js',
  '/catalogo-terapeutico.json',
  '/manifest.json',
  '/img/favicons/favicon-192x192.png',
  '/img/logo.png'
];
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name);
        return null;
      })))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const isHtml = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match('/index2.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
