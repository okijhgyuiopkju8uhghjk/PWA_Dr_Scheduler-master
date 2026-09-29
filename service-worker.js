
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v2').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './styles/style.css',
        './scripts/app.js',
        './scripts/data.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Network-first strategy
      return fetch(event.request).then((fetchResponse) => {
        return caches.open('v2').then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      }).catch(() => {
        return response;
      });
    })
  );
});
