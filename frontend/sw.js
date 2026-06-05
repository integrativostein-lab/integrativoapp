const CACHE_NAME = 'integra-v2';
const CACHE_FILES = ['/', '/index.html', '/profissionais.html', '/css/estilo.css', '/js/app.js', '/js/config.js', '/js/i18n.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.map((cache) => { if (cache !== CACHE_NAME) return caches.delete(cache); }))));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});