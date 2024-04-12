importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
workbox.precaching.precacheAndRoute([
  { url: './css/main.css', revision: null },
  { url: './font/04b03b.ttf', revision: null },
  { url: './font/Tuson.ttf', revision: null },
  { url: './img/favi.png', revision: null },
  { url: './img/icon.png', revision: null },
  { url: './js/cloud.js', revision: null },
  { url: './js/global.js', revision: null },
  { url: './js/kabu.js', revision: null },
  { url: './js/mgba.js', revision: null },
  { url: './js/mgba.wasm', revision: null },
  { url: './js/nip.js', revision: null },
  { url: './index.html', revision: null },
  { url: './manifest.json', revision: null },
  { url: './sw.js', revision: null },
]);

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