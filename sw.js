importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
workbox.setConfig({ debug: false });
let revision = '17';
revision = (parseInt(revision) + 1).toString();

workbox.precaching.precacheAndRoute([
  { url: './css/main.css', revision: revision },
  { url: './font/04b.ttf', revision: revision },
  { url: './font/04bf.ttf', revision: revision },
  { url: './font/Tuson.ttf', revision: revision },
  { url: './img/favi.png', revision: revision },
  { url: './img/icon.png', revision: revision },
  { url: './js/cloud.js', revision: revision },
  { url: './js/ocr.js', revision: revision },
  { url: './js/initialize.js', revision: revision },
  { url: './js/global.js', revision: revision },
  { url: './js/kabu.js', revision: revision },
  { url: './js/storage.js', revision: revision },
  { url: './js/welcome.js', revision: revision },
  { url: './js/emulator/mgba.js', revision: revision },
  { url: './js/emulator/mgba.wasm', revision: revision },
  { url: './js/library/nip.js', revision: revision },
  { url: './sw.js', revision: revision },
  { url: './index.html', revision: revision },
  { url: './manifest.json', revision: revision },
]);
workbox.routing.registerRoute(
  /\.(?:css|ttf|png|js|wasm|html|json)$/,
  async ({ event }) => {
    const cache = await caches.open('static-resources');
    const cachedResponse = await cache.match(event.request);
    const latestRevision = await fetchRevisionFromServer();
    if (navigator.onLine && latestRevision !== revision) {
      const networkResponse = await fetch(event.request);
      if (networkResponse.ok) {
        cache.put(event.request, networkResponse.clone());
        revision = latestRevision;
      }
      return networkResponse;
    } else {
      if (cachedResponse) {
        return cachedResponse;
      } else {
        return new Response('404', { status: 404 });
      }
    }
  }
);
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DELETE_CACHE') {
    if (navigator.onLine) {
      caches.open('static-resources').then((cache) => {
        cache.keys().then((keys) => {
          keys.forEach((request) => cache.delete(request));
        });
      });
    }
  }
});