'use strict';

// Solo se cachean los archivos de la aplicación. Los datos médicos del usuario
// continúan guardándose en localStorage y no se copian al Service Worker.
const CACHE_NAME = 'cardioregistro-v33-pwa-mobile-01';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/estilos.css',
  './js/app.js',
  './js/datos.js',
  './js/graficos.js',
  './js/utilidades.js',
  './datos/respaldo-inicial.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Red primero: cuando hay conexión se usa siempre la versión publicada más
  // reciente. Si la red falla, se recurre a la copia local para poder trabajar.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('./index.html');
        throw new Error('Recurso no disponible sin conexión');
      })
  );
});
