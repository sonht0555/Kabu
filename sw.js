importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.routing.registerRoute(
  new workbox.routing.NavigationRoute(
    new workbox.strategies.StaleWhileRevalidate()
  )
);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== workbox.core.cacheNames.runtime) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
